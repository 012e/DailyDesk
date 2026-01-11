import db from "@/lib/db";
import {
  boardsTable,
  cardsTable,
  listsTable,
  activitiesTable,
  boardMembersTable,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { randomUUID } from "crypto";
import type { CreateActivity } from "@/types/activities";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

/**
 * Helper function to get user info
 * First checks boardMembers table, if not found, checks if user is board owner
 */
async function getUserInfo(userId: string, boardId: string) {
  // First try to find in board members
  const member = await db
    .select({
      id: boardMembersTable.userId,
      name: boardMembersTable.name,
      email: boardMembersTable.email,
      avatar: boardMembersTable.avatar,
    })
    .from(boardMembersTable)
    .where(
      and(
        eq(boardMembersTable.userId, userId),
        eq(boardMembersTable.boardId, boardId)
      )
    )
    .limit(1);

  if (member.length > 0) {
    const initials = member[0].name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return {
      id: member[0].id,
      name: member[0].name,
      email: member[0].email,
      avatar: member[0].avatar || undefined,
      initials,
    };
  }

  // If not found in members, check if user is board owner
  const board = await db
    .select({
      userId: boardsTable.userId,
    })
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length > 0 && board[0].userId === userId) {
    // User is board owner, return basic info
    return {
      id: userId,
      name: "Board Owner",
      email: "",
      avatar: undefined,
      initials: "BO",
    };
  }

  return null;
}

/**
 * Helper function to verify card access and get boardId
 */
async function verifyCardAccess(cardId: string) {
  const result = await db
    .select({
      cardId: cardsTable.id,
      boardId: boardsTable.id,
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  if (result.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  return result[0].boardId;
}

/**
 * Log an activity for a card
 * This is an internal function called by other services when actions occur
 * Activities CANNOT be edited or deleted
 */
export async function logActivity(params: CreateActivity) {
  // Verify card exists and get boardId
  const boardId = await verifyCardAccess(params.cardId);

  // Create activity
  const activityId = randomUUID();
  const createdAt = new Date();

  await db.insert(activitiesTable).values({
    id: activityId,
    cardId: params.cardId,
    userId: params.userId,
    actionType: params.actionType,
    description: params.description,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    createdAt,
  });

  return {
    id: activityId,
    cardId: params.cardId,
    userId: params.userId,
    actionType: params.actionType,
    description: params.description,
    metadata: params.metadata || null,
    createdAt,
  };
}

/**
 * Get all activities for a card
 * Returns activities sorted by createdAt (oldest first)
 */
export async function getActivitiesForCard(userSub: string, cardId: string) {
  // Verify user has access to card
  const result = await db
    .select({
      cardId: cardsTable.id,
      boardId: boardsTable.id,
      boardUserId: boardsTable.userId,
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  if (result.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  if (result[0].boardUserId !== userSub) {
    throw new ServiceError("Không có quyền truy cập card này", 403);
  }

  const boardId = result[0].boardId;

  // Get all activities for this card
  const activities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.cardId, cardId))
    .orderBy(activitiesTable.createdAt); // Oldest first

  // Get unique user IDs
  const userIds = [...new Set(activities.map((a) => a.userId))];

  // Fetch user info for all users who performed actions
  const users = await db
    .select({
      userId: boardMembersTable.userId,
      name: boardMembersTable.name,
      email: boardMembersTable.email,
      avatar: boardMembersTable.avatar,
    })
    .from(boardMembersTable)
    .where(eq(boardMembersTable.boardId, boardId));

  // Create user map
  const userMap = new Map(
    users.map((u) => {
      const initials = u.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return [
        u.userId,
        {
          id: u.userId,
          name: u.name,
          email: u.email,
          avatar: u.avatar || undefined,
          initials,
        },
      ];
    })
  );

  // Combine activities with user info
  return activities.map((a) => ({
    id: a.id,
    cardId: a.cardId,
    userId: a.userId,
    actionType: a.actionType,
    description: a.description,
    metadata: a.metadata ? JSON.parse(a.metadata) : null,
    user:
      userMap.get(a.userId) ||
      {
        id: a.userId,
        name: "Unknown User",
        email: "",
        initials: "??",
      },
    createdAt: a.createdAt,
  }));
}

/**
 * Get timeline (comments + activities merged) for a card
 * Returns both comments and activities sorted by createdAt
 */
export async function getCardTimeline(userSub: string, cardId: string) {
  // Import comments service
  const { getCommentsForCard } = await import("./comments.service");

  // Get both comments and activities in parallel
  const [comments, activities] = await Promise.all([
    getCommentsForCard(userSub, cardId),
    getActivitiesForCard(userSub, cardId),
  ]);

  // Merge and sort by createdAt
  const timeline = [
    ...comments.map((c) => ({ ...c, type: "comment" as const })),
    ...activities.map((a) => ({ ...a, type: "activity" as const })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return timeline;
}

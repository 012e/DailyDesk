import db from "@/lib/db";
import {
  boardsTable,
  cardsTable,
  listsTable,
  commentsTable,
  boardMembersTable,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { randomUUID } from "crypto";
import type { CreateComment } from "@/types/comments";
import { checkPermission, checkBoardAccess, AuthorizationError } from "./authorization.service";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

// Re-export AuthorizationError for backwards compatibility
export { AuthorizationError };

/**
 * Helper function to get user info
 * First checks boardMembers table, if not found, checks if user is board owner
 * Returns user info or null if user has no access
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
    // In production, you should fetch from Clerk API or user table
    return {
      id: userId,
      name: "Board Owner", // Placeholder - should fetch from Clerk
      email: "", // Placeholder
      avatar: undefined,
      initials: "BO",
    };
  }

  return null;
}

/**
 * Helper function to verify user has access to a card
 * Returns { card, boardId } if access is granted
 */
async function verifyCardAccess(userSub: string, cardId: string, permission: "content:read" | "content:create" | "content:update" | "content:delete" = "content:read") {
  // Get card with its list and board info
  const result = await db
    .select({
      cardId: cardsTable.id,
      listId: listsTable.id,
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

  // Verify user has access to the board with required permission
  await checkPermission(result[0].boardId, userSub, permission);

  return {
    cardId: result[0].cardId,
    boardId: result[0].boardId,
  };
}

/**
 * Add a new comment to a card
 */
export async function addComment(
  userSub: string,
  cardId: string,
  req: CreateComment
) {
  // Verify access with content:create permission
  const { boardId } = await verifyCardAccess(userSub, cardId, "content:create");

  // Get user info
  const userInfo = await getUserInfo(userSub, boardId);
  if (!userInfo) {
    throw new ServiceError("Người dùng không phải thành viên của board", 403);
  }

  // Create comment
  const commentId = randomUUID();
  const createdAt = new Date();

  await db.insert(commentsTable).values({
    id: commentId,
    cardId,
    userId: userSub,
    content: req.content,
    createdAt,
  });

  // Return comment with user info
  return {
    id: commentId,
    cardId,
    userId: userSub,
    content: req.content,
    user: userInfo,
    createdAt,
  };
}

/**
 * Update a comment (only owner can update)
 */
export async function updateComment(
  userSub: string,
  commentId: string,
  content: string
) {
  // Get comment
  const comment = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  if (comment.length === 0) {
    throw new ServiceError("Comment không tồn tại", 404);
  }

  // Verify ownership
  if (comment[0].userId !== userSub) {
    throw new ServiceError("Chỉ có thể chỉnh sửa comment của chính mình", 403);
  }

  // Verify user still has access to the card
  const { boardId } = await verifyCardAccess(userSub, comment[0].cardId, "content:update");

  // Update comment
  await db
    .update(commentsTable)
    .set({ content })
    .where(eq(commentsTable.id, commentId));

  // Get user info
  const userInfo = await getUserInfo(userSub, boardId);
  if (!userInfo) {
    throw new ServiceError("Người dùng không có quyền truy cập", 403);
  }

  // Return updated comment with user info
  return {
    id: commentId,
    cardId: comment[0].cardId,
    userId: userSub,
    content,
    user: userInfo,
    createdAt: comment[0].createdAt,
  };
}

/**
 * Delete a comment (only owner can delete)
 */
export async function deleteComment(userSub: string, commentId: string) {
  // Get comment
  const comment = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  if (comment.length === 0) {
    throw new ServiceError("Comment không tồn tại", 404);
  }

  // Verify ownership
  if (comment[0].userId !== userSub) {
    throw new ServiceError("Chỉ có thể xóa comment của chính mình", 403);
  }

  // Verify user still has access to the card
  await verifyCardAccess(userSub, comment[0].cardId, "content:delete");

  // Delete comment
  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));

  return { message: "Xóa comment thành công" };
}

/**
 * Get all comments for a card
 * Returns comments sorted by createdAt (oldest first - mới nhất ở dưới như Trello)
 */
export async function getCommentsForCard(userSub: string, cardId: string) {
  // Verify access with content:read permission
  const { boardId } = await verifyCardAccess(userSub, cardId, "content:read");

  // Get all comments for this card
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.cardId, cardId))
    .orderBy(commentsTable.createdAt); // Oldest first

  // Get unique user IDs
  const userIds = [...new Set(comments.map((c) => c.userId))];

  // Fetch user info for all commenters
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

  // Ensure board owner shows up even if not in board_members
  const boardOwner = await db
    .select({ userId: boardsTable.userId })
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (boardOwner.length > 0 && !userMap.has(boardOwner[0].userId)) {
    userMap.set(boardOwner[0].userId, {
      id: boardOwner[0].userId,
      name: "Board Owner",
      email: "",
      avatar: undefined,
      initials: "BO",
    });
  }

  // Combine comments with user info
  return comments.map((c) => ({
    id: c.id,
    cardId: c.cardId,
    userId: c.userId,
    content: c.content,
    user:
      userMap.get(c.userId) ||
      {
        id: c.userId,
        name: "Unknown User",
        email: "",
        avatar: undefined,
        initials: "??",
      },
    createdAt: c.createdAt,
  }));
}

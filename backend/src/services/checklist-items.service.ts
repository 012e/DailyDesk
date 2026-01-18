import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable, checklistItemsTable, checklistItemMembersTable, boardMembersTable } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { checkPermission, AuthorizationError } from "./authorization.service";

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

// Helper function to get checklist item with members
async function getChecklistItemWithMembers(checklistItemId: string) {
  const checklistItem = await db
    .select({
      id: checklistItemsTable.id,
      name: checklistItemsTable.name,
      completed: checklistItemsTable.completed,
      order: checklistItemsTable.order,
      cardId: checklistItemsTable.cardId,
    })
    .from(checklistItemsTable)
    .where(eq(checklistItemsTable.id, checklistItemId))
    .limit(1);

  if (checklistItem.length === 0) {
    throw new ServiceError("Checklist Item không tồn tại", 404);
  }

  // Get members
  const members = await db
    .select({
      id: boardMembersTable.id,
      name: boardMembersTable.name,
      email: boardMembersTable.email,
      avatar: boardMembersTable.avatar,
    })
    .from(checklistItemMembersTable)
    .innerJoin(boardMembersTable, eq(checklistItemMembersTable.memberId, boardMembersTable.id))
    .where(eq(checklistItemMembersTable.checklistItemId, checklistItemId));

  const membersWithInitials = members.map((member) => ({
    ...member,
    initials: member.name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  }));

  return {
    ...checklistItem[0],
    members: membersWithInitials,
  };
}


export async function getChecklistItemsForCard(userSub: string, boardId: string, cardId: string) {
  // Check authorization - only need content:read permission
  await checkPermission(boardId, userSub, "content:read");

  const card = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  if (card[0].lists.boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  const checklistItems = await db
    .select({
      id: checklistItemsTable.id,
      name: checklistItemsTable.name,
      completed: checklistItemsTable.completed,
      order: checklistItemsTable.order,
      cardId: checklistItemsTable.cardId,
    })
    .from(checklistItemsTable)
    .where(eq(checklistItemsTable.cardId, cardId));

  // Get members for all checklist items
  const checklistItemIds = checklistItems.map((item) => item.id);
  let membersMap: Record<string, any[]> = {};

  if (checklistItemIds.length > 0) {
    const members = await db
      .select({
        checklistItemId: checklistItemMembersTable.checklistItemId,
        id: boardMembersTable.id,
        name: boardMembersTable.name,
        email: boardMembersTable.email,
        avatar: boardMembersTable.avatar,
      })
      .from(checklistItemMembersTable)
      .innerJoin(boardMembersTable, eq(checklistItemMembersTable.memberId, boardMembersTable.id))
      .where(sql`${checklistItemMembersTable.checklistItemId} IN (${sql.join(checklistItemIds.map(id => sql`${id}`), sql`, `)})`);

    // Group members by checklist item ID
    for (const member of members) {
      if (!membersMap[member.checklistItemId]) {
        membersMap[member.checklistItemId] = [];
      }
      
      // Generate initials from name
      const initials = member.name
        .split(" ")
        .map((word: string) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      membersMap[member.checklistItemId].push({
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        initials,
      });
    }
  }

  // Attach members to checklist items
  return checklistItems.map((item) => ({
    ...item,
    members: membersMap[item.id] || [],
  }));
}

export async function createChecklistItem(userSub: string, boardId: string, cardId: string, req: any) {
  // Check authorization - need content:create permission (member, admin, owner)
  await checkPermission(boardId, userSub, "content:create");

  const card = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  if (card[0].lists.boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  const checklistItem = await db
    .insert(checklistItemsTable)
    .values({
      id: req.id,
      name: req.name,
      completed: req.completed ?? false,
      order: req.order,
      cardId: cardId,
    })
    .returning();

  // Handle members if provided
  if (req.members && req.members.length > 0) {
    const memberIds = req.members.map((m: any) => m.id);
    
    // Validate members exist and belong to the board
    const validMembers = await db
      .select()
      .from(boardMembersTable)
      .where(sql`${boardMembersTable.id} IN (${sql.join(memberIds.map((id: string) => sql`${id}`), sql`, `)}) AND ${boardMembersTable.boardId} = ${boardId}`);

    if (validMembers.length !== memberIds.length) {
      throw new ServiceError("Một hoặc nhiều thành viên không hợp lệ", 400);
    }

    // Insert checklist item members
    await db.insert(checklistItemMembersTable).values(
      memberIds.map((memberId: string) => ({
        checklistItemId: checklistItem[0].id,
        memberId,
      }))
    );
  }

  // Fetch and return with members
  return getChecklistItemWithMembers(checklistItem[0].id);
}

export async function getChecklistItemById(userSub: string, boardId: string, cardId: string, id: string) {
  // Check authorization - only need content:read permission
  await checkPermission(boardId, userSub, "content:read");

  const card = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  if (card[0].lists.boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  const checklistItem = await getChecklistItemWithMembers(id);

  if (checklistItem.cardId !== cardId) {
    throw new ServiceError("Checklist Item không thuộc Card này", 403);
  }

  return checklistItem;
}

export async function updateChecklistItem(userSub: string, boardId: string, cardId: string, id: string, req: any) {
  // Check authorization - need content:update permission (member, admin, owner)
  await checkPermission(boardId, userSub, "content:update");

  const card = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  if (card[0].lists.boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  const existingChecklistItem = await db
    .select()
    .from(checklistItemsTable)
    .where(eq(checklistItemsTable.id, id))
    .limit(1);

  if (existingChecklistItem.length === 0) {
    throw new ServiceError("Checklist Item không tồn tại", 404);
  }

  if (existingChecklistItem[0].cardId !== cardId) {
    throw new ServiceError("Checklist Item không thuộc Card này", 403);
  }

  // Update basic fields
  await db
    .update(checklistItemsTable)
    .set({
      name: req.name,
      completed: req.completed,
      order: req.order,
    })
    .where(eq(checklistItemsTable.id, id));

  // Handle members update if provided
  if (req.members !== undefined) {
    // Delete existing members
    await db
      .delete(checklistItemMembersTable)
      .where(eq(checklistItemMembersTable.checklistItemId, id));

    // Add new members
    if (req.members.length > 0) {
      const memberIds = req.members.map((m: any) => m.id);
      
      // Validate members exist and belong to the board
      const validMembers = await db
        .select()
        .from(boardMembersTable)
        .where(sql`${boardMembersTable.id} IN (${sql.join(memberIds.map((mid: string) => sql`${mid}`), sql`, `)}) AND ${boardMembersTable.boardId} = ${boardId}`);

      if (validMembers.length !== memberIds.length) {
        throw new ServiceError("Một hoặc nhiều thành viên không hợp lệ", 400);
      }

      await db.insert(checklistItemMembersTable).values(
        memberIds.map((memberId: string) => ({
          checklistItemId: id,
          memberId,
        }))
      );
    }
  }

  return getChecklistItemWithMembers(id);
}

export async function deleteChecklistItem(userSub: string, boardId: string, cardId: string, id: string) {
  // Check authorization - need content:delete permission (member, admin, owner)
  await checkPermission(boardId, userSub, "content:delete");

  const card = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  if (card[0].lists.boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  const existingChecklistItem = await db
    .select()
    .from(checklistItemsTable)
    .where(eq(checklistItemsTable.id, id))
    .limit(1);

  if (existingChecklistItem.length === 0) {
    throw new ServiceError("Checklist Item không tồn tại", 404);
  }

  if (existingChecklistItem[0].cardId !== cardId) {
    throw new ServiceError("Checklist Item không thuộc Card này", 403);
  }

  await db.delete(checklistItemsTable).where(eq(checklistItemsTable.id, id));

  return { message: "Xóa Checklist Item thành công" };
}

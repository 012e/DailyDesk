import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable, checklistItemsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  return checklistItems;
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

  return checklistItem[0];
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

  const checklistItem = await db
    .select({
      id: checklistItemsTable.id,
      name: checklistItemsTable.name,
      completed: checklistItemsTable.completed,
      order: checklistItemsTable.order,
      cardId: checklistItemsTable.cardId,
    })
    .from(checklistItemsTable)
    .where(eq(checklistItemsTable.id, id))
    .limit(1);

  if (checklistItem.length === 0) {
    throw new ServiceError("Checklist Item không tồn tại", 404);
  }

  if (checklistItem[0].cardId !== cardId) {
    throw new ServiceError("Checklist Item không thuộc Card này", 403);
  }

  return checklistItem[0];
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

  const updatedChecklistItem = await db
    .update(checklistItemsTable)
    .set({
      name: req.name,
      completed: req.completed,
      order: req.order,
    })
    .where(eq(checklistItemsTable.id, id))
    .returning();

  return updatedChecklistItem[0];
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

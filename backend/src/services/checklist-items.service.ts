import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable, checklistItemsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

export async function getChecklistItemsForCard(userSub: string, boardId: string, cardId: string) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

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
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền tạo Checklist Item trong Board này", 403);
  }

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
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

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
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

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
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

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

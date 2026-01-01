import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable } from "@/lib/db/schema";
import { eq, and, gte, gt, lt, lte, sql } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

// Note: `userSub` is the authenticated user's subject (user id)
export async function getCardsForBoard(userSub: string, boardId: string) {
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

  const cards = await db
    .select({
      id: cardsTable.id,
      name: cardsTable.name,
      order: cardsTable.order,
      listId: cardsTable.listId,
      startDate: cardsTable.startDate,
      deadline: cardsTable.deadline,
      latitude: cardsTable.latitude,
      longitude: cardsTable.longitude,
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(listsTable.boardId, boardId));

  return cards;
}

export async function createCard(userSub: string, boardId: string, req: any) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền tạo Card trong Board này", 403);
  }

  const list = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, req.listId))
    .limit(1);

  if (list.length === 0) {
    throw new ServiceError("List không tồn tại", 404);
  }

  if (list[0].boardId !== boardId) {
    throw new ServiceError("List không thuộc Board này", 403);
  }

  const cardsInList = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.listId, req.listId));

  const listSize = cardsInList.length;

  if (req.order < 0 || req.order > listSize) {
    throw new ServiceError(`Order must be between 0 and ${listSize} for this list`, 400);
  }

  const card = await db
    .insert(cardsTable)
    .values({
      id: req.id,
      name: req.name,
      order: req.order,
      listId: req.listId,
      startDate: req.startDate,
      deadline: req.deadline,
      latitude: req.latitude,
      longitude: req.longitude,
    })
    .returning();

  return card[0];
}

export async function getCardById(userSub: string, boardId: string, id: string) {
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
    .select({
      id: cardsTable.id,
      name: cardsTable.name,
      order: cardsTable.order,
      listId: cardsTable.listId,
      startDate: cardsTable.startDate,
      deadline: cardsTable.deadline,
      latitude: cardsTable.latitude,
      longitude: cardsTable.longitude,
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(cardsTable.id, id))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  const list = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, card[0].listId))
    .limit(1);

  if (list.length === 0 || list[0].boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  return card[0];
}

export async function updateCard(userSub: string, boardId: string, id: string, req: any) {
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

  const existingCard = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, id))
    .limit(1);

  if (existingCard.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  const currentList = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, existingCard[0].listId))
    .limit(1);

  if (currentList.length === 0 || currentList[0].boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  if (req.listId && req.listId !== existingCard[0].listId) {
    const newList = await db
      .select()
      .from(listsTable)
      .where(eq(listsTable.id, req.listId))
      .limit(1);

    if (newList.length === 0) {
      throw new ServiceError("List đích không tồn tại", 404);
    }

    if (newList[0].boardId !== boardId) {
      throw new ServiceError("List đích không thuộc Board này", 403);
    }
  }

  if (req.order !== undefined) {
    const targetListId = req.listId || existingCard[0].listId;
    const isMovingToNewList = req.listId && req.listId !== existingCard[0].listId;

    const cardsInTargetList = await db
      .select()
      .from(cardsTable)
      .where(
        isMovingToNewList
          ? eq(cardsTable.listId, targetListId)
          : and(
              eq(cardsTable.listId, targetListId),
              sql`${cardsTable.id} != ${id}`
            )
      );

    const targetListSize = cardsInTargetList.length;

    if (req.order < 0 || req.order > targetListSize) {
      throw new ServiceError(`Order must be between 0 and ${targetListSize} for this list`, 400);
    }
  }

  const isMovingToNewList = req.listId && req.listId !== existingCard[0].listId;
  const isChangingOrder = req.order !== undefined && req.order !== existingCard[0].order;

  if (isMovingToNewList || isChangingOrder) {
    const oldListId = existingCard[0].listId;
    const newListId = req.listId || oldListId;
    const oldOrder = existingCard[0].order;
    const newOrder = req.order !== undefined ? req.order : existingCard[0].order;

    if (isMovingToNewList) {
      await db
        .update(cardsTable)
        .set({
          order: sql`${cardsTable.order} - 1`,
        })
        .where(
          and(
            eq(cardsTable.listId, oldListId),
            gt(cardsTable.order, oldOrder)
          )
        );

      await db
        .update(cardsTable)
        .set({
          order: sql`${cardsTable.order} + 1`,
        })
        .where(
          and(
            eq(cardsTable.listId, newListId),
            gte(cardsTable.order, newOrder)
          )
        );
    } else {
      if (newOrder > oldOrder) {
        await db
          .update(cardsTable)
          .set({
            order: sql`${cardsTable.order} - 1`,
          })
          .where(
            and(
              eq(cardsTable.listId, oldListId),
              gt(cardsTable.order, oldOrder),
              lte(cardsTable.order, newOrder)
            )
          );
      } else {
        await db
          .update(cardsTable)
          .set({
            order: sql`${cardsTable.order} + 1`,
          })
          .where(
            and(
              eq(cardsTable.listId, oldListId),
              gte(cardsTable.order, newOrder),
              lt(cardsTable.order, oldOrder)
            )
          );
      }
    }
  }

  const updatedCard = await db
    .update(cardsTable)
    .set({
      name: req.name,
      order: req.order,
      listId: req.listId,
      startDate: req.startDate,
      deadline: req.deadline,
      latitude: req.latitude,
      longitude: req.longitude,
    })
    .where(eq(cardsTable.id, id))
    .returning();

  return updatedCard[0];
}

export async function deleteCard(userSub: string, boardId: string, id: string) {
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

  const existingCard = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, id))
    .limit(1);

  if (existingCard.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  const list = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, existingCard[0].listId))
    .limit(1);

  if (list.length === 0 || list[0].boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  const deletedCardOrder = existingCard[0].order;
  const deletedCardListId = existingCard[0].listId;

  await db.delete(cardsTable).where(eq(cardsTable.id, id));

  await db
    .update(cardsTable)
    .set({
      order: sql`${cardsTable.order} - 1`,
    })
    .where(
      and(
        eq(cardsTable.listId, deletedCardListId),
        gt(cardsTable.order, deletedCardOrder)
      )
    );

  return { message: "Xóa Card thành công" };
}

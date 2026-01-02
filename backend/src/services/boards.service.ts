import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

export async function getBoardsForUser(userSub: string) {
  const boards = await db.query.boardsTable.findMany({
    where: eq(boardsTable.userId, userSub),
    with: {
      lists: {
        orderBy: asc(listsTable.order),
        with: {
          cards: {
            orderBy: asc(cardsTable.order),
          },
        },
      },
    },
  });

  return boards;
}

export async function createBoard(userSub: string, req: any) {
  const board = await db
    .insert(boardsTable)
    .values({
      id: req.id,
      name: req.name,
      userId: userSub,
      backgroundUrl: req.backgroundUrl ?? null,
      backgroundColor: req.backgroundColor ?? null,
    })
    .returning();

  return board[0];
}

export async function getBoardById(userSub: string, id: string) {
  const board = await db.query.boardsTable.findFirst({
    where: eq(boardsTable.id, id),
    with: {
      lists: {
        orderBy: asc(listsTable.order),
        with: {
          cards: {
            orderBy: asc(cardsTable.order),
          },
        },
      },
    },
  });

  if (!board) throw new ServiceError("Board không tồn tại", 404);
  if (board.userId !== userSub) throw new ServiceError("Không có quyền truy cập Board này", 403);

  return board;
}

export async function updateBoard(userSub: string, id: string, req: any) {
  // Check if board exists and user owns it
  const existingBoard = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, id))
    .limit(1);

  if (existingBoard.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (existingBoard[0].userId !== userSub) {
    throw new ServiceError("Không có quyền cập nhật Board này", 403);
  }

  const updateData: {
    name?: string;
    backgroundUrl?: string | null;
    backgroundColor?: string | null;
  } = {};

  if (req.name !== undefined) updateData.name = req.name;
  if (req.backgroundUrl !== undefined) updateData.backgroundUrl = req.backgroundUrl;
  if (req.backgroundColor !== undefined) updateData.backgroundColor = req.backgroundColor;

  const updatedBoard = await db
    .update(boardsTable)
    .set(updateData)
    .where(eq(boardsTable.id, id))
    .returning();

  return updatedBoard[0];
}

export async function deleteBoard(userSub: string, id: string) {
  // Check if board exists and user owns it
  const existingBoard = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, id))
    .limit(1);

  if (existingBoard.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (existingBoard[0].userId !== userSub) {
    throw new ServiceError("Không có quyền xóa Board này", 403);
  }

  await db.delete(boardsTable).where(eq(boardsTable.id, id));

  return { message: "Xóa Board thành công" };
}

export async function getListsForBoard(userSub: string, id: string) {
  // Check if board exists and user owns it
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, id))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const lists = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.boardId, id));

  return lists;
}

export async function getCardsForBoard(userSub: string, id: string) {
  // Check if board exists and user owns it
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, id))
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
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(listsTable.boardId, id));

  return cards;
}

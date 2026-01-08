import db from "@/lib/db";
import { boardsTable, listsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { publishBoardChanged } from "./events.service";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

export async function getListsForBoard(userSub: string, boardId: string) {
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

  const lists = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.boardId, boardId));

  return lists;
}

export async function createList(userSub: string, boardId: string, req: any) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền tạo List trong Board này", 403);
  }

  const list = await db
    .insert(listsTable)
    .values({
      id: req.id,
      name: req.name,
      order: req.order,
      boardId: boardId,
    })
    .returning();

  // Publish list created event
  publishBoardChanged(boardId, 'list', list[0].id, 'created', userSub);

  return list[0];
}

export async function getListById(userSub: string, boardId: string, id: string) {
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

  const list = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, id))
    .limit(1);

  if (list.length === 0) {
    throw new ServiceError("List không tồn tại", 404);
  }

  if (list[0].boardId !== boardId) {
    throw new ServiceError("List không thuộc Board này", 403);
  }

  return list[0];
}

export async function updateList(userSub: string, boardId: string, id: string, req: any) {
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

  const existingList = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, id))
    .limit(1);

  if (existingList.length === 0) {
    throw new ServiceError("List không tồn tại", 404);
  }

  if (existingList[0].boardId !== boardId) {
    throw new ServiceError("List không thuộc Board này", 403);
  }

  const updatedList = await db
    .update(listsTable)
    .set({
      name: req.name,
      order: req.order,
    })
    .where(eq(listsTable.id, id))
    .returning();

  // Publish list updated event
  publishBoardChanged(boardId, 'list', id, 'updated', userSub);

  return updatedList[0];
}

export async function deleteList(userSub: string, boardId: string, id: string) {
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

  const existingList = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, id))
    .limit(1);

  if (existingList.length === 0) {
    throw new ServiceError("List không tồn tại", 404);
  }

  if (existingList[0].boardId !== boardId) {
    throw new ServiceError("List không thuộc Board này", 403);
  }

  await db.delete(listsTable).where(eq(listsTable.id, id));

  // Publish list deleted event
  publishBoardChanged(boardId, 'list', id, 'deleted', userSub);

  return { message: "Xóa List thành công" };
}

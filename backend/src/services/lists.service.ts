import db from "@/lib/db";
import { boardsTable, listsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { publishBoardChanged } from "./events.service";
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

export async function getListsForBoard(userSub: string, boardId: string) {
  // Check authorization - only need content:read permission
  await checkPermission(boardId, userSub, "content:read");

  const lists = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.boardId, boardId));

  return lists;
}

export async function createList(userSub: string, boardId: string, req: any) {
  // Check authorization - need content:create permission (member, admin, owner)
  await checkPermission(boardId, userSub, "content:create");

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
  // Check authorization - only need content:read permission
  await checkPermission(boardId, userSub, "content:read");

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
  // Check authorization - need content:update permission (member, admin, owner)
  await checkPermission(boardId, userSub, "content:update");

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
  // Check authorization - need content:delete permission (member, admin, owner)
  await checkPermission(boardId, userSub, "content:delete");

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

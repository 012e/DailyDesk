import db from "@/lib/db";
import { boardsTable, listsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  ListSchema,
  CreateListSchema,
  UpdateListSchema,
} from "@/types/lists";

const TAGS = ["Lists"];

export default function createListRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /boards/{boardId}/lists - Get all lists for a board
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/lists",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
      },
      responses: {
        200: successJson(ListSchema.array(), {
          description: "Lấy danh sách Lists thành công",
        }),
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền truy cập Board này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId } = c.req.valid("param");

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (board[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền truy cập Board này" }, 403);
      }

      const lists = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.boardId, boardId));

      return c.json(lists);
    },
  );

  // POST /boards/{boardId}/lists - Create a new list
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/lists",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
        body: jsonBody(CreateListSchema),
      },
      responses: {
        200: successJson(ListSchema, {
          description: "Tạo List thành công",
        }),
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền tạo List trong Board này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId } = c.req.valid("param");
      const req = c.req.valid("json");

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (board[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền tạo List trong Board này" }, 403);
      }

      const list = await db
        .insert(listsTable)
        .values({
          name: req.name,
          order: req.order,
          boardId: boardId,
        })
        .returning();

      return c.json(list[0]);
    },
  );

  // GET /boards/{boardId}/lists/{id} - Get a specific list
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/lists/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: successJson(ListSchema, {
          description: "Lấy List thành công",
        }),
        404: {
          description: "List hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền truy cập List này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, id } = c.req.valid("param");

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (board[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền truy cập Board này" }, 403);
      }

      // Get the list
      const list = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.id, id))
        .limit(1);

      if (list.length === 0) {
        return c.json({ error: "List không tồn tại" }, 404);
      }

      if (list[0].boardId !== boardId) {
        return c.json({ error: "List không thuộc Board này" }, 403);
      }

      return c.json(list[0]);
    },
  );

  // PUT /boards/{boardId}/lists/{id} - Update a list
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{boardId}/lists/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
        body: jsonBody(UpdateListSchema),
      },
      responses: {
        200: successJson(ListSchema, {
          description: "Cập nhật List thành công",
        }),
        404: {
          description: "List hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật List này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, id } = c.req.valid("param");
      const req = c.req.valid("json");

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (board[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền truy cập Board này" }, 403);
      }

      // Check if list exists and belongs to the board
      const existingList = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.id, id))
        .limit(1);

      if (existingList.length === 0) {
        return c.json({ error: "List không tồn tại" }, 404);
      }

      if (existingList[0].boardId !== boardId) {
        return c.json({ error: "List không thuộc Board này" }, 403);
      }

      const updatedList = await db
        .update(listsTable)
        .set({
          name: req.name,
          order: req.order,
        })
        .where(eq(listsTable.id, id))
        .returning();

      return c.json(updatedList[0]);
    },
  );

  // DELETE /boards/{boardId}/lists/{id} - Delete a list
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/lists/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa List thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "List hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa List này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, id } = c.req.valid("param");

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (board[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền truy cập Board này" }, 403);
      }

      // Check if list exists and belongs to the board
      const existingList = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.id, id))
        .limit(1);

      if (existingList.length === 0) {
        return c.json({ error: "List không tồn tại" }, 404);
      }

      if (existingList[0].boardId !== boardId) {
        return c.json({ error: "List không thuộc Board này" }, 403);
      }

      await db.delete(listsTable).where(eq(listsTable.id, id));

      return c.json({ message: "Xóa List thành công" });
    },
  );

  return app;
}

import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  BoardSchema,
  CreateBoardSchema,
  UpdateBoardSchema,
} from "@/types/boards";
import { ListSchema } from "@/types/lists";
import { CardSchema } from "@/types/cards";

const TAGS = ["Boards"];
export default function createBoardRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/",
      security: defaultSecurityScheme(),
      responses: {
        200: successJson(BoardSchema.array(), {
          description: "Lấy Board thành công",
        }),
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const boards = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.userId, user.sub));

      return c.json(boards);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      request: {
        body: jsonBody(CreateBoardSchema),
      },
      path: "/",
      security: defaultSecurityScheme(),
      responses: {
        200: successJson(BoardSchema, {
          description: "Tạo Board thành công",
        }),
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const req = c.req.valid("json");
      const board = await db
        .insert(boardsTable)
        .values({
          name: req.name,
          userId: user.sub,
        })
        .returning();

      return c.json(board[0]);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
        }),
      },
      responses: {
        200: successJson(BoardSchema, {
          description: "Lấy Board thành công",
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
      const { id } = c.req.valid("param");

      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, id))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (board[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền truy cập Board này" }, 403);
      }

      return c.json(board[0]);
    },
  );

  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
        }),
        body: jsonBody(UpdateBoardSchema),
      },
      responses: {
        200: successJson(BoardSchema, {
          description: "Cập nhật Board thành công",
        }),
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Board này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { id } = c.req.valid("param");
      const req = c.req.valid("json");

      // Check if board exists and user owns it
      const existingBoard = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, id))
        .limit(1);

      if (existingBoard.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (existingBoard[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền cập nhật Board này" }, 403);
      }

      const updatedBoard = await db
        .update(boardsTable)
        .set({
          name: req.name,
        })
        .where(eq(boardsTable.id, id))
        .returning();

      return c.json(updatedBoard[0]);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa Board thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa Board này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { id } = c.req.valid("param");

      // Check if board exists and user owns it
      const existingBoard = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, id))
        .limit(1);

      if (existingBoard.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (existingBoard[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền xóa Board này" }, 403);
      }

      await db.delete(boardsTable).where(eq(boardsTable.id, id));

      return c.json({ message: "Xóa Board thành công" });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{id}/lists",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
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
      const { id } = c.req.valid("param");

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, id))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (board[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền truy cập Board này" }, 403);
      }

      // Get all lists for this board
      const lists = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.boardId, id));

      return c.json(lists);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{id}/cards",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
        }),
      },
      responses: {
        200: successJson(CardSchema.array(), {
          description: "Lấy danh sách Cards thành công",
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
      const { id } = c.req.valid("param");

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, id))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      if (board[0].userId !== user.sub) {
        return c.json({ error: "Không có quyền truy cập Board này" }, 403);
      }

      // Get all cards for this board by joining with lists
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

      return c.json(cards);
    },
  );

  return app;
}

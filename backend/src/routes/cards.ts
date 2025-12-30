import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import { CardSchema, CreateCardSchema, UpdateCardSchema } from "@/types/cards";

const TAGS = ["Cards"];

export default function createCardRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /boards/{boardId}/cards - Get all cards for a board
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
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
        .where(eq(listsTable.boardId, boardId));

      return c.json(cards);
    }
  );

  // POST /boards/{boardId}/cards - Create a new card
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/cards",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
        body: jsonBody(
          CreateCardSchema.extend({
            listId: z.uuid(),
          })
        ),
      },
      responses: {
        200: successJson(CardSchema, {
          description: "Tạo Card thành công",
        }),
        404: {
          description: "Board hoặc List không tồn tại",
        },
        403: {
          description: "Không có quyền tạo Card trong Board này",
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
        return c.json(
          { error: "Không có quyền tạo Card trong Board này" },
          403
        );
      }

      // Check if list exists and belongs to the board
      const list = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.id, req.listId))
        .limit(1);

      if (list.length === 0) {
        return c.json({ error: "List không tồn tại" }, 404);
      }

      if (list[0].boardId !== boardId) {
        return c.json({ error: "List không thuộc Board này" }, 403);
      }

      const card = await db
        .insert(cardsTable)
        .values({
          id: req.id,
          name: req.name,
          order: req.order,
          listId: req.listId,
        })
        .returning();

      return c.json(card[0]);
    }
  );

  // GET /boards/{boardId}/cards/{id} - Get a specific card
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: successJson(CardSchema, {
          description: "Lấy Card thành công",
        }),
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền truy cập Card này",
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

      // Get the card and verify it belongs to a list in this board
      const card = await db
        .select({
          id: cardsTable.id,
          name: cardsTable.name,
          order: cardsTable.order,
          listId: cardsTable.listId,
        })
        .from(cardsTable)
        .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
        .where(eq(cardsTable.id, id))
        .limit(1);

      if (card.length === 0) {
        return c.json({ error: "Card không tồn tại" }, 404);
      }

      // Verify the card belongs to a list in this board
      const list = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.id, card[0].listId))
        .limit(1);

      if (list.length === 0 || list[0].boardId !== boardId) {
        return c.json({ error: "Card không thuộc Board này" }, 403);
      }

      return c.json(card[0]);
    }
  );

  // PUT /boards/{boardId}/cards/{id} - Update a card
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{boardId}/cards/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
        body: jsonBody(
          UpdateCardSchema.extend({
            listId: z.uuid().optional(),
          })
        ),
      },
      responses: {
        200: successJson(CardSchema, {
          description: "Cập nhật Card thành công",
        }),
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Card này",
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

      // Check if card exists
      const existingCard = await db
        .select()
        .from(cardsTable)
        .where(eq(cardsTable.id, id))
        .limit(1);

      if (existingCard.length === 0) {
        return c.json({ error: "Card không tồn tại" }, 404);
      }

      // Verify the card belongs to a list in this board
      const currentList = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.id, existingCard[0].listId))
        .limit(1);

      if (currentList.length === 0 || currentList[0].boardId !== boardId) {
        return c.json({ error: "Card không thuộc Board này" }, 403);
      }

      // If moving to a new list, verify it belongs to the same board
      if (req.listId && req.listId !== existingCard[0].listId) {
        const newList = await db
          .select()
          .from(listsTable)
          .where(eq(listsTable.id, req.listId))
          .limit(1);

        if (newList.length === 0) {
          return c.json({ error: "List đích không tồn tại" }, 404);
        }

        if (newList[0].boardId !== boardId) {
          return c.json({ error: "List đích không thuộc Board này" }, 403);
        }
      }

      const updatedCard = await db
        .update(cardsTable)
        .set({
          name: req.name,
          order: req.order,
          listId: req.listId,
          coverColor: req.coverColor,
        })
        .where(eq(cardsTable.id, id))
        .returning();

      return c.json(updatedCard[0]);
    }
  );

  // DELETE /boards/{boardId}/cards/{id} - Delete a card
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/cards/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa Card thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa Card này",
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

      // Check if card exists
      const existingCard = await db
        .select()
        .from(cardsTable)
        .where(eq(cardsTable.id, id))
        .limit(1);

      if (existingCard.length === 0) {
        return c.json({ error: "Card không tồn tại" }, 404);
      }

      // Verify the card belongs to a list in this board
      const list = await db
        .select()
        .from(listsTable)
        .where(eq(listsTable.id, existingCard[0].listId))
        .limit(1);

      if (list.length === 0 || list[0].boardId !== boardId) {
        return c.json({ error: "Card không thuộc Board này" }, 403);
      }

      await db.delete(cardsTable).where(eq(cardsTable.id, id));

      return c.json({ message: "Xóa Card thành công" });
    }
  );

  return app;
}

import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable, checklistItemsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  ChecklistItemSchema,
  CreateChecklistItemSchema,
  UpdateChecklistItemSchema,
} from "@/types/checklist-items";

const TAGS = ["Checklist Items"];

export default function createChecklistItemRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /boards/{boardId}/cards/{cardId}/checklist-items - Get all checklist items for a card
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/checklist-items",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
        }),
      },
      responses: {
        200: successJson(ChecklistItemSchema.array(), {
          description: "Lấy danh sách Checklist Items thành công",
        }),
        404: {
          description: "Board hoặc Card không tồn tại",
        },
        403: {
          description: "Không có quyền truy cập Board này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId } = c.req.valid("param");

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

      // Check if card exists and belongs to a list in this board
      const card = await db
        .select()
        .from(cardsTable)
        .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
        .where(eq(cardsTable.id, cardId))
        .limit(1);

      if (card.length === 0) {
        return c.json({ error: "Card không tồn tại" }, 404);
      }

      if (card[0].lists.boardId !== boardId) {
        return c.json({ error: "Card không thuộc Board này" }, 403);
      }

      // Get all checklist items for this card
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

      return c.json(checklistItems);
    },
  );

  // POST /boards/{boardId}/cards/{cardId}/checklist-items - Create a new checklist item
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/checklist-items",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
        }),
        body: jsonBody(CreateChecklistItemSchema),
      },
      responses: {
        200: successJson(ChecklistItemSchema, {
          description: "Tạo Checklist Item thành công",
        }),
        404: {
          description: "Board hoặc Card không tồn tại",
        },
        403: {
          description: "Không có quyền tạo Checklist Item trong Card này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId } = c.req.valid("param");
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
        return c.json({ error: "Không có quyền tạo Checklist Item trong Board này" }, 403);
      }

      // Check if card exists and belongs to a list in this board
      const card = await db
        .select()
        .from(cardsTable)
        .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
        .where(eq(cardsTable.id, cardId))
        .limit(1);

      if (card.length === 0) {
        return c.json({ error: "Card không tồn tại" }, 404);
      }

      if (card[0].lists.boardId !== boardId) {
        return c.json({ error: "Card không thuộc Board này" }, 403);
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

      return c.json(checklistItem[0]);
    },
  );

  // GET /boards/{boardId}/cards/{cardId}/checklist-items/{id} - Get a specific checklist item
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/checklist-items/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: successJson(ChecklistItemSchema, {
          description: "Lấy Checklist Item thành công",
        }),
        404: {
          description: "Checklist Item, Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền truy cập Checklist Item này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId, id } = c.req.valid("param");

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

      // Check if card exists and belongs to a list in this board
      const card = await db
        .select()
        .from(cardsTable)
        .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
        .where(eq(cardsTable.id, cardId))
        .limit(1);

      if (card.length === 0) {
        return c.json({ error: "Card không tồn tại" }, 404);
      }

      if (card[0].lists.boardId !== boardId) {
        return c.json({ error: "Card không thuộc Board này" }, 403);
      }

      // Get the checklist item
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
        return c.json({ error: "Checklist Item không tồn tại" }, 404);
      }

      if (checklistItem[0].cardId !== cardId) {
        return c.json({ error: "Checklist Item không thuộc Card này" }, 403);
      }

      return c.json(checklistItem[0]);
    },
  );

  // PUT /boards/{boardId}/cards/{cardId}/checklist-items/{id} - Update a checklist item
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/checklist-items/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
          id: z.uuid(),
        }),
        body: jsonBody(UpdateChecklistItemSchema),
      },
      responses: {
        200: successJson(ChecklistItemSchema, {
          description: "Cập nhật Checklist Item thành công",
        }),
        404: {
          description: "Checklist Item, Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Checklist Item này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId, id } = c.req.valid("param");
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

      // Check if card exists and belongs to a list in this board
      const card = await db
        .select()
        .from(cardsTable)
        .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
        .where(eq(cardsTable.id, cardId))
        .limit(1);

      if (card.length === 0) {
        return c.json({ error: "Card không tồn tại" }, 404);
      }

      if (card[0].lists.boardId !== boardId) {
        return c.json({ error: "Card không thuộc Board này" }, 403);
      }

      // Check if checklist item exists
      const existingChecklistItem = await db
        .select()
        .from(checklistItemsTable)
        .where(eq(checklistItemsTable.id, id))
        .limit(1);

      if (existingChecklistItem.length === 0) {
        return c.json({ error: "Checklist Item không tồn tại" }, 404);
      }

      if (existingChecklistItem[0].cardId !== cardId) {
        return c.json({ error: "Checklist Item không thuộc Card này" }, 403);
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

      return c.json(updatedChecklistItem[0]);
    },
  );

  // DELETE /boards/{boardId}/cards/{cardId}/checklist-items/{id} - Delete a checklist item
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/checklist-items/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa Checklist Item thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Checklist Item, Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa Checklist Item này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId, id } = c.req.valid("param");

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

      // Check if card exists and belongs to a list in this board
      const card = await db
        .select()
        .from(cardsTable)
        .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
        .where(eq(cardsTable.id, cardId))
        .limit(1);

      if (card.length === 0) {
        return c.json({ error: "Card không tồn tại" }, 404);
      }

      if (card[0].lists.boardId !== boardId) {
        return c.json({ error: "Card không thuộc Board này" }, 403);
      }

      // Check if checklist item exists
      const existingChecklistItem = await db
        .select()
        .from(checklistItemsTable)
        .where(eq(checklistItemsTable.id, id))
        .limit(1);

      if (existingChecklistItem.length === 0) {
        return c.json({ error: "Checklist Item không tồn tại" }, 404);
      }

      if (existingChecklistItem[0].cardId !== cardId) {
        return c.json({ error: "Checklist Item không thuộc Card này" }, 403);
      }

      await db.delete(checklistItemsTable).where(eq(checklistItemsTable.id, id));

      return c.json({ message: "Xóa Checklist Item thành công" });
    },
  );

  return app;
}

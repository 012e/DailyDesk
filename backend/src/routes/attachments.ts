import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { ensureUserAuthenticated } from "@/lib/utils";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import db from "@/lib/db";
import { attachmentsTable, cardsTable, listsTable, boardsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const TAGS = ["Attachments"];

const AttachmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  publicId: z.string().nullable(),
  type: z.string(),
  size: z.number().int(),
  uploadedAt: z.coerce.date(),
  uploadedBy: z.string(),
  cardId: z.string().uuid(),
});

const CreateAttachmentSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  publicId: z.string().optional(),
  type: z.string(),
  size: z.number().int(),
});

export default function createAttachmentRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/attachments",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.string().uuid(),
          cardId: z.string().uuid(),
        }),
        body: jsonBody(CreateAttachmentSchema),
      },
      responses: {
        200: successJson(AttachmentSchema, {
          description: "Tạo attachment thành công",
        }),
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền tạo attachment trong Board này",
        },
        500: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Internal server error",
        },
      },
    }),
    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId } = c.req.valid("param");
      const body = c.req.valid("json");

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

      const attachmentId = randomUUID();
      const result = await db
        .insert(attachmentsTable)
        .values({
          id: attachmentId,
          name: body.name,
          url: body.url,
          publicId: body.publicId || null,
          type: body.type,
          size: body.size,
          uploadedBy: user.sub,
          cardId: cardId,
        })
        .returning();

      return c.json(result[0], 200);
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/attachments",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.string().uuid(),
          cardId: z.string().uuid(),
        }),
      },
      responses: {
        200: successJson(AttachmentSchema.array(), {
          description: "Lấy danh sách attachments thành công",
        }),
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền truy cập Board này",
        },
        500: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Internal server error",
        },
      },
    }),
    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId } = c.req.valid("param");

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

      const attachments = await db
        .select()
        .from(attachmentsTable)
        .where(eq(attachmentsTable.cardId, cardId));

      return c.json(attachments, 200);
    }
  );

  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/attachments/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.string().uuid(),
          cardId: z.string().uuid(),
          id: z.string().uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa attachment thành công",
        },
        404: {
          description: "Attachment không tồn tại",
        },
        403: {
          description: "Không có quyền xóa attachment",
        },
        500: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Internal server error",
        },
      },
    }),
    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId, id } = c.req.valid("param");

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

      const attachment = await db
        .select()
        .from(attachmentsTable)
        .where(and(eq(attachmentsTable.id, id), eq(attachmentsTable.cardId, cardId)))
        .limit(1);

      if (attachment.length === 0) {
        return c.json({ error: "Attachment không tồn tại" }, 404);
      }

      await db.delete(attachmentsTable).where(eq(attachmentsTable.id, id));

      return c.json({ message: "Xóa attachment thành công" }, 200);
    }
  );

  return app;
}


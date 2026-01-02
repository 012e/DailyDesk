import db from "@/lib/db";
import { boardsTable, labelsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  LabelSchema,
  CreateLabelSchema,
  UpdateLabelSchema,
} from "@/types/labels";

const TAGS = ["Labels"];

export default function createLabelRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /boards/{boardId}/labels - Get all labels for a board
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/labels",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
      },
      responses: {
        200: successJson(LabelSchema.array(), {
          description: "Lấy danh sách Labels thành công",
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

      // Get all labels for this board
      const labels = await db
        .select()
        .from(labelsTable)
        .where(eq(labelsTable.boardId, boardId));

      return c.json(labels);
    },
  );

  // POST /boards/{boardId}/labels - Create a new label
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/labels",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
        body: jsonBody(CreateLabelSchema),
      },
      responses: {
        200: successJson(LabelSchema, {
          description: "Tạo Label thành công",
        }),
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền tạo Label trong Board này",
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
        return c.json({ error: "Không có quyền tạo Label trong Board này" }, 403);
      }

      const label = await db
        .insert(labelsTable)
        .values({
          id: req.id,
          name: req.name,
          color: req.color,
          boardId: boardId,
        })
        .returning();

      return c.json(label[0]);
    },
  );

  // PUT /boards/{boardId}/labels/{id} - Update a label
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{boardId}/labels/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
        body: jsonBody(UpdateLabelSchema),
      },
      responses: {
        200: successJson(LabelSchema, {
          description: "Cập nhật Label thành công",
        }),
        404: {
          description: "Label hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Label này",
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

      // Check if label exists and belongs to this board
      const existingLabel = await db
        .select()
        .from(labelsTable)
        .where(eq(labelsTable.id, id))
        .limit(1);

      if (existingLabel.length === 0) {
        return c.json({ error: "Label không tồn tại" }, 404);
      }

      if (existingLabel[0].boardId !== boardId) {
        return c.json({ error: "Label không thuộc Board này" }, 403);
      }

      const updatedLabel = await db
        .update(labelsTable)
        .set({
          name: req.name,
          color: req.color,
        })
        .where(eq(labelsTable.id, id))
        .returning();

      return c.json(updatedLabel[0]);
    },
  );

  // DELETE /boards/{boardId}/labels/{id} - Delete a label
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/labels/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa Label thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Label hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa Label này",
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

      // Check if label exists and belongs to this board
      const existingLabel = await db
        .select()
        .from(labelsTable)
        .where(eq(labelsTable.id, id))
        .limit(1);

      if (existingLabel.length === 0) {
        return c.json({ error: "Label không tồn tại" }, 404);
      }

      if (existingLabel[0].boardId !== boardId) {
        return c.json({ error: "Label không thuộc Board này" }, 403);
      }

      await db.delete(labelsTable).where(eq(labelsTable.id, id));

      return c.json({ message: "Xóa Label thành công" });
    },
  );

  return app;
}

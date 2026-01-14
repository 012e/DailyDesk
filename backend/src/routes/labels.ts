import db from "@/lib/db";
import { labelsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
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

  // GET /users/{userId}/labels - Get all labels for a user
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/users/{userId}/labels",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          userId: z.string(),
        }),
      },
      responses: {
        200: successJson(LabelSchema.array(), {
          description: "Lấy danh sách Labels thành công",
        }),
        403: {
          description: "Không có quyền truy cập Labels của user này",
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
      const { userId } = c.req.valid("param");

      // Users can only access their own labels (for now)
      // In the future, you might want to allow viewing other users' labels
      // for collaboration purposes
      
      // Get all labels for this user
      const labels = await db
        .select()
        .from(labelsTable)
        .where(eq(labelsTable.userId, userId));

      return c.json(labels, 200);
    },
  );

  // POST /users/{userId}/labels - Create a new label
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/users/{userId}/labels",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          userId: z.string(),
        }),
        body: jsonBody(CreateLabelSchema),
      },
      responses: {
        200: successJson(LabelSchema, {
          description: "Tạo Label thành công",
        }),
        403: {
          description: "Không có quyền tạo Label cho user này",
        },
        409: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Label với tên và màu này đã tồn tại",
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
      const { userId } = c.req.valid("param");
      const req = c.req.valid("json");

      // Users can only create labels for themselves
      if (user.sub !== userId) {
        return c.json({ error: "Không có quyền tạo Label cho user này" }, 403);
      }

      // Check if a label with the same name and color already exists for this user
      const existingLabel = await db
        .select()
        .from(labelsTable)
        .where(
          and(
            eq(labelsTable.userId, userId),
            eq(labelsTable.name, req.name),
            eq(labelsTable.color, req.color)
          )
        )
        .limit(1);

      if (existingLabel.length > 0) {
        return c.json({ error: "Label với tên và màu này đã tồn tại" }, 409);
      }

      const label = await db
        .insert(labelsTable)
        .values({
          id: req.id,
          name: req.name,
          color: req.color,
          userId: userId,
        })
        .returning();

      return c.json(label[0], 200);
    },
  );

  // PUT /users/{userId}/labels/{id} - Update a label
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/users/{userId}/labels/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          userId: z.string(),
          id: z.uuid(),
        }),
        body: jsonBody(UpdateLabelSchema),
      },
      responses: {
        200: successJson(LabelSchema, {
          description: "Cập nhật Label thành công",
        }),
        404: {
          description: "Label không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Label này",
        },
        409: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Label với tên và màu này đã tồn tại",
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
      const { userId, id } = c.req.valid("param");
      const req = c.req.valid("json");

      // Users can only update their own labels
      if (user.sub !== userId) {
        return c.json({ error: "Không có quyền cập nhật Label này" }, 403);
      }

      // Check if label exists and belongs to this user
      const existingLabel = await db
        .select()
        .from(labelsTable)
        .where(eq(labelsTable.id, id))
        .limit(1);

      if (existingLabel.length === 0) {
        return c.json({ error: "Label không tồn tại" }, 404);
      }

      if (existingLabel[0].userId !== userId) {
        return c.json({ error: "Label không thuộc user này" }, 403);
      }

      // Check if updating would create a duplicate (name + color combination)
      if (req.name !== undefined || req.color !== undefined) {
        const newName = req.name !== undefined ? req.name : existingLabel[0].name;
        const newColor = req.color !== undefined ? req.color : existingLabel[0].color;

        // Check if another label with this name and color already exists
        const duplicateLabel = await db
          .select()
          .from(labelsTable)
          .where(
            and(
              eq(labelsTable.userId, userId),
              eq(labelsTable.name, newName),
              eq(labelsTable.color, newColor)
            )
          )
          .limit(1);

        // If a duplicate exists and it's not the same label we're updating
        if (duplicateLabel.length > 0 && duplicateLabel[0].id !== id) {
          return c.json({ error: "Label với tên và màu này đã tồn tại" }, 409);
        }
      }

      const updatedLabel = await db
        .update(labelsTable)
        .set({
          name: req.name,
          color: req.color,
        })
        .where(eq(labelsTable.id, id))
        .returning();

      return c.json(updatedLabel[0], 200);
    },
  );

  // DELETE /users/{userId}/labels/{id} - Delete a label
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/users/{userId}/labels/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          userId: z.string(),
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
          description: "Label không tồn tại",
        },
        403: {
          description: "Không có quyền xóa Label này",
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
      const { userId, id } = c.req.valid("param");

      // Users can only delete their own labels
      if (user.sub !== userId) {
        return c.json({ error: "Không có quyền xóa Label này" }, 403);
      }

      // Check if label exists and belongs to this user
      const existingLabel = await db
        .select()
        .from(labelsTable)
        .where(eq(labelsTable.id, id))
        .limit(1);

      if (existingLabel.length === 0) {
        return c.json({ error: "Label không tồn tại" }, 404);
      }

      if (existingLabel[0].userId !== userId) {
        return c.json({ error: "Label không thuộc user này" }, 403);
      }

      await db.delete(labelsTable).where(eq(labelsTable.id, id));

      return c.json({ message: "Xóa Label thành công" }, 200);
    },
  );

  return app;
}

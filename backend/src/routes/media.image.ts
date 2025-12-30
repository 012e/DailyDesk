import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { ensureUserAuthenticated } from "@/lib/utils";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import db from "@/lib/db";
import { boardsTable, cardsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SaveImageBodySchema, SaveImageResponseSchema } from "@/types/media";
import { successJson, jsonBody, defaultSecurityScheme } from "@/types/openapi";

const TAGS = ["Media"];

const entityConfig = {
  board: {
    table: boardsTable,
    urlField: "backgroundUrl" as const,
    publicIdField: "backgroundPublicId" as const,
    authorization: true as const,
  },
  card: {
    table: cardsTable,
    urlField: "coverUrl" as const,
    publicIdField: "coverPublicId" as const,
    authorization: false as const,
  },
} as const;

export default function CreateImageRoute() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  app.openapi(
    createRoute({
      method: "post",
      path: "/image/{type}/{id}",
      tags: TAGS,
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          type: z.enum(["board", "card"]),
          id: z.string().uuid(),
        }),
        body: jsonBody(SaveImageBodySchema),
      },
      responses: {
        200: successJson(SaveImageResponseSchema),
        403: { description: "Không có quyền upload ảnh" },
        404: { description: "Không tìm thấy đối tượng" },
      },
    }),
    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { type, id } = c.req.valid("param");
      const { secure_url, public_id } = c.req.valid("json");
      const config = entityConfig[type];
      if (!config) return c.json({ error: "Invalid type" }, 400);

      const entity = await db
        .select()
        .from(config.table)
        .where(eq(config.table.id, id))
        .then((r) => r[0]);
      if (!entity) {
        await deleteFromCloudinary(public_id);
        return c.json({ error: `Không tìm thấy ${type}` }, 404);
      }
      if (config.authorization && entity.userId !== user.sub) {
        await deleteFromCloudinary(public_id);
        return c.json(
          { error: `Không có quyền upload ảnh của ${type} này` },
          403
        );
      }

      if (entity[config.publicIdField as keyof typeof entity])
        await deleteFromCloudinary(
          entity[config.publicIdField as keyof typeof entity] as string
        );

      const updated = await db
        .update(config.table)
        .set({
          [config.urlField]: secure_url,
          [config.publicIdField]: public_id,
        })
        .where(eq(config.table.id, id))
        .returning({
          [config.urlField]:
            config.table[config.urlField as keyof typeof entity],
          [config.publicIdField]:
            config.table[config.publicIdField as keyof typeof entity],
        })
        .then((r) => r[0]);

      return c.json(updated);
    }
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/image/{type}/{id}",
      tags: TAGS,
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          type: z.enum(["board", "card"]),
          id: z.string().uuid(),
        }),
      },
      responses: {
        200: { description: "Xóa ảnh thành công" },
        403: { description: "Không có quyền xóa ảnh" },
        404: { description: "Không tìm thấy đối tượng" },
      },
    }),
    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { type, id } = c.req.valid("param");
      const config = entityConfig[type];
      if (!config) return c.json({ error: "Invalid type" }, 400);

      const entity = await db
        .select()
        .from(config.table)
        .where(eq(config.table.id, id))
        .then((r) => r[0]);
      if (!entity) return c.json({ error: `Không tìm thấy ${type}` }, 404);
      if (config.authorization && entity.userId !== user.sub)
        return c.json({ error: `Không có quyền xóa ảnh của ${type} này` }, 403);

      if (entity[config.publicIdField as keyof typeof entity])
        await deleteFromCloudinary(
          entity[config.publicIdField as keyof typeof entity] as string
        );

      await db
        .update(config.table)
        .set({ [config.urlField]: null, [config.publicIdField]: null })
        .where(eq(config.table.id, id));

      return c.json({ message: "Xóa ảnh thành công" });
    }
  );

  return app;
}

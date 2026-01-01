import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { ensureUserAuthenticated } from "@/lib/utils";
import { SaveImageBodySchema, SaveImageResponseSchema } from "@/types/media";
import { successJson, jsonBody, defaultSecurityScheme } from "@/types/openapi";
import * as mediaService from "@/services/media.service";
import { boardsTable, cardsTable } from "@/lib/db/schema";

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

export default function createImageRoute() {
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
      try {
        const updated = await mediaService.saveImage(user.sub, type, id, secure_url, public_id);
        return c.json(updated);
      } catch (err: any) {
        if (err instanceof mediaService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
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
      try {
        const result = await mediaService.deleteImage(user.sub, type, id);
        return c.json(result);
      } catch (err: any) {
        if (err instanceof mediaService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    }
  );

  return app;
}

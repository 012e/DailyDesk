import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { ensureUserAuthenticated } from "@/lib/utils";
import { SaveImageBodySchema, SaveImageResponseSchema } from "@/types/media";
import { successJson, jsonBody, defaultSecurityScheme } from "@/types/openapi";
import * as mediaService from "@/services/media.service";

const TAGS = ["Media"];



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
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền upload ảnh",
        },
        404: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không tìm thấy đối tượng",
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
      const { type, id } = c.req.valid("param");
      const { secure_url, public_id } = c.req.valid("json");
      try {
        const updated = await mediaService.saveImage(user.sub, type, id, secure_url, public_id);
        return c.json(updated, 200);
      } catch (err: any) {
        if (err instanceof mediaService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in media.image POST route:", err);
        return c.json({ error: "Internal server error" }, 500);
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
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền xóa ảnh",
        },
        404: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không tìm thấy đối tượng",
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
      const { type, id } = c.req.valid("param");
      try {
        const result = await mediaService.deleteImage(user.sub, type, id);
        return c.json(result, 200);
      } catch (err: any) {
        if (err instanceof mediaService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in media.image DELETE route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

  return app;
}

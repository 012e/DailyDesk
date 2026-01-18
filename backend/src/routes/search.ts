import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, successJson } from "@/types/openapi";
import {
  searchQuerySchema,
  searchResponseSchema,
} from "@/types/search";
import * as searchService from "@/services/search.service";

const TAGS = ["Search"];

export default function createSearchRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/",
      security: defaultSecurityScheme(),
      summary: "Tìm kiếm đa dạng",
      description:
        "Tìm kiếm trên nhiều loại đối tượng: boards, cards, lists, comments, labels, và checklist items",
      request: {
        query: searchQuerySchema,
      },
      responses: {
        200: successJson(searchResponseSchema, {
          description: "Kết quả tìm kiếm",
        }),
        400: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Yêu cầu không hợp lệ",
        },
        401: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền truy cập",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const query = c.req.valid("query");

      const { results, total } = await searchService.search(query, user.sub);

      return c.json(
        {
          results,
          total,
          query: query.q,
        },
        200
      );
    }
  );

  return app;
}

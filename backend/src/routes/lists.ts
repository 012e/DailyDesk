import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  ListSchema,
  CreateListSchema,
  UpdateListSchema,
} from "@/types/lists";
import * as listsService from "@/services/lists.service";

const TAGS = ["Lists"];

export default function createListRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /boards/{boardId}/lists - Get all lists for a board
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/lists",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
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
      const { boardId } = c.req.valid("param");
      try {
        const lists = await listsService.getListsForBoard(user.sub, boardId);
        return c.json(lists, 200);
      } catch (err: any) {
        if (err instanceof listsService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in lists GET route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // POST /boards/{boardId}/lists - Create a new list
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/lists",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
        body: jsonBody(CreateListSchema),
      },
      responses: {
        200: successJson(ListSchema, {
          description: "Tạo List thành công",
        }),
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền tạo List trong Board này",
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
      const { boardId } = c.req.valid("param");
      const req = c.req.valid("json");
      try {
        const list = await listsService.createList(user.sub, boardId, req);
        return c.json(list, 200);
      } catch (err: any) {
        if (err instanceof listsService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in lists POST route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // GET /boards/{boardId}/lists/{id} - Get a specific list
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/lists/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: successJson(ListSchema, {
          description: "Lấy List thành công",
        }),
        404: {
          description: "List hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền truy cập List này",
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
      const { boardId, id } = c.req.valid("param");
      try {
        const list = await listsService.getListById(user.sub, boardId, id);
        return c.json(list, 200);
      } catch (err: any) {
        if (err instanceof listsService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in lists GET by ID route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // PUT /boards/{boardId}/lists/{id} - Update a list
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{boardId}/lists/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
        body: jsonBody(UpdateListSchema),
      },
      responses: {
        200: successJson(ListSchema, {
          description: "Cập nhật List thành công",
        }),
        404: {
          description: "List hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật List này",
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
      const { boardId, id } = c.req.valid("param");
      const req = c.req.valid("json");
      try {
        const updated = await listsService.updateList(user.sub, boardId, id, req);
        return c.json(updated, 200);
      } catch (err: any) {
        if (err instanceof listsService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in lists PUT route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // DELETE /boards/{boardId}/lists/{id} - Delete a list
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/lists/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa List thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "List hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa List này",
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
      const { boardId, id } = c.req.valid("param");
      try {
        const result = await listsService.deleteList(user.sub, boardId, id);
        return c.json(result, 200);
      } catch (err: any) {
        if (err instanceof listsService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in lists DELETE route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  return app;
}

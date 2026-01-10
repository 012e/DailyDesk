import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  ChecklistItemSchema,
  CreateChecklistItemSchema,
  UpdateChecklistItemSchema,
} from "@/types/checklist-items";
import * as checklistService from "@/services/checklist-items.service";

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
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Board hoặc Card không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
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
      try {
        const items = await checklistService.getChecklistItemsForCard(user.sub, boardId, cardId);
        return c.json(items);
      } catch (err: any) {
        if (err instanceof checklistService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in checklist-items GET route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
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
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Board hoặc Card không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền tạo Checklist Item trong Card này",
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
      const req = c.req.valid("json");
      try {
        const item = await checklistService.createChecklistItem(user.sub, boardId, cardId, req);
        return c.json(item);
      } catch (err: any) {
        if (err instanceof checklistService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in checklist-items POST route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
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
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Checklist Item, Card hoặc Board không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền truy cập Checklist Item này",
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
      try {
        const item = await checklistService.getChecklistItemById(user.sub, boardId, cardId, id);
        return c.json(item);
      } catch (err: any) {
        if (err instanceof checklistService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in checklist-items GET by ID route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
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
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Checklist Item, Card hoặc Board không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền cập nhật Checklist Item này",
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
      const req = c.req.valid("json");
      try {
        const updated = await checklistService.updateChecklistItem(user.sub, boardId, cardId, id, req);
        return c.json(updated);
      } catch (err: any) {
        if (err instanceof checklistService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in checklist-items PUT route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
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
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Checklist Item, Card hoặc Board không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền xóa Checklist Item này",
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
      try {
        const result = await checklistService.deleteChecklistItem(user.sub, boardId, cardId, id);
        return c.json(result);
      } catch (err: any) {
        if (err instanceof checklistService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in checklist-items DELETE route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  return app;
}

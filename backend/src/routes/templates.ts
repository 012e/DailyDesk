import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  BoardTemplateSchema,
  BoardTemplateWithDetailsSchema,
  CreateBoardTemplateSchema,
  UpdateBoardTemplateSchema,
  CreateBoardFromTemplateSchema,
} from "@/types/templates";
import { BoardSchema } from "@/types/boards";
import * as templateService from "@/services/templates.service";

const TAGS = ["Templates"];

export default function createTemplateRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /templates - Get all available templates
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/",
      security: defaultSecurityScheme(),
      request: {
        query: z.object({
          category: z.string().optional(),
        }),
      },
      responses: {
        200: successJson(BoardTemplateSchema.array(), {
          description: "Get templates successfully",
        }),
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
      const { category } = c.req.valid("query");
      try {
        const templates = await templateService.getTemplates(user.sub, category);
        return c.json(templates, 200);
      } catch (err: any) {
        console.error("Error in templates GET route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

  // GET /templates/:id - Get a specific template with details
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
      responses: {
        200: successJson(BoardTemplateWithDetailsSchema, {
          description: "Get template successfully",
        }),
        403: {
          description: "Forbidden",
        },
        404: {
          description: "Template not found",
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
      const { id } = c.req.valid("param");
      try {
        const template = await templateService.getTemplateById(user.sub, id);
        return c.json(template, 200);
      } catch (err: any) {
        if (err instanceof templateService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in templates GET by ID route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

  // POST /templates - Create a new template
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/",
      security: defaultSecurityScheme(),
      request: {
        body: jsonBody(CreateBoardTemplateSchema),
      },
      responses: {
        200: successJson(BoardTemplateWithDetailsSchema, {
          description: "Template created successfully",
        }),
        400: {
          description: "Request failed",
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
      const req = c.req.valid("json");
      try {
        const template = await templateService.createTemplate(user.sub, req);
        return c.json(template, 200);
      } catch (err: any) {
        if (err instanceof templateService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in templates POST route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

  // PATCH /templates/:id - Update a template
  app.openapi(
    createRoute({
      method: "patch",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: jsonBody(UpdateBoardTemplateSchema),
      },
      responses: {
        200: successJson(BoardTemplateSchema, {
          description: "Template updated successfully",
        }),
        400: {
          description: "Request failed",
        },
        403: {
          description: "Forbidden",
        },
        404: {
          description: "Template not found",
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
      const { id } = c.req.valid("param");
      const req = c.req.valid("json");
      try {
        const template = await templateService.updateTemplate(user.sub, id, req);
        return c.json(template, 200);
      } catch (err: any) {
        if (err instanceof templateService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in templates PATCH route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

  // DELETE /templates/:id - Delete a template
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
      responses: {
        200: successJson(
          z.object({
            message: z.string(),
          }),
          {
            description: "Template deleted successfully",
          }
        ),
        403: {
          description: "Forbidden",
        },
        404: {
          description: "Template not found",
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
      const { id } = c.req.valid("param");
      try {
        const result = await templateService.deleteTemplate(user.sub, id);
        return c.json(result, 200);
      } catch (err: any) {
        if (err instanceof templateService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in templates DELETE route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

  // POST /templates/:id/create-board - Create a board from a template
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{id}/create-board",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: jsonBody(
          z.object({
            boardName: z.string().nonempty().min(1, "Board name is required"),
            includeCards: z.boolean().default(true),
          })
        ),
      },
      responses: {
        200: successJson(BoardSchema, {
          description: "Board created from template successfully",
        }),
        403: {
          description: "Forbidden",
        },
        404: {
          description: "Template not found",
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
      const { id } = c.req.valid("param");
      const { boardName, includeCards } = c.req.valid("json");
      try {
        const board = await templateService.createBoardFromTemplate(
          user.sub,
          id,
          boardName,
          includeCards
        );
        return c.json(board, 200);
      } catch (err: any) {
        if (err instanceof templateService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in create board from template route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

  // POST /templates/from-board/:boardId - Save a board as a template
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/from-board/{boardId}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.string().uuid(),
        }),
        body: jsonBody(
          z.object({
            templateName: z.string().nonempty().min(1, "Template name is required"),
            templateDescription: z.string().optional(),
            category: z
              .enum(["business", "education", "personal", "design", "marketing", "engineering", "other"])
              .optional(),
            isPublic: z.boolean().default(false),
          })
        ),
      },
      responses: {
        200: successJson(BoardTemplateWithDetailsSchema, {
          description: "Board saved as template successfully",
        }),
        403: {
          description: "Forbidden",
        },
        404: {
          description: "Board not found",
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
      const { templateName, templateDescription, category, isPublic } = c.req.valid("json");
      try {
        const template = await templateService.saveBoardAsTemplate(
          user.sub,
          boardId,
          templateName,
          templateDescription,
          category,
          isPublic
        );
        return c.json(template, 200);
      } catch (err: any) {
        if (err instanceof templateService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in save board as template route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

  return app;
}

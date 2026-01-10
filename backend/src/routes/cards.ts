import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import { CardSchema, CreateCardSchema, UpdateCardSchema } from "@/types/cards";
import * as cardService from "@/services/cards.service";

const TAGS = ["Cards"];

export default function createCardRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /boards/{boardId}/cards - Get all cards for a board
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
      },
      responses: {
        200: successJson(CardSchema.array(), {
          description: "Lấy danh sách Cards thành công",
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
        const cards = await cardService.getCardsForBoard(user.sub, boardId);

        // Parse JSON fields
        const parsedCards = cards.map((card) => ({
          ...card,
          labels: card.labels ? JSON.parse(card.labels) : null,
          members: card.members ? JSON.parse(card.members) : null,
          attachments: card.attachments ? JSON.parse(card.attachments) : null,
        }));

        return c.json(parsedCards, 200);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in getCardsForBoard route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // POST /boards/{boardId}/cards - Create a new card
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/cards",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
        body: jsonBody(
          CreateCardSchema.extend({
            listId: z.uuid(),
          }),
        ),
      },
      responses: {
        200: successJson(CardSchema, {
          description: "Tạo Card thành công",
        }),
        404: {
          description: "Board hoặc List không tồn tại",
        },
        403: {
          description: "Không có quyền tạo Card trong Board này",
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
        const card = await cardService.createCard(user.sub, boardId, req);

        // Parse JSON fields for response
        const parsedCard = {
          ...card,
          labels: card.labels ? JSON.parse(card.labels) : null,
          members: card.members ? JSON.parse(card.members) : null,
          // attachments: card.attachments ? JSON.parse(card.attachments) : null,
        };

        return c.json(parsedCard, 200);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in createCard route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // GET /boards/{boardId}/cards/{id} - Get a specific card
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: successJson(CardSchema, {
          description: "Lấy Card thành công",
        }),
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền truy cập Card này",
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
        const card = await cardService.getCardById(user.sub, boardId, id);

        // Parse JSON fields for response
        const parsedCard = {
          ...card,
          labels: card.labels ? JSON.parse(card.labels) : null,
          members: card.members ? JSON.parse(card.members) : null,
          attachments: card.attachments ? JSON.parse(card.attachments) : null,
        };

        return c.json(parsedCard, 200);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in getCardById route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // PUT /boards/{boardId}/cards/{id} - Update a card
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{boardId}/cards/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
        body: jsonBody(
          UpdateCardSchema.extend({
            listId: z.uuid().optional(),
          }),
        ),
      },
      responses: {
        200: successJson(CardSchema, {
          description: "Cập nhật Card thành công",
        }),
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Card này",
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
        const updated = await cardService.updateCard(
          user.sub,
          boardId,
          id,
          req,
        );

        // Parse JSON fields for response
        const parsedCard = {
          ...updated,
          labels: updated.labels ? JSON.parse(updated.labels) : null,
          members: updated.members ? JSON.parse(updated.members) : null,
          attachments: updated.attachments
            ? JSON.parse(updated.attachments)
            : null,
        };

        return c.json(parsedCard, 200);
      } catch (err: any) {
        console.error("Error in updateCard route:", err);
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // DELETE /boards/{boardId}/cards/{id} - Delete a card
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/cards/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa Card thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa Card này",
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
        const result = await cardService.deleteCard(user.sub, boardId, id);
        return c.json(result, 200);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in deleteCard route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  return app;
}

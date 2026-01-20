import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import { CardSchema, CreateCardSchema, UpdateCardSchema } from "@/types/cards";
import { UpdateDueSchema } from "@/types/due";
import * as cardService from "@/services/cards.service";

const TAGS = ["Cards"];

// Extended card schema with board and list information - more lenient for response
const CardWithBoardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  order: z.number().int(),
  coverUrl: z.string().nullable(),
  coverPublicId: z.string().nullable(),
  coverColor: z.string().nullable(),
  coverMode: z.string().nullable(),
  listId: z.string(),
  listName: z.string(),
  boardId: z.string(),
  boardName: z.string(),
  labels: z.any().nullable(),
  members: z.any().nullable(),
  startDate: z.any().nullable(),
  deadline: z.any().nullable(),
  dueAt: z.any().nullable(),
  dueComplete: z.boolean().nullable(),
  reminderMinutes: z.number().nullable(),
  recurrence: z.string().nullable(),
  recurrenceDay: z.number().nullable(),
  recurrenceWeekday: z.number().nullable(),
  repeatFrequency: z.string().nullable(),
  repeatInterval: z.number().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  completed: z.boolean().nullable(),
  createdAt: z.any().nullable(),
  updatedAt: z.any().nullable(),
});

export default function createCardRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /cards/all - Get all cards across all boards for the user
  // Using /cards/all instead of /all-cards to avoid conflict with /{boardId}/cards pattern
  app.get("/cards/all", async (c) => {
    try {
      const user = ensureUserAuthenticated(c);
      console.log("📥 Fetching all cards for user:", user.sub);

      const cards = await cardService.getAllCardsForUser(user.sub);
      console.log("✅ Found cards:", cards.length);

      const parsedCards = cards.map((card) => ({
        ...card,
        labels: card.labels ? JSON.parse(card.labels) : null,
        members: card.members ? JSON.parse(card.members) : null,
      }));

      return c.json(parsedCards);
    } catch (err: any) {
      console.error("❌ Error fetching all cards:", err);
      if (err instanceof cardService.ServiceError) {
        return c.json({ error: err.message }, err.status);
      }
      return c.json({ error: err.message || "Failed to fetch cards" }, 500);
    }
  });

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
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId } = c.req.valid("param");

      try {
        const cards = await cardService.getCardsForBoard(user.sub, boardId);

        return c.json(cards);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
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
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId } = c.req.valid("param");
      const req = c.req.valid("json");

      try {
        const card = await cardService.createCard(user.sub, boardId, req);

        return c.json(card);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
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
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, id } = c.req.valid("param");

      try {
        const card = await cardService.getCardById(user.sub, boardId, id);

        return c.json(card);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
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

        return c.json(updated);
      } catch (err: any) {
        console.error("Error in updateCard route:", err);
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
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
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, id } = c.req.valid("param");

      try {
        const result = await cardService.deleteCard(user.sub, boardId, id);
        return c.json(result);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    },
  );

  // PATCH /boards/{boardId}/cards/{cardId}/due - Update card due date
  app.openapi(
    createRoute({
      method: "patch",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/due",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
        }),
        body: jsonBody(UpdateDueSchema),
      },
      responses: {
        200: successJson(CardSchema, {
          description: "Cập nhật due date thành công",
        }),
        404: {
          description: "Card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Card này",
        },
        400: {
          description: "Dữ liệu không hợp lệ",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId } = c.req.valid("param");
      const dueData = c.req.valid("json");

      try {
        const updatedCard = await cardService.updateCardDue(user.sub, boardId, cardId, dueData);
        return c.json(updatedCard);
      } catch (err: any) {
        console.error("❌ Update due error:", err);
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    },
  );

  // DELETE /boards/{boardId}/cards/{cardId}/due - Remove card due date
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/due",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa due date thành công",
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
          description: "Không có quyền cập nhật Card này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId, cardId } = c.req.valid("param");

      try {
        const result = await cardService.clearCardDue(user.sub, boardId, cardId);
        return c.json(result);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    },
  );

  // POST /boards/{boardId}/cards/from-template - Create a new card from template
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/cards/from-template",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
        body: jsonBody(
          z.object({
            templateCardId: z.uuid(),
            listId: z.uuid(),
            order: z.number().int(),
          })
        ),
      },
      responses: {
        200: successJson(CardSchema, {
          description: "Tạo Card từ template thành công",
        }),
        404: {
          description: "Template card hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền tạo Card trong Board này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { boardId } = c.req.valid("param");
      const { templateCardId, listId, order } = c.req.valid("json");

      try {
        const card = await cardService.createCardFromTemplate(
          user.sub,
          boardId,
          templateCardId,
          listId,
          order
        );

        return c.json(card);
      } catch (err: any) {
        if (err instanceof cardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    },
  );

  return app;
}

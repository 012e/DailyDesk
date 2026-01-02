import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  BoardSchema,
  CreateBoardSchema,
  UpdateBoardSchema,
  BoardWithListsAndCardsSchema,
} from "@/types/boards";
import { ListSchema } from "@/types/lists";
import { CardSchema } from "@/types/cards";
import * as boardService from "@/services/boards.service";

const TAGS = ["Boards"];
export default function createBoardRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/",
      security: defaultSecurityScheme(),
      responses: {
        200: successJson(BoardWithListsAndCardsSchema.array(), {
          description: "Lấy Board thành công",
        }),
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const boards = await db.query.boardsTable.findMany({
        where: eq(boardsTable.userId, user.sub),
        with: {
          lists: {
            orderBy: asc(listsTable.order),
            with: {
              cards: {
                orderBy: asc(cardsTable.order),
              },
            },
          },
        },
      });

      // Parse JSON fields in cards
      const parsedBoards = boards.map((board) => ({
        ...board,
        lists: board.lists.map((list) => ({
          ...list,
          cards: list.cards.map((card) => ({
            ...card,
            labels: card.labels ? JSON.parse(card.labels) : null,
            members: card.members ? JSON.parse(card.members) : null,
          })),
        })),
      }));

      return c.json(parsedBoards);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      request: {
        body: jsonBody(CreateBoardSchema),
      },
      path: "/",
      security: defaultSecurityScheme(),
      responses: {
        200: successJson(BoardSchema, {
          description: "Tạo Board thành công",
        }),
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const req = c.req.valid("json");
      try {
        const board = await boardService.createBoard(user.sub, req);
        return c.json(board);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
        }),
      },
      responses: {
        200: successJson(BoardWithListsAndCardsSchema, {
          description: "Lấy Board thành công",
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
      const { id } = c.req.valid("param");
      try {
        const board = await boardService.getBoardById(user.sub, id);

        // Parse JSON fields in cards
        const parsedBoard = {
          ...board,
          lists: board.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) => ({
              ...card,
              labels: card.labels ? JSON.parse(card.labels) : null,
              members: card.members ? JSON.parse(card.members) : null,
            })),
          })),
        };

        return c.json(parsedBoard);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    }
  );

  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
        }),
        body: jsonBody(UpdateBoardSchema),
      },
      responses: {
        200: successJson(BoardSchema, {
          description: "Cập nhật Board thành công",
        }),
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Board này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { id } = c.req.valid("param");
      const req = c.req.valid("json");
      try {
        const updated = await boardService.updateBoard(user.sub, id, req);
        return c.json(updated);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    }
  );

  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa Board thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa Board này",
        },
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { id } = c.req.valid("param");
      try {
        const result = await boardService.deleteBoard(user.sub, id);
        return c.json(result);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{id}/lists",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
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
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const { id } = c.req.valid("param");
      try {
        const lists = await boardService.getListsForBoard(user.sub, id);
        return c.json(lists);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{id}/cards",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          id: z.uuid(),
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
      const { id } = c.req.valid("param");
      try {
        const cards = await boardService.getCardsForBoard(user.sub, id);
        return c.json(cards);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    }
  );

  return app;
}

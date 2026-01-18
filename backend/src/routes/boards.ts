import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  BoardSchema,
  CreateBoardSchema,
  UpdateBoardSchema,
  BoardWithListsAndCardsSchema,
  GroupedBoardsResponseSchema,
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
        200: successJson(GroupedBoardsResponseSchema, {
          description: "Lấy Board thành công",
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
      const boards = await boardService.getBoardsForUser(user.sub);
      return c.json(boards, 200);
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
        400: {
          content: {
            "application/json": {
              schema: z.any(),
            },
          },
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
        const board = await boardService.createBoard(user.sub, req);
        return c.json(board, 200);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, 400);
        }
        console.error("Error in boards POST route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
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
        const board = await boardService.getBoardById(user.sub, id);
        return c.json(board, 200);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in boards GET by ID route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
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
        const updated = await boardService.updateBoard(user.sub, id, req);
        return c.json(updated, 200);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in boards PUT route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
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
        const result = await boardService.deleteBoard(user.sub, id);
        return c.json(result, 200);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in boards DELETE route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
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
        const lists = await boardService.getListsForBoard(user.sub, id);
        return c.json(lists, 200);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in boards GET lists route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
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
        const cards = await boardService.getCardsForBoard(user.sub, id);
        return c.json(cards, 200);
      } catch (err: any) {
        if (err instanceof boardService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in boards GET cards route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  return app;
}

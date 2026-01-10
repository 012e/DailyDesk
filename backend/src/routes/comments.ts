import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import { CommentSchema, CreateCommentSchema } from "@/types/comments";
import { ActivitySchema } from "@/types/activities";
import * as commentService from "@/services/comments.service";
import * as activityService from "@/services/activities.service";

const TAGS = ["Comments & Activities"];

export default function createCommentRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // POST /boards/{boardId}/cards/{cardId}/comments - Add a comment
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/comments",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
        }),
        body: jsonBody(CreateCommentSchema),
      },
      responses: {
        200: successJson(CommentSchema, {
          description: "Thêm comment thành công",
        }),
        404: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Card không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền truy cập card này",
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
      const { cardId } = c.req.valid("param");
      const req = c.req.valid("json");

      try {
        const comment = await commentService.addComment(user.sub, cardId, req);

        // Log activity for adding comment (non-blocking)
        try {
          await activityService.logActivity({
            cardId,
            userId: user.sub,
            actionType: "comment.added",
            description: `added a comment`,
          });
        } catch (activityError) {
          console.error("Failed to log comment activity:", activityError);
        }

        return c.json(comment, 200);
      } catch (err: any) {
        if (err instanceof commentService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        throw err;
      }
    },
  );

  // PUT /boards/{boardId}/cards/{cardId}/comments/{commentId} - Update a comment
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/comments/{commentId}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
          commentId: z.uuid(),
        }),
        body: jsonBody(CreateCommentSchema),
      },
      responses: {
        200: successJson(CommentSchema, {
          description: "Cập nhật comment thành công",
        }),
        404: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Comment không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Chỉ có thể chỉnh sửa comment của chính mình",
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
      const { commentId } = c.req.valid("param");
      const req = c.req.valid("json");

      try {
        const comment = await commentService.updateComment(
          user.sub,
          commentId,
          req.content,
        );

        return c.json(comment, 200);
      } catch (err: any) {
        if (err instanceof commentService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in comments PUT route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // DELETE /boards/{boardId}/cards/{cardId}/comments/{commentId} - Delete a comment
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/comments/{commentId}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
          commentId: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa comment thành công",
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
          description: "Comment không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Chỉ có thể xóa comment của chính mình",
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
      const { cardId, commentId } = c.req.valid("param");

      try {
        const result = await commentService.deleteComment(user.sub, commentId);

        // Log activity for deleting comment (non-blocking)
        try {
          await activityService.logActivity({
            cardId,
            userId: user.sub,
            actionType: "comment.deleted",
            description: `deleted a comment`,
          });
        } catch (activityError) {
          console.error(
            "Failed to log comment deletion activity:",
            activityError,
          );
        }

        return c.json(result, 200);
      } catch (err: any) {
        if (err instanceof commentService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in comments DELETE route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // GET /boards/{boardId}/cards/{cardId}/comments - Get all comments for a card
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/comments",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
        }),
      },
      responses: {
        200: successJson(CommentSchema.array(), {
          description: "Lấy danh sách comments thành công",
        }),
        404: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Card không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền truy cập card này",
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
      const { cardId } = c.req.valid("param");

      try {
        const comments = await commentService.getCommentsForCard(
          user.sub,
          cardId,
        );
        return c.json(comments, 200);
      } catch (err: any) {
        if (err instanceof commentService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in comments GET route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // GET /boards/{boardId}/cards/{cardId}/activities - Get all activities for a card
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/activities",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
        }),
      },
      responses: {
        200: successJson(ActivitySchema.array(), {
          description: "Lấy danh sách activities thành công",
        }),
        404: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Card không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền truy cập card này",
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
      const { cardId } = c.req.valid("param");

      try {
        const activities = await activityService.getActivitiesForCard(
          user.sub,
          cardId,
        );
        return c.json(activities, 200);
      } catch (err: any) {
        if (err instanceof activityService.ServiceError) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in activities GET route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  // GET /boards/{boardId}/cards/{cardId}/timeline - Get timeline (comments + activities merged)
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/cards/{cardId}/timeline",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          cardId: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Lấy timeline thành công",
          content: {
            "application/json": {
              schema: z.array(
                z.union([
                  CommentSchema.extend({ type: z.literal("comment") }),
                  ActivitySchema.extend({ type: z.literal("activity") }),
                ]),
              ),
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
          description: "Card không tồn tại",
        },
        403: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Không có quyền truy cập card này",
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
      const { cardId } = c.req.valid("param");

      try {
        const timeline = await activityService.getCardTimeline(
          user.sub,
          cardId,
        );
        return c.json(timeline, 200);
      } catch (err: any) {
        if (
          err instanceof commentService.ServiceError ||
          err instanceof activityService.ServiceError
        ) {
          return c.json({ error: err.message }, err.status);
        }
        console.error("Error in timeline GET route:", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

  return app;
}

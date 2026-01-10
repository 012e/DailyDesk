import db from "@/lib/db";
import { boardsTable, boardMembersTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import {
  MemberSchema,
  CreateMemberSchema,
  UpdateMemberSchema,
} from "@/types/members";

const TAGS = ["Members"];

export default function createMemberRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  // GET /boards/{boardId}/members - Get all members for a board
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
      path: "/{boardId}/members",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
      },
      responses: {
        200: successJson(MemberSchema.array(), {
          description: "Lấy danh sách Members thành công",
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

      // Check if board exists and user owns it or is a member
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      // Check if user is owner or member of the board
      const isOwner = board[0].userId === user.sub;
      const isMember = await db
        .select()
        .from(boardMembersTable)
        .where(
          and(
            eq(boardMembersTable.boardId, boardId),
            eq(boardMembersTable.userId, user.sub)
          )
        )
        .limit(1);

      if (!isOwner && isMember.length === 0) {
        return c.json({ error: "Không có quyền truy cập Board này" }, 403);
      }

      // Get all members for this board
      const members = await db
        .select()
        .from(boardMembersTable)
        .where(eq(boardMembersTable.boardId, boardId));

      return c.json(members, 200);
    }
  );

  // POST /boards/{boardId}/members - Add a member to a board
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/members",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
        body: jsonBody(CreateMemberSchema),
      },
      responses: {
        200: successJson(MemberSchema, {
          description: "Thêm Member thành công",
        }),
        404: {
          description: "Board không tồn tại",
        },
        403: {
          description: "Không có quyền thêm Member vào Board này",
        },
        409: {
          description: "Member đã tồn tại trong Board",
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

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      // Only board owner can add members
      if (board[0].userId !== user.sub) {
        return c.json({ error: "Chỉ chủ board mới có thể thêm member" }, 403);
      }

      // Check if member already exists
      const existingMember = await db
        .select()
        .from(boardMembersTable)
        .where(
          and(
            eq(boardMembersTable.boardId, boardId),
            eq(boardMembersTable.userId, req.userId)
          )
        )
        .limit(1);

      if (existingMember.length > 0) {
        return c.json({ error: "Member đã tồn tại trong Board" }, 409);
      }

      // Add member
      const member = await db
        .insert(boardMembersTable)
        .values({
          id: req.id,
          boardId,
          userId: req.userId,
          name: req.name,
          email: req.email,
          avatar: req.avatar || null,
          role: req.role || "member",
        })
        .returning();

      return c.json(member[0], 200);
    }
  );

  // PUT /boards/{boardId}/members/{id} - Update a member's role
  app.openapi(
    createRoute({
      method: "put",
      tags: TAGS,
      path: "/{boardId}/members/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
        body: jsonBody(UpdateMemberSchema),
      },
      responses: {
        200: successJson(MemberSchema, {
          description: "Cập nhật Member thành công",
        }),
        404: {
          description: "Member hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền cập nhật Member này",
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

      // Check if board exists and user owns it
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      // Only board owner can update members
      if (board[0].userId !== user.sub) {
        return c.json({ error: "Chỉ chủ board mới có thể cập nhật member" }, 403);
      }

      // Check if member exists
      const existingMember = await db
        .select()
        .from(boardMembersTable)
        .where(
          and(
            eq(boardMembersTable.id, id),
            eq(boardMembersTable.boardId, boardId)
          )
        )
        .limit(1);

      if (existingMember.length === 0) {
        return c.json({ error: "Member không tồn tại" }, 404);
      }

      // Update member
      const updatedMember = await db
        .update(boardMembersTable)
        .set({
          role: req.role,
        })
        .where(eq(boardMembersTable.id, id))
        .returning();

      return c.json(updatedMember[0], 200);
    }
  );

  // DELETE /boards/{boardId}/members/{id} - Remove a member from a board
  app.openapi(
    createRoute({
      method: "delete",
      tags: TAGS,
      path: "/{boardId}/members/{id}",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
          id: z.uuid(),
        }),
      },
      responses: {
        200: {
          description: "Xóa Member thành công",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Member hoặc Board không tồn tại",
        },
        403: {
          description: "Không có quyền xóa Member này",
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

      // Check if board exists
      const board = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.id, boardId))
        .limit(1);

      if (board.length === 0) {
        return c.json({ error: "Board không tồn tại" }, 404);
      }

      // Check if member exists
      const existingMember = await db
        .select()
        .from(boardMembersTable)
        .where(
          and(
            eq(boardMembersTable.id, id),
            eq(boardMembersTable.boardId, boardId)
          )
        )
        .limit(1);

      if (existingMember.length === 0) {
        return c.json({ error: "Member không tồn tại" }, 404);
      }

      // Only board owner or the member themselves can remove the member
      const isOwner = board[0].userId === user.sub;
      const isSelf = existingMember[0].userId === user.sub;

      if (!isOwner && !isSelf) {
        return c.json({ error: "Không có quyền xóa Member này" }, 403);
      }

      // Remove member
      await db
        .delete(boardMembersTable)
        .where(eq(boardMembersTable.id, id));

      return c.json({ message: "Xóa Member thành công" }, 200);
    }
  );

  return app;
}

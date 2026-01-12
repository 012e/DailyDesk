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
  AddMemberByUserIdSchema,
} from "@/types/members";
import getConfig from "@/lib/config";
import { HTTPException } from "hono/http-exception";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { ensureBoardMemberExists } from "@/services/members.service";

const TAGS = ["Members"];

const UserSearchResultSchema = z.object({
  user_id: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().optional(),
  nickname: z.string().optional(),
});

export function createUserSearchRoutes() {
  const app = new OpenAPIHono();
  const config = getConfig();

  app.use("*", authMiddleware());

  // GET /search - Search for users using Auth0 Management API
  app.openapi(
    createRoute({
      method: "get",
      tags: ["Users"],
      path: "/search",
      security: defaultSecurityScheme(),
      request: {
        query: z.object({
          q: z.string().min(1).describe("Search query (email, name, or username)"),
          per_page: z.string().optional().default("10").describe("Number of results per page"),
          page: z.string().optional().default("0").describe("Page number (0-indexed)"),
        }),
      },
      responses: {
        200: successJson(UserSearchResultSchema.array(), {
          description: "User search results from Auth0",
        }),
        401: {
          description: "Unauthorized - Missing or invalid authentication",
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
      const { q, per_page, page } = c.req.valid("query");

      // Check if Auth0 token is configured
      if (!config.auth0Token) {
        throw new HTTPException(500, {
          message: "Auth0 Management API token not configured",
        });
      }

      try {
        // Build the Auth0 Management API URL
        const searchParams = new URLSearchParams({
          q: `email:*${q}* OR name:*${q}* OR nickname:*${q}*`,
          search_engine: "v3",
          per_page: per_page,
          page: page,
        });

        const url = `https://${config.auth0Domain}/api/v2/users?${searchParams.toString()}`;

        // Make request to Auth0 Management API
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.auth0Token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Auth0 API error:", errorText);
          throw new HTTPException(response.status as ContentfulStatusCode, {
            message: `Auth0 API error: ${response.statusText}`,
          });
        }

        const users = await response.json() as any[];
        
        // Map the Auth0 response to our schema
        const results = users.map((user: any) => ({
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          nickname: user.nickname,
        }));

        return c.json(results);
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }

        console.error("Error searching users:", error);
        throw new HTTPException(500, {
          message: "Failed to search users",
        });
      }
    },
  );

  return app;
}

export default function createMemberRoutes() {
  const app = new OpenAPIHono();

  app.use("*", authMiddleware());

  // GET /{boardId}/members - Get all members for a board
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

  // POST /boards/{boardId}/members/by-user-id - Add a member by Auth0 userId (auto-fetch from Auth0)
  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/{boardId}/members/by-user-id",
      security: defaultSecurityScheme(),
      request: {
        params: z.object({
          boardId: z.uuid(),
        }),
        body: jsonBody(AddMemberByUserIdSchema),
      },
      responses: {
        200: successJson(MemberSchema, {
          description: "Thêm Member thành công (tự động lấy thông tin từ Auth0)",
        }),
        404: {
          description: "Board không tồn tại hoặc User không tìm thấy trong Auth0",
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

      try {
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

        // Use the service to ensure member exists (will fetch from Auth0 if needed)
        const member = await ensureBoardMemberExists(boardId, req.userId, req.role || "member");

        return c.json(member, 200);
      } catch (error: any) {
        console.error("Error adding member by userId:", error);
        
        if (error.status) {
          return c.json({ error: error.message }, error.status);
        }
        
        return c.json({ error: "Failed to add member" }, 500);
      }
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

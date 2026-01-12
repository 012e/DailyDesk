import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, successJson } from "@/types/openapi";
import getConfig from "@/lib/config";
import { HTTPException } from "hono/http-exception";

const TAGS = ["Users"];

const UserSearchResultSchema = z.object({
  user_id: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().optional(),
  nickname: z.string().optional(),
});

export default function createUserRoutes() {
  const app = new OpenAPIHono();
  const config = getConfig();

  app.use("*", authMiddleware());

  // GET /users/search - Search for users using Auth0 Management API
  app.openapi(
    createRoute({
      method: "get",
      tags: TAGS,
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
          throw new HTTPException(response.status, {
            message: `Auth0 API error: ${response.statusText}`,
          });
        }

        const users = await response.json();

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

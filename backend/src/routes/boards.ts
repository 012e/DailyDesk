import db from "@/lib/db";
import { boardsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  userId: z.string().nonempty(),
});

export const CreateBoardSchema = z.object({
  name: z.string().nonempty(),
});
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
        200: successJson(BoardSchema.array(), {
          description: "Lấy Board thành công",
        }),
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const boards = await db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.userId, user.sub));

      return c.json(boards);
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
      const board = await db
        .insert(boardsTable)
        .values({
          name: req.name,
          userId: user.sub,
        })
        .returning();

      return c.json(board[0]);
    },
  );

  return app;
}

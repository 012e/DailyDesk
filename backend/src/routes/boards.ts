import db from "@/lib/db";
import { boardsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { successJson } from "@/types/success-json";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { bearerAuth } from "@/index";
import { authMiddleware } from "@/lib/auth";

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
});

export default function createBoardRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());
  app.openapi(
    createRoute({
      method: "get",
      path: "/",
      security: [{ [bearerAuth.name]: [] }],
      responses: {
        200: successJson(BoardSchema.array(), {
          description: "Tạo Board thành công",
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

  return app;
}

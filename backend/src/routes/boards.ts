import db from "@/lib/db";
import { boardsTable } from "@/lib/db/schema";
import { ensureUserAuthenticated } from "@/lib/utils";
import { successJson } from "@/types/success-json";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
});

export default function setupBoardsRoute(app: OpenAPIHono) {
  app.openapi(
    createRoute({
      method: "get",
      path: "/boards",
      responses: {
        200: successJson(BoardSchema, { description: "Tạo Board thành công" }),
      },
    }),

    async (c) => {
      const user = ensureUserAuthenticated(c);
      const boards = db
        .select()
        .from(boardsTable)
        .where(eq(boardsTable.userId, user.userId));

      return c.json(boards);
    },
  );

  return app;
}

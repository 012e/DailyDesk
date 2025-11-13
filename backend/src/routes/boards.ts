import { OpenAPIHono } from "@hono/zod-openapi";

export default function setupBoardsRoute(app: OpenAPIHono) {
  app.get("/boards", async (c) => {
    return c.json({});
  });
  return app;
}

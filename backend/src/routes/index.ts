import { OpenAPIHono } from "@hono/zod-openapi";
import setupBoardsRoute from "./boards";

export default function setupRoutes(app: OpenAPIHono) {
  setupBoardsRoute(app);

  return app;
}

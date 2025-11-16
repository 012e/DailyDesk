import { OpenAPIHono } from "@hono/zod-openapi";
import createBoardRoutes from "./boards";

export default function setupRoutes(app: OpenAPIHono) {
  app.route("/boards", createBoardRoutes());

  return app;
}

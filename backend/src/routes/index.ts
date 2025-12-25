import { OpenAPIHono } from "@hono/zod-openapi";
import createBoardRoutes from "./boards";
import createListRoutes from "./lists";
import createCardRoutes from "./cards";
import createChatRoutes from "./chat";

export default function setupRoutes(app: OpenAPIHono) {
  app.route("/boards", createBoardRoutes());
  app.route("/boards", createListRoutes());
  app.route("/boards", createCardRoutes());
  app.route("/chat", createChatRoutes());

  return app;
}

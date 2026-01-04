import { OpenAPIHono } from "@hono/zod-openapi";
import createBoardRoutes from "./boards";
import createListRoutes from "./lists";
import createCardRoutes from "./cards";
import createImageRoute from "./media.image";
import createChecklistItemRoutes from "./checklist-items";
import createLabelRoutes from "./labels";
import createMemberRoutes from "./members";
import createChatRoutes from "./chat";
import createCommentRoutes from "./comments";

export default function setupRoutes(app: OpenAPIHono) {
  app.route("/boards", createBoardRoutes());
  app.route("/boards", createListRoutes());
  app.route("/boards", createCardRoutes());
  app.route("/media", createImageRoute());
  app.route("/boards", createChecklistItemRoutes());
  app.route("/boards", createLabelRoutes());
  app.route("/boards", createMemberRoutes());
  app.route("/boards", createCommentRoutes());
  app.route("/chat", createChatRoutes());

  return app;
}

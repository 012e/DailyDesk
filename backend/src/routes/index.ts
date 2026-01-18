import { OpenAPIHono } from "@hono/zod-openapi";
import createBoardRoutes from "./boards";
import createListRoutes from "./lists";
import createCardRoutes from "./cards";
import createImageRoute from "./media.image";
import createChecklistItemRoutes from "./checklist-items";
import createLabelRoutes from "./labels";
import createMemberRoutes, { createUserSearchRoutes } from "./members";
import createChatRoutes from "./chat";
import createAttachmentRoutes from "./attachments";
import createCommentRoutes from "./comments";
import createSSERoutes from "./sse";
import createTemplateRoutes from "./templates";

export default function setupRoutes(app: OpenAPIHono) {
  app.route("/boards", createSSERoutes());
  app.route("/boards", createBoardRoutes());
  app.route("/boards", createListRoutes());
  app.route("/boards", createCardRoutes());
  app.route("/media", createImageRoute());
  app.route("/boards", createChecklistItemRoutes());
  app.route("/", createLabelRoutes()); // Changed to root path for /users/{userId}/labels
  app.route("/boards", createMemberRoutes());
  app.route("/boards", createAttachmentRoutes());
  app.route("/boards", createCommentRoutes());
  app.route("/chat", createChatRoutes());
  app.route("/members", createUserSearchRoutes());
  app.route("/templates", createTemplateRoutes());

  return app;
}

import { OpenAPIHono } from "@hono/zod-openapi";
import createBoardRoutes from "./boards";
import createListRoutes from "./lists";
import createCardRoutes from "./cards";
import CreateImageRoute from "./media.image";

export default function setupRoutes(app: OpenAPIHono) {
  app.route("/boards", createBoardRoutes());
  app.route("/boards", createListRoutes());
  app.route("/boards", createCardRoutes());
  app.route("/media", CreateImageRoute());

  return app;
}

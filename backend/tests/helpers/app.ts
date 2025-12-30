import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import setupRoutes from "@/routes";

/**
 * Creates a test app instance with all routes configured
 */
export function createTestApp(): OpenAPIHono {
  const app = new OpenAPIHono();
  app.use("*", cors());
  setupRoutes(app);
  return app;
}

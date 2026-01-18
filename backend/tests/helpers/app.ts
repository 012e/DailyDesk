import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import setupRoutes from "@/routes";

/**
 * Creates a test app instance with all routes configured
 */
export function createTestApp(): OpenAPIHono {
  const app = new OpenAPIHono();
  app.use("*", cors());
  setupRoutes(app);
  
  // Global error handler (same as main app)
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json(
        {
          message: error.message,
          cause: error.cause,
        },
        error.status,
      );
    }
    
    // Handle AuthorizationError
    if (error.name === "AuthorizationError" && "status" in error) {
      return c.json(
        {
          message: error.message,
        },
        (error as { status: number }).status as Parameters<typeof c.json>[1],
      );
    }
    
    return c.json(
      {
        message: "Internal Server Error",
        detail: error.cause,
      },
      500,
    );
  });
  
  return app;
}

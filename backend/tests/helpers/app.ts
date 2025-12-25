import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import setupRoutes from "@/routes";
import { createMockAuthMiddleware } from "./auth";
import { jest } from "@jest/globals";

// Mock the auth module to use our test auth middleware
jest.mock("@/lib/auth", () => {
  const actual = jest.requireActual("@/lib/auth") as object;
  return {
    ...actual,
    authMiddleware: jest.fn(() => (c: any, next: any) => next()),
  };
});

/**
 * Creates a test app instance with all routes configured
 */
export function createTestApp(): OpenAPIHono {
  const app = new OpenAPIHono();
  app.use("*", cors());
  setupRoutes(app);
  return app;
}

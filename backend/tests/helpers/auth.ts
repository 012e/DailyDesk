import { vi } from "vitest";
import type { Context } from "hono";
import type { MiddlewareHandler } from "hono";

/**
 * Mock user for testing
 */
export const mockUser = {
  sub: "test-user-id-123",
  email: "test@example.com",
  name: "Test User",
};

/**
 * Creates a mock authentication middleware that bypasses JWT verification
 */
export function createMockAuthMiddleware(): MiddlewareHandler {
  return async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    // Mock the user in the context
    c.set("user", mockUser);
    
    await next();
  };
}

/**
 * Create a valid mock JWT token for testing
 */
export function createMockToken(): string {
  return "mock-jwt-token-for-testing";
}

/**
 * Create headers with authentication
 */
export function createAuthHeaders(contentType = "application/json") {
  return {
    "Content-Type": contentType,
    Authorization: `Bearer ${createMockToken()}`,
  };
}

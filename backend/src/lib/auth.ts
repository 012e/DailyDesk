import { OpenAPIHono } from "@hono/zod-openapi";

export function setupBearerAuth(hono: OpenAPIHono) {
  const bearerAuth = hono.openAPIRegistry.registerComponent(
    "securitySchemes",
    "bearerAuth",
    {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  );
  return bearerAuth;
}

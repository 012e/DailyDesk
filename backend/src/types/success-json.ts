import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
export function successJson(
  schema: z.ZodObject,
  options: { description?: string } = {},
) {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    description: options.description || "Successful response",
  };
}

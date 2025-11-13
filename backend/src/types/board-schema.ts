import { z } from "@hono/zod-openapi";

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
});

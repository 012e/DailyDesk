import { Hono } from "hono";
import db from "@/lib/db/";
import { usersTable } from "@/lib/db/schema";

const app = new Hono();

app.post("/test", async (c) => {
  const { name, age, email } = await c.req.json();
  const result = await db
    .insert(usersTable)
    .values({ name, age, email })
    .returning();
  return c.json(result);
});

export default app;

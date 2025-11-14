import { OpenAPIHono } from "@hono/zod-openapi";
import { serve } from "@hono/node-server";
import setupRoutes from "@/routes";
import "dotenv/config";
import { cors } from "hono/cors";
import { authMiddleware, setupBearerAuth } from "@/lib/auth";

const app = new OpenAPIHono();
export const bearerAuth = setupBearerAuth(app);

app.use("*", cors());
app.use("/boards/*", authMiddleware());

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Daily Desk API Documentation",
  },
});

setupRoutes(app);

app.onError((error, c) => {
  console.error(error);
  return c.json(
    {
      message:
        "Server is busy drinking tà tữa. Please contact backend developer for solution.",
      detail: error.cause,
    },
    500,
  );
});

serve(app);

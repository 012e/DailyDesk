import { OpenAPIHono } from "@hono/zod-openapi";
import { serve } from "@hono/node-server";
import setupRoutes from "@/routes";
import "dotenv/config";
import { cors } from "hono/cors";
import { setupBearerAuth } from "@/lib/auth";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono();
export const bearerAuth = setupBearerAuth(app);

app.use(logger());
app.use(poweredBy());
app.use("*", cors());

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Daily Desk API Documentation",
  },
});

setupRoutes(app);

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

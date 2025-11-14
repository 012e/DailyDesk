import { OpenAPIHono } from "@hono/zod-openapi";
import { serve } from "@hono/node-server";
import setupRoutes from "@/routes";
import "dotenv/config";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { setupBearerAuth } from "@/lib/auth";

const app = new OpenAPIHono();
export const bearerAuth = setupBearerAuth(app);

app.use("*", cors());

setupRoutes(app);

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

app.get("/doc/ui", swaggerUI({ url: "/api/doc" }));

app.onError((error, c) => {
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

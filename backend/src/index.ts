import { OpenAPIHono } from "@hono/zod-openapi";
import { clerkMiddleware } from "@hono/clerk-auth";
import { serve } from "@hono/node-server";
import setupRoutes from "@/routes";
import "dotenv/config";
import { swaggerUI } from "@hono/swagger-ui";
import { proxy } from "hono/proxy";
import { cors } from "hono/cors";

const app = new OpenAPIHono();

app.use("*", clerkMiddleware());
app.use("*", cors());

const api = app.basePath("/api");

setupRoutes(api);

api.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

api.get("/doc/ui", swaggerUI({ url: "/api/doc" }));

app.all("/:path", async (c) => {
  console.log("getting");
  const result = await proxy(`http://localhost:5173/${c.req.param("path")}`);
  console.log(result);
  return result;
});

serve(app);

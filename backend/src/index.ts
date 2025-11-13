import { OpenAPIHono } from "@hono/zod-openapi";
import { clerkMiddleware } from "@hono/clerk-auth";
import { serve } from "@hono/node-server";
import setupRoutes from "@/routes";
import "dotenv/config";

const app = new OpenAPIHono();

app.use("*", clerkMiddleware());

setupRoutes(app);

serve(app);

import { OpenAPIHono } from "@hono/zod-openapi";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import getConfig from "@/lib/config";

const config = getConfig();

export type User = {
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  scope: string;
  azp: string;
};
function trimEnd(str: string, char: string): string {
  if (!char) return str;
  let end = str.length;

  while (end > 0 && str[end - 1] === char) {
    end--;
  }

  return str.slice(0, end);
}

const JWKS = createRemoteJWKSet(
  new URL(`${trimEnd(config.authIssuerUrl, "/")}/.well-known/jwks.json`),
);

async function validateAccessToken(token: string): Promise<User> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: config.authIssuerUrl,
    audience: config.authAudience,
  });
  return payload as User;
}

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

export function authMiddleware() {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      throw new HTTPException(401, { message: "Missing authorization header" });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new HTTPException(401, {
        message: "Invalid authorization header format",
      });
    }

    try {
      const payload = await validateAccessToken(token);

      // Store the payload in context for use in route handlers
      c.set("user", payload);

      await next();
    } catch (error) {
      throw new HTTPException(401, { message: "Invalid or expired token" });
    }
  });
}

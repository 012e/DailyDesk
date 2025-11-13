import { SessionAuthObject } from "@clerk/backend";
import { getAuth } from "@hono/clerk-auth";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export function isValidUri(uriString: string): boolean {
  try {
    new URL(uriString);
    return true;
  } catch {
    return false;
  }
}

export function ensureUserAuthenticated(
  c: Context,
): SessionAuthObject & { userId: string } {
  const user = getAuth(c);
  if (!user?.userId) {
    throw new HTTPException(401, { message: "User is not authenticated" });
  }
  return user;
}

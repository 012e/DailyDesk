import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { User } from "@/lib/auth";

export function isValidUri(uriString: string): boolean {
  try {
    new URL(uriString);
    return true;
  } catch {
    return false;
  }
}

export function ensureUserAuthenticated(c: Context): User {
  const user = c.get("user") as User;
  if (!user) {
    throw new HTTPException(401, { message: "User is not authenticated" });
  }
  return user;
}

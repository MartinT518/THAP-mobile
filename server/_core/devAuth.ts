import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

/**
 * When `NODE_ENV` is not production and `DEV_AUTH_OPEN_ID` is set, authenticate
 * as that user without a real OAuth session (local testing only).
 */
export async function tryDevAuth(req: Request): Promise<User | null> {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  const openId = process.env.DEV_AUTH_OPEN_ID?.trim();
  if (!openId) {
    return null;
  }

  let user = await db.getUserByOpenId(openId);
  if (!user) {
    await db.upsertUser({
      openId,
      name: "Local Dev",
      email: null,
      loginMethod: "dev",
      lastSignedIn: new Date(),
    });
    user = await db.getUserByOpenId(openId);
  }
  return user ?? null;
}

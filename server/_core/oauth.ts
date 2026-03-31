import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { googleAuth } from "./googleAuth";

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { credential } = req.body as { credential?: string };

    if (!credential) {
      res.status(400).json({ error: "Missing Google credential" });
      return;
    }

    try {
      const googleUser = await googleAuth.verifyGoogleIdToken(credential);

      await db.upsertUser({
        openId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await googleAuth.createSessionToken(
        googleUser.googleId,
        { name: googleUser.name || "", expiresInMs: ONE_YEAR_MS },
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[Google Auth] Callback failed", error);
      res.status(401).json({ error: "Invalid Google credential" });
    }
  });
}

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("Account Deletion", () => {
  it("should delete the authenticated user's account", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.auth.deleteAccount();
      expect(result.success).toBe(true);
    } else {
      await expect(caller.auth.deleteAccount()).rejects.toThrow(
        "Database not available"
      );
    }
  });

  it("should reject unauthenticated account deletion", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.deleteAccount()).rejects.toThrow();
  });
});

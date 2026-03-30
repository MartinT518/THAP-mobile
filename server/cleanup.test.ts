import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("Cleanup — Duplicate Removal", () => {
  it("should remove duplicate product instances", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.cleanup.removeDuplicates();
      expect(result.success).toBe(true);
      expect(typeof result.removedInstances).toBe("number");
      expect(typeof result.removedScans).toBe("number");
      expect(result.removedInstances).toBeGreaterThanOrEqual(0);
      expect(result.removedScans).toBeGreaterThanOrEqual(0);
    } else {
      await expect(caller.cleanup.removeDuplicates()).rejects.toThrow(
        "Database not available"
      );
    }
  });

  it("should reject unauthenticated cleanup", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.cleanup.removeDuplicates()).rejects.toThrow();
  });
});

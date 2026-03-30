import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("Scan History", () => {
  it("should list scan history (empty when no DB)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.scanHistory.list();
    expect(Array.isArray(history)).toBe(true);
  });

  it("should add to scan history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.scanHistory.add({ productId: 1 });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.scanHistory.add({ productId: 1 })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should delete a scan history entry", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.scanHistory.delete({ historyId: 1 });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.scanHistory.delete({ historyId: 1 })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should clear all scan history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.scanHistory.clear();
      expect(result.success).toBe(true);
    } else {
      await expect(caller.scanHistory.clear()).rejects.toThrow(
        "Database not available"
      );
    }
  });

  it("should reject unauthenticated access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.scanHistory.list()).rejects.toThrow();
  });

  it("should validate add input — productId is required", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error -- testing invalid input
      caller.scanHistory.add({})
    ).rejects.toThrow();
  });
});

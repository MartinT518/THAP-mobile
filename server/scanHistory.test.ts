import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";
import * as db from "./db";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("should skip adding owned products to scan history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const ownershipSpy = vi.spyOn(db, "isProductOwned").mockResolvedValue(true);
    const addSpy = vi.spyOn(db, "addToScanHistory").mockResolvedValue({} as never);

    await expect(caller.scanHistory.add({ productId: 1 })).resolves.toEqual({
      success: true,
      recorded: false,
    });

    expect(ownershipSpy).toHaveBeenCalledWith(ctx.user!.id, 1);
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should add unowned products to scan history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const ownershipSpy = vi.spyOn(db, "isProductOwned").mockResolvedValue(false);
    const addSpy = vi.spyOn(db, "addToScanHistory").mockResolvedValue({} as never);

    await expect(caller.scanHistory.add({ productId: 1 })).resolves.toEqual({
      success: true,
      recorded: true,
    });

    expect(ownershipSpy).toHaveBeenCalledWith(ctx.user!.id, 1);
    expect(addSpy).toHaveBeenCalledWith({
      userId: ctx.user!.id,
      productId: 1,
    });
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

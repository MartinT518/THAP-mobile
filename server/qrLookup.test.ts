import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext } from "./_testHelpers";

describe("QR Lookup", () => {
  it("should reject empty payload", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.lookupByQR({ payload: "" })
    ).rejects.toThrow();
  });

  it("should reject payload exceeding max length", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.lookupByQR({ payload: "x".repeat(2001) })
    ).rejects.toThrow();
  });

  it("should reject unauthenticated lookup", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.lookupByQR({ payload: "test-code" })
    ).rejects.toThrow();
  });

  it("should throw NOT_FOUND for unknown product codes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.products.lookupByQR({ payload: "completely-unknown-product-xyz-999" });
      expect.fail("Should have thrown");
    } catch (error: unknown) {
      const err = error as { code?: string };
      expect(err.code).toBe("NOT_FOUND");
    }
  });

  it("should accept a valid Thap product URL format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.products.lookupByQR({ payload: "https://thap.app/product/1" });
    } catch (error: unknown) {
      const err = error as { code?: string };
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(err.code);
    }
  });
});

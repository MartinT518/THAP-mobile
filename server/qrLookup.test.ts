import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("QR Lookup — legacy Tings hosts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests v2 product by id for id.tings.info before other lookups", async () => {
    const spy = vi.spyOn(axios, "get").mockResolvedValue({
      status: 404,
      data: {},
    } as never);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.products.lookupByQR({
        payload: "https://id.tings.info/abc123",
      });
      expect.fail("Should have thrown");
    } catch (error: unknown) {
      const err = error as { code?: string };
      expect(err.code).toBe("NOT_FOUND");
    }

    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v2\/products\/abc123(?:\?|$)/),
      expect.any(Object),
    );
  });

  it("requests v2 find with full qrUrl for qr.tings.info", async () => {
    const spy = vi.spyOn(axios, "get").mockResolvedValue({
      status: 404,
      data: {},
    } as never);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const payload = "https://qr.tings.info/some/path";

    try {
      await caller.products.lookupByQR({ payload });
      expect.fail("Should have thrown");
    } catch (error: unknown) {
      const err = error as { code?: string };
      expect(err.code).toBe("NOT_FOUND");
    }

    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v2\/products\/find$/),
      expect.objectContaining({
        params: { qrUrl: payload },
      }),
    );
  });
});

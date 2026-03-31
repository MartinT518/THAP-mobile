import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";
import * as db from "./db";

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_SHARE = {
  id: 1,
  productInstanceId: 10,
  senderUserId: 1,
  receiverUserId: null,
  shareToken: "test-token-abc",
  status: "pending" as const,
  createdAt: new Date(),
  acceptedAt: null,
};

const MOCK_SHARE_WITH_PRODUCT = {
  share: MOCK_SHARE,
  product: {
    id: 100,
    productId: "ext-123",
    name: "Test Product",
    brand: "TestBrand",
    model: null,
    category: null,
    imageUrl: null,
    barcode: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  instance: {
    id: 10,
    userId: 1,
    productId: 100,
    nickname: null,
    purchaseDate: null,
    purchasePrice: null,
    purchaseLocation: null,
    warrantyExpiry: null,
    notes: null,
    tags: null,
    addedAt: new Date(),
    updatedAt: new Date(),
  },
  senderName: "Test User",
};

describe("Sharing", () => {
  describe("createShareLink", () => {
    it("should create a share link for an owned product instance", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getProductInstanceById").mockResolvedValue({
        instance: MOCK_SHARE_WITH_PRODUCT.instance,
        product: MOCK_SHARE_WITH_PRODUCT.product,
      });
      vi.spyOn(db, "createProductShare").mockResolvedValue(MOCK_SHARE);

      const result = await caller.sharing.createShareLink({
        productInstanceId: 10,
      });

      expect(result.shareToken).toBe("test-token-abc");
      expect(result.shareUrl).toContain("/share/test-token-abc");
      expect(db.createProductShare).toHaveBeenCalledWith(10, ctx.user!.id);
    });

    it("should reject when product instance is not found", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getProductInstanceById").mockResolvedValue(undefined);

      await expect(
        caller.sharing.createShareLink({ productInstanceId: 999 }),
      ).rejects.toThrow("Product instance not found");
    });
  });

  describe("getByToken", () => {
    it("should return share data for a valid token", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue(
        MOCK_SHARE_WITH_PRODUCT,
      );

      const result = await caller.sharing.getByToken({ token: "test-token-abc" });
      expect(result.share.shareToken).toBe("test-token-abc");
      expect(result.product.name).toBe("Test Product");
      expect(result.senderName).toBe("Test User");
    });

    it("should reject for an invalid token", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue(undefined);

      await expect(
        caller.sharing.getByToken({ token: "bad-token" }),
      ).rejects.toThrow("Share link not found");
    });
  });

  describe("accept", () => {
    it("should accept a pending share from a different user", async () => {
      const ctx = createAuthContext({ id: 2 });
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue(
        MOCK_SHARE_WITH_PRODUCT,
      );
      vi.spyOn(db, "acceptShare").mockResolvedValue(undefined);

      const result = await caller.sharing.accept({ token: "test-token-abc" });
      expect(result.success).toBe(true);
      expect(result.productId).toBe(100);
      expect(db.acceptShare).toHaveBeenCalledWith(1, 2);
    });

    it("should reject self-accept", async () => {
      const ctx = createAuthContext({ id: 1 });
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue(
        MOCK_SHARE_WITH_PRODUCT,
      );

      await expect(
        caller.sharing.accept({ token: "test-token-abc" }),
      ).rejects.toThrow("You cannot accept your own share");
    });

    it("should reject already-used share", async () => {
      const ctx = createAuthContext({ id: 2 });
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue({
        ...MOCK_SHARE_WITH_PRODUCT,
        share: { ...MOCK_SHARE, status: "accepted" as const },
      });

      await expect(
        caller.sharing.accept({ token: "test-token-abc" }),
      ).rejects.toThrow("This share has already been used");
    });

    it("should reject for invalid token", async () => {
      const ctx = createAuthContext({ id: 2 });
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue(undefined);

      await expect(
        caller.sharing.accept({ token: "no-such-token" }),
      ).rejects.toThrow("Share link not found");
    });
  });

  describe("dismiss", () => {
    it("should dismiss a pending share", async () => {
      const ctx = createAuthContext({ id: 2 });
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue(
        MOCK_SHARE_WITH_PRODUCT,
      );
      vi.spyOn(db, "dismissShare").mockResolvedValue(undefined);

      const result = await caller.sharing.dismiss({ token: "test-token-abc" });
      expect(result.success).toBe(true);
      expect(db.dismissShare).toHaveBeenCalledWith(1);
    });

    it("should reject dismissing already-used share", async () => {
      const ctx = createAuthContext({ id: 2 });
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue({
        ...MOCK_SHARE_WITH_PRODUCT,
        share: { ...MOCK_SHARE, status: "dismissed" as const },
      });

      await expect(
        caller.sharing.dismiss({ token: "test-token-abc" }),
      ).rejects.toThrow("This share has already been used");
    });

    it("should reject dismissing own share", async () => {
      const ctx = createAuthContext({ id: 1 });
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getShareByToken").mockResolvedValue(
        MOCK_SHARE_WITH_PRODUCT,
      );

      await expect(
        caller.sharing.dismiss({ token: "test-token-abc" }),
      ).rejects.toThrow("You cannot dismiss your own share");
    });
  });

  describe("revoke", () => {
    it("should revoke a share", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "revokeShare").mockResolvedValue(undefined);

      const result = await caller.sharing.revoke({ shareId: 1 });
      expect(result.success).toBe(true);
      expect(db.revokeShare).toHaveBeenCalledWith(1, ctx.user!.id);
    });
  });

  describe("sharedWithMe", () => {
    it("should return shared products list", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getSharedWithMe").mockResolvedValue([
        MOCK_SHARE_WITH_PRODUCT,
      ]);

      const result = await caller.sharing.sharedWithMe();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].product.name).toBe("Test Product");
    });

    it("should return empty array when no shares", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getSharedWithMe").mockResolvedValue([]);

      const result = await caller.sharing.sharedWithMe();
      expect(result).toHaveLength(0);
    });
  });

  describe("myOutgoingShares", () => {
    it("should return outgoing shares", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.spyOn(db, "getMyOutgoingShares").mockResolvedValue([
        {
          share: MOCK_SHARE,
          product: MOCK_SHARE_WITH_PRODUCT.product,
          instance: MOCK_SHARE_WITH_PRODUCT.instance,
        },
      ]);

      const result = await caller.sharing.myOutgoingShares();
      expect(result).toHaveLength(1);
    });
  });

  describe("auth", () => {
    it("should reject unauthenticated access to createShareLink", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.sharing.createShareLink({ productInstanceId: 1 }),
      ).rejects.toThrow();
    });

    it("should reject unauthenticated access to sharedWithMe", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.sharing.sharedWithMe()).rejects.toThrow();
    });

    it("should reject unauthenticated access to accept", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.sharing.accept({ token: "test" }),
      ).rejects.toThrow();
    });
  });

  describe("input validation", () => {
    it("should reject empty token for getByToken", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.sharing.getByToken({ token: "" }),
      ).rejects.toThrow();
    });

    it("should reject invalid productInstanceId", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        // @ts-expect-error -- testing invalid input
        caller.sharing.createShareLink({ productInstanceId: "abc" }),
      ).rejects.toThrow();
    });
  });
});

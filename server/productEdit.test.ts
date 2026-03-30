import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    languageCode: "en",
    countryCode: null,
    postalCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

const hasDb = !!process.env.DATABASE_URL;

describe("Product Editing", () => {
  it("should update product instance with new data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      instanceId: 1,
      productId: 1,
      nickname: "My favorite headphones",
      purchaseDate: new Date("2024-01-15"),
      purchasePrice: 29999,
      purchaseLocation: "Amazon",
      warrantyExpiry: new Date("2026-01-15"),
      notes: "Great sound quality",
      tags: ["electronics", "audio"],
    };

    if (hasDb) {
      await expect(
        caller.products.updateProductInstance(input)
      ).resolves.toEqual({ success: true });
    } else {
      await expect(
        caller.products.updateProductInstance(input)
      ).rejects.toThrow("Database not available");
    }
  });

  it("should handle optional fields in product update", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      instanceId: 1,
      productId: 1,
      notes: "Updated notes only",
    };

    if (hasDb) {
      await expect(
        caller.products.updateProductInstance(input)
      ).resolves.toEqual({ success: true });
    } else {
      await expect(
        caller.products.updateProductInstance(input)
      ).rejects.toThrow("Database not available");
    }
  });

  it("should add product to my things", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      productId: 1,
      nickname: "Test product",
    };

    if (hasDb) {
      await expect(
        caller.products.addToMyThings(input)
      ).resolves.toEqual({ success: true });
    } else {
      await expect(
        caller.products.addToMyThings(input)
      ).rejects.toThrow("Database not available");
    }
  });
});

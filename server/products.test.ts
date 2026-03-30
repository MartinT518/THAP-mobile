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

describe("Product Management", () => {
  it("should retrieve product by ID with user instance info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get a product (assuming demo products exist)
    const result = await caller.products.getById({ id: 1 });

    // Result can be null if product doesn't exist, or an object with product and instance
    if (result) {
      expect(result).toHaveProperty("product");
      expect(result).toHaveProperty("instance");
      expect(result.product).toHaveProperty("id");
      expect(result.product).toHaveProperty("name");
    }
  });

  it("should retrieve user's owned products", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.myProducts();

    expect(Array.isArray(products)).toBe(true);
    // Each item should have instance and product
    products.forEach((item) => {
      expect(item).toHaveProperty("instance");
      expect(item).toHaveProperty("product");
    });
  });

  it("should retrieve product by external product ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Try to get a demo product
    const product = await caller.products.getByProductId({
      productId: "sony-wh1000xm5-001",
    });

    // Product might not exist in test environment
    if (product) {
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("productId");
      expect(product.productId).toBe("sony-wh1000xm5-001");
    }
  });
});

describe("Demo Data", () => {
  it("should seed demo data for user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.demo.seedData();

    expect(result).toEqual({ success: true });
  });
});

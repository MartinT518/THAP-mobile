import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return ctx;
}

const hasDb = !!process.env.DATABASE_URL;

describe("AI Provider Management", () => {
  it("should save AI provider configuration", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (hasDb) {
      const result = await caller.ai.saveProvider({
        provider: "openai",
        apiKey: "sk-test-key-123",
        isActive: true,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.ai.saveProvider({
          provider: "openai",
          apiKey: "sk-test-key-123",
          isActive: true,
        })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should retrieve active AI provider", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const activeProvider = await caller.ai.getActiveProvider();

    if (hasDb && activeProvider) {
      expect(activeProvider.provider).toBeTruthy();
      expect(typeof activeProvider.provider).toBe("string");
    } else {
      expect(activeProvider).toBeUndefined();
    }
  });

  it("should list all configured providers", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const providers = await caller.ai.getProviders();

    expect(Array.isArray(providers)).toBe(true);
  });
});

describe("Demo Data Seeding", () => {
  it("should seed demo products for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.demo.seedData();

    expect(result.success).toBe(true);
  });
});

describe("Product Management", () => {
  it("should retrieve user's products", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.myProducts();

    expect(Array.isArray(products)).toBe(true);
  });

  it("should retrieve scan history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.scanHistory.list();

    expect(Array.isArray(history)).toBe(true);
  });
});

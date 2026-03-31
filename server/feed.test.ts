import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("Feed", () => {
  it("should return a list of feed items", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.feed.list();

    expect(Array.isArray(items)).toBe(true);
  });

  it("should include expected feed item properties", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.feed.list();

    for (const item of items) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("type");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("content");
      expect(item).toHaveProperty("timestamp");
      expect([
        "product_added",
        "product_scanned",
        "warranty_alert",
        "care_tip",
        "sustainability_insight",
        "brand_news",
        "brand_commercial",
      ]).toContain(item.type);
    }
  });

  it("should return items sorted by timestamp descending", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.feed.list();

    for (let i = 0; i < items.length - 1; i++) {
      const a = new Date(items[i].timestamp).getTime();
      const b = new Date(items[i + 1].timestamp).getTime();
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it("should return at most 80 items", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.feed.list();

    expect(items.length).toBeLessThanOrEqual(80);
  });

  it("should reject unauthenticated access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.feed.list()).rejects.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("Remove Product from My Things", () => {
  it("should remove a product instance", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.products.removeFromMyThings({ instanceId: 1 });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.products.removeFromMyThings({ instanceId: 1 })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should reject unauthenticated removal", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.removeFromMyThings({ instanceId: 1 })
    ).rejects.toThrow();
  });

  it("should validate instanceId is a number", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error -- testing invalid input
      caller.products.removeFromMyThings({ instanceId: "abc" })
    ).rejects.toThrow();
  });
});

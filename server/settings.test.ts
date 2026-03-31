import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("User Settings", () => {
  it("should get user settings", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.userSettings.get();
    expect(settings).toHaveProperty("language");
    expect(settings.language).toBe("en");
    expect(settings).toHaveProperty("name");
    expect(settings).toHaveProperty("email");
    expect(settings.name).toBe("Test User");
    expect(settings.email).toBe("test@example.com");
  });

  it("should update language setting", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.userSettings.update({ language: "et" });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.userSettings.update({ language: "et" })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should update country setting", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.userSettings.update({ country: "EE" });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.userSettings.update({ country: "EE" })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should update both language and country", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.userSettings.update({
        language: "fi",
        country: "FI",
      });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.userSettings.update({ language: "fi", country: "FI" })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should reject unauthenticated settings access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.userSettings.get()).rejects.toThrow();
  });

  it("should handle empty update gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.userSettings.update({});
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.userSettings.update({})
      ).rejects.toThrow("Database not available");
    }
  });
});

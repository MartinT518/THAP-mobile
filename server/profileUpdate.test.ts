import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("Profile Update", () => {
  it("should update user name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.userSettings.updateProfile({ name: "New Name" });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.userSettings.updateProfile({ name: "New Name" })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should update user email", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.userSettings.updateProfile({ email: "new@example.com" });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.userSettings.updateProfile({ email: "new@example.com" })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should update both name and email", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.userSettings.updateProfile({
        name: "Updated User",
        email: "updated@example.com",
      });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.userSettings.updateProfile({
          name: "Updated User",
          email: "updated@example.com",
        })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should reject invalid email format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.userSettings.updateProfile({ email: "not-an-email" })
    ).rejects.toThrow();
  });

  it("should reject empty name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.userSettings.updateProfile({ name: "" })
    ).rejects.toThrow();
  });

  it("should reject name exceeding max length", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.userSettings.updateProfile({ name: "a".repeat(101) })
    ).rejects.toThrow();
  });

  it("should reject unauthenticated profile update", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.userSettings.updateProfile({ name: "Hacker" })
    ).rejects.toThrow();
  });
});

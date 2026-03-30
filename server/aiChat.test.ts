import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("AI Chat", () => {
  it("should reject chat with missing message", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error -- testing invalid input
      caller.ai.chat({ productId: 1 })
    ).rejects.toThrow();
  });

  it("should reject chat with empty message", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ai.chat({ message: "", productId: 1 })
    ).rejects.toThrow();
  });

  it("should reject chat with message exceeding max length", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const longMessage = "a".repeat(4001);
    await expect(
      caller.ai.chat({ message: longMessage, productId: 1 })
    ).rejects.toThrow();
  });

  it("should reject unauthenticated chat", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ai.chat({ message: "test", productId: 1 })
    ).rejects.toThrow();
  });

  it("should list conversations (empty without DB)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const conversations = await caller.ai.getConversations();
    expect(Array.isArray(conversations)).toBe(true);
  });

  it("should get conversation by product (undefined without DB)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const conversation = await caller.ai.getConversationByProduct({
      productId: 999,
    });
    if (!HAS_DB) {
      expect(conversation).toBeNull();
    }
  });

  it("should validate conversationId in getConversation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.getConversation({ conversationId: 999 });
    expect(result).toBeNull();
  });
});

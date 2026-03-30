import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createAuthContext, createUnauthContext, HAS_DB } from "./_testHelpers";

describe("Product Documents", () => {
  it("should list documents for a product instance", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const documents = await caller.documents.list({ productInstanceId: 1 });
    expect(Array.isArray(documents)).toBe(true);
  });

  it("should create a text note document", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.documents.create({
        productInstanceId: 1,
        documentType: "note",
        title: "Test note",
        textContent: "This is a test note",
      });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.documents.create({
          productInstanceId: 1,
          documentType: "note",
          title: "Test note",
          textContent: "This is a test note",
        })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should delete a document", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    if (HAS_DB) {
      const result = await caller.documents.delete({ documentId: 1 });
      expect(result.success).toBe(true);
    } else {
      await expect(
        caller.documents.delete({ documentId: 1 })
      ).rejects.toThrow("Database not available");
    }
  });

  it("should reject unauthenticated document access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.documents.list({ productInstanceId: 1 })
    ).rejects.toThrow();
  });

  it("should validate document type enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.documents.create({
        productInstanceId: 1,
        // @ts-expect-error -- testing invalid document type
        documentType: "invalid_type",
        title: "Bad doc",
      })
    ).rejects.toThrow();
  });

  it("should validate title max length", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const longTitle = "a".repeat(201);

    await expect(
      caller.documents.create({
        productInstanceId: 1,
        documentType: "note",
        title: longTitle,
      })
    ).rejects.toThrow();
  });
});

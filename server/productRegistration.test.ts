import { describe, expect, it, vi, beforeEach } from "vitest";
import axios from "axios";
import { appRouter, parseTingsRegistrationForm } from "./routers";
import { createAuthContext, createUnauthContext } from "./_testHelpers";

describe("parseTingsRegistrationForm", () => {
  it("parses legacy formFields payload", () => {
    const form = parseTingsRegistrationForm("pid", {
      title: "Register",
      description: "Fill in",
      formFields: [
        { label: "Name", dataType: "text", required: "true", prefilledValue: "fullName" },
        { label: "Note", dataType: "textarea", required: "false" },
      ],
    });
    expect(form?.productId).toBe("pid");
    expect(form?.title).toBe("Register");
    expect(form?.description).toBe("Fill in");
    expect(form?.fields).toHaveLength(2);
    expect(form?.fields[0].key).toBe("Name");
    expect(form?.fields[0].required).toBe(true);
    expect(form?.fields[0].prefilledHint).toBe("fullName");
  });

  it("maps numeric fields to text", () => {
    const form = parseTingsRegistrationForm("p", {
      title: "T",
      formFields: [{ label: "Qty", dataType: "numeric", required: true }],
    });
    expect(form?.fields[0].type).toBe("text");
  });

  it("returns null for empty or invalid payload", () => {
    expect(parseTingsRegistrationForm("p", null)).toBeNull();
    expect(parseTingsRegistrationForm("p", {})).toBeNull();
    expect(parseTingsRegistrationForm("p", { title: "x", formFields: [] })).toBeNull();
  });
});

describe("products registration tRPC", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getRegistrationForm rejects when unauthenticated", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.products.getRegistrationForm({ productId: "x" })).rejects.toThrow();
  });

  it("registerProduct rejects when unauthenticated", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.products.registerProduct({ productInstanceId: 1, formData: {} }),
    ).rejects.toThrow();
  });

  it("getRegistrationForm returns parsed form when Tings responds OK", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({
      data: {
        title: "Warranty",
        formFields: [{ label: "Email", dataType: "email", required: false }],
      },
      status: 200,
    });
    const caller = appRouter.createCaller(createAuthContext());
    const form = await caller.products.getRegistrationForm({ productId: "ext-1" });
    expect(form?.title).toBe("Warranty");
    expect(form?.fields[0].type).toBe("email");
  });

  it("registerProduct rejects when instance is not owned", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.products.registerProduct({
        productInstanceId: 9_999_999,
        formData: { a: "b" },
      }),
    ).rejects.toThrow(/not found/i);
  });
});

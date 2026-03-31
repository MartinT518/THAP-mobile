import { describe, expect, it } from "vitest";
import { parseLegacyTingsDeepLink } from "./deeplinkTings";

describe("parseLegacyTingsDeepLink", () => {
  it("extracts last path segment for id.tings.info", () => {
    expect(parseLegacyTingsDeepLink("https://id.tings.info/abc123")).toEqual({
      kind: "id",
      externalId: "abc123",
    });
  });

  it("extracts id for nested path on id.tings.info", () => {
    expect(
      parseLegacyTingsDeepLink("https://id.tings.info/prefix/xyz-789"),
    ).toEqual({ kind: "id", externalId: "xyz-789" });
  });

  it("handles id.thap.info host (case-insensitive hostname)", () => {
    expect(parseLegacyTingsDeepLink("https://ID.THAP.INFO/prod-1")).toEqual({
      kind: "id",
      externalId: "prod-1",
    });
  });

  it("returns qr kind with full scanned URL for qr.tings.info", () => {
    const url = "https://qr.tings.info/some/deep/path";
    expect(parseLegacyTingsDeepLink(url)).toEqual({ kind: "qr", qrUrl: url });
  });

  it("returns qr kind for qr.thap.info", () => {
    const url = "https://qr.thap.info/x";
    expect(parseLegacyTingsDeepLink(url)).toEqual({ kind: "qr", qrUrl: url });
  });

  it("trims payload for qr links", () => {
    const url = "https://qr.tings.info/foo  ";
    expect(parseLegacyTingsDeepLink(url)).toEqual({
      kind: "qr",
      qrUrl: "https://qr.tings.info/foo",
    });
  });

  it("returns null for Thap product URLs (falls through to /product/ parser)", () => {
    expect(parseLegacyTingsDeepLink("https://thap.app/product/1")).toBeNull();
  });

  it("returns null for arbitrary strings", () => {
    expect(parseLegacyTingsDeepLink("not-a-url")).toBeNull();
  });

  it("returns null for id host with empty path", () => {
    expect(parseLegacyTingsDeepLink("https://id.tings.info/")).toBeNull();
  });

  it("returns null for unrelated https URLs", () => {
    expect(parseLegacyTingsDeepLink("https://example.com/id.tings.info/x")).toBeNull();
  });
});

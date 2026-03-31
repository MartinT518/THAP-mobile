import { describe, expect, it } from "vitest";
import {
  createScrapedProductId,
  extractOpenGraphData,
  normalizeScrapeUrl,
} from "./opengraph";

describe("OpenGraph scraping helpers", () => {
  it("extracts OpenGraph metadata and resolves relative images", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Trail Running Shoes" />
          <meta property="og:description" content="Lightweight shoes for daily runs." />
          <meta property="og:image" content="/images/shoe.jpg" />
          <meta property="og:site_name" content="Runner Store" />
          <title>Ignored Title</title>
        </head>
      </html>
    `;

    expect(extractOpenGraphData(html, "https://shop.example.com/products/shoe")).toEqual({
      url: "https://shop.example.com/products/shoe",
      title: "Trail Running Shoes",
      description: "Lightweight shoes for daily runs.",
      imageUrl: "https://shop.example.com/images/shoe.jpg",
      siteName: "Runner Store",
    });
  });

  it("falls back to document title and standard description", () => {
    const html = `
      <html>
        <head>
          <title>Fallback Product Title</title>
          <meta name="description" content="Fallback description" />
        </head>
      </html>
    `;

    expect(extractOpenGraphData(html, "https://example.com/product")).toEqual({
      url: "https://example.com/product",
      title: "Fallback Product Title",
      description: "Fallback description",
      imageUrl: undefined,
      siteName: undefined,
    });
  });

  it("returns null when the page has no usable metadata", () => {
    const html = "<html><head></head><body>No metadata here</body></html>";
    expect(extractOpenGraphData(html, "https://example.com/product")).toBeNull();
  });

  it("rejects localhost and private-network URLs", () => {
    expect(() => normalizeScrapeUrl("http://localhost:3000/product")).toThrow(
      "That URL host is not allowed.",
    );
    expect(() => normalizeScrapeUrl("http://192.168.1.12/product")).toThrow(
      "That URL host is not allowed.",
    );
  });

  it("rejects unsupported protocols", () => {
    expect(() => normalizeScrapeUrl("ftp://example.com/product")).toThrow(
      "Only http and https URLs are supported.",
    );
  });

  it("creates a stable product identifier from a URL", () => {
    expect(createScrapedProductId("https://example.com/product")).toBe(
      createScrapedProductId("https://example.com/product"),
    );
    expect(createScrapedProductId("https://example.com/product")).toMatch(/^url-[a-f0-9]{24}$/);
  });
});

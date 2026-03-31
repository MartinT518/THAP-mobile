import { TRPCError } from "@trpc/server";
import axios from "axios";
import { load } from "cheerio";
import { createHash } from "node:crypto";

const SCRAPE_TIMEOUT_MS = 8_000;
const MAX_URL_LENGTH = 2_000;

const DISALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export interface ScrapedOpenGraphData {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
}

function trimToUndefined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return false;

  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [a, b] = octets;
  if (a === 10 || a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function assertAllowedHostname(hostname: string): void {
  const normalized = hostname.trim().toLowerCase();
  if (
    !normalized ||
    DISALLOWED_HOSTS.has(normalized) ||
    normalized.endsWith(".local") ||
    isPrivateIpv4(normalized) ||
    isPrivateIpv6(normalized)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That URL host is not allowed.",
    });
  }
}

export function normalizeScrapeUrl(rawUrl: string): URL {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Enter a valid product URL.",
    });
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Enter a valid product URL.",
    });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only http and https URLs are supported.",
    });
  }

  if (url.username || url.password) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "URLs with embedded credentials are not allowed.",
    });
  }

  assertAllowedHostname(url.hostname);

  return url;
}

function resolveMaybeRelativeUrl(rawUrl: string | undefined, baseUrl: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const resolved = new URL(rawUrl, baseUrl);
    if (resolved.protocol === "http:" || resolved.protocol === "https:") {
      return resolved.href;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function extractOpenGraphData(html: string, pageUrl: string): ScrapedOpenGraphData | null {
  const $ = load(html);

  const metaValue = (selector: string) =>
    trimToUndefined($(selector).first().attr("content"));

  const title =
    metaValue('meta[property="og:title"]') ??
    metaValue('meta[name="twitter:title"]') ??
    trimToUndefined($("title").first().text());

  const description =
    metaValue('meta[property="og:description"]') ??
    metaValue('meta[name="twitter:description"]') ??
    metaValue('meta[name="description"]');

  const siteName = metaValue('meta[property="og:site_name"]');
  const imageUrl = resolveMaybeRelativeUrl(
    metaValue('meta[property="og:image"]') ?? metaValue('meta[name="twitter:image"]'),
    pageUrl,
  );

  if (!title && !description && !imageUrl) return null;

  return {
    url: pageUrl,
    title: title ?? "Imported Product",
    description,
    imageUrl,
    siteName,
  };
}

export function createScrapedProductId(url: string): string {
  const digest = createHash("sha256").update(url).digest("hex").slice(0, 24);
  return `url-${digest}`;
}

export async function scrapeOpenGraphUrl(rawUrl: string): Promise<ScrapedOpenGraphData> {
  const normalizedUrl = normalizeScrapeUrl(rawUrl);

  let response;
  try {
    response = await axios.get<string>(normalizedUrl.href, {
      timeout: SCRAPE_TIMEOUT_MS,
      maxRedirects: 5,
      beforeRedirect: (options) => {
        if (typeof options.hostname === "string") {
          assertAllowedHostname(options.hostname);
        }
      },
      responseType: "text",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "ThapBot/1.0 (+https://thap.app)",
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });
  } catch (error) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Could not fetch product data from that URL.",
      cause: error,
    });
  }

  const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
  if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That URL did not return an HTML product page.",
    });
  }

  const maybeFinalUrl =
    typeof (response.request as { res?: { responseUrl?: unknown } } | undefined)?.res?.responseUrl ===
    "string"
      ? ((response.request as { res?: { responseUrl?: string } }).res?.responseUrl ?? normalizedUrl.href)
      : normalizedUrl.href;
  const finalUrl = normalizeScrapeUrl(maybeFinalUrl).href;

  const data = extractOpenGraphData(response.data, finalUrl);
  if (!data) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No product metadata was found on that page.",
    });
  }

  return data;
}

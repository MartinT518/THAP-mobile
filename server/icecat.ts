import axios from "axios";
import { AXIOS_TIMEOUT_MS } from "@shared/const";

const ICECAT_BASE = "https://live.icecat.biz/api";

export type IcecatProduct = {
  icecatId: number;
  name: string;
  title: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  galleryImages: string[];
  barcode: string | null;
  description: string | null;
  shortDescription: string | null;
  specifications: Record<string, string>;
};

function envTrim(key: string): string {
  const v = process.env[key];
  return typeof v === "string" ? v.trim() : "";
}

export function isIcecatConfigured(): boolean {
  return Boolean(envTrim("ICECAT_SHOPNAME") && envTrim("ICECAT_API_TOKEN"));
}

function pickImage(img: Record<string, unknown> | undefined): string | null {
  if (!img) return null;
  const keys = ["Pic500x500", "LowPic", "HighPic", "ThumbPic"] as const;
  for (const k of keys) {
    const u = img[k];
    if (typeof u === "string" && u.startsWith("http")) return u;
  }
  return null;
}

function pickCategory(cat: unknown): string | null {
  if (typeof cat === "string" && cat.length > 0) return cat;
  if (cat && typeof cat === "object" && "Name" in cat) {
    const n = (cat as { Name?: { Value?: string } | string }).Name;
    if (typeof n === "string") return n;
    if (n && typeof n === "object" && typeof n.Value === "string") return n.Value;
  }
  return null;
}

function pickDescription(g: Record<string, unknown>): { long?: string; short?: string } {
  const desc = g.Description;
  const summary = g.SummaryDescription;
  let long: string | undefined;
  let short: string | undefined;
  if (desc && typeof desc === "object") {
    const d = desc as Record<string, unknown>;
    const l = d.LongDesc ?? d.LongSummaryDescription;
    if (typeof l === "string") long = l;
    else if (l && typeof l === "object" && "Value" in l && typeof (l as { Value: string }).Value === "string") {
      long = (l as { Value: string }).Value;
    }
  }
  if (summary && typeof summary === "object") {
    const s = summary as Record<string, unknown>;
    const v = s.ShortSummaryDescription ?? s.LongSummaryDescription;
    if (typeof v === "string") short = v;
    else if (v && typeof v === "object" && "Value" in v && typeof (v as { Value: string }).Value === "string") {
      short = (v as { Value: string }).Value;
    }
  }
  return { long, short };
}

function pickSpecs(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const groups = data.FeaturesGroups;
  if (!Array.isArray(groups)) return out;
  for (const grp of groups) {
    if (!grp || typeof grp !== "object") continue;
    const g = grp as Record<string, unknown>;
    const fg = g.FeatureGroup as Record<string, unknown> | undefined;
    const groupName =
      typeof fg?.GroupName === "object" && fg.GroupName && "Value" in fg.GroupName
        ? String((fg.GroupName as { Value: string }).Value)
        : typeof fg?.GroupName === "string"
          ? fg.GroupName
          : "Features";
    const features = g.Features;
    if (!Array.isArray(features)) continue;
    for (const f of features) {
      if (!f || typeof f !== "object") continue;
      const feat = f as Record<string, unknown>;
      const feature = feat.Feature as Record<string, unknown> | undefined;
      if (!feature) continue;
      const nameObj = feature.Name;
      const valObj = feature.Value;
      const name =
        typeof nameObj === "object" && nameObj && "Value" in nameObj
          ? String((nameObj as { Value: string }).Value)
          : typeof nameObj === "string"
            ? nameObj
            : "";
      const value =
        typeof valObj === "object" && valObj && "Value" in valObj
          ? String((valObj as { Value: string }).Value)
          : typeof valObj === "string"
            ? valObj
            : "";
      if (name && value) {
        const key = groupName ? `${groupName}: ${name}` : name;
        out[key] = value;
      }
    }
  }
  return out;
}

function mapResponse(body: unknown): IcecatProduct | null {
  if (!body || typeof body !== "object") return null;
  const root = body as { msg?: string; data?: Record<string, unknown> };
  if (root.msg !== "OK" || !root.data) return null;
  const g = root.data.GeneralInfo;
  if (!g || typeof g !== "object") return null;
  const gi = g as Record<string, unknown>;
  const icecatId = Number(gi.IcecatId);
  if (!Number.isFinite(icecatId)) return null;

  const title = typeof gi.Title === "string" ? gi.Title : "";
  const productName = typeof gi.ProductName === "string" ? gi.ProductName : "";
  const name = productName || title || "Product";
  const brand = typeof gi.Brand === "string" ? gi.Brand : null;
  const { long, short } = pickDescription(gi);

  const gtinObj = gi.GTIN;
  let barcode: string | null = null;
  if (typeof gtinObj === "string") barcode = gtinObj;
  else if (gtinObj && typeof gtinObj === "object" && "Value" in gtinObj) {
    const v = (gtinObj as { Value: string }).Value;
    if (typeof v === "string") barcode = v;
  }

  const imageUrl = pickImage(root.data.Image as Record<string, unknown> | undefined);

  const galleryImages: string[] = [];
  const gallery = root.data.Gallery;
  if (Array.isArray(gallery)) {
    for (const item of gallery) {
      if (!item || typeof item !== "object") continue;
      const g2 = item as Record<string, unknown>;
      for (const key of ["Pic", "Pic500x500", "LowPic", "HighPic"] as const) {
        const u = g2[key];
        if (typeof u === "string" && u.startsWith("http")) {
          galleryImages.push(u);
          break;
        }
      }
    }
  }

  return {
    icecatId,
    name,
    title: title || name,
    brand,
    category: pickCategory(gi.Category),
    imageUrl,
    galleryImages,
    barcode,
    description: long ?? short ?? null,
    shortDescription: short ?? null,
    specifications: pickSpecs(root.data),
  };
}

/** GTIN / EAN: digits only, typical length 8–14 */
function normalizeGtin(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 14) return null;
  return digits;
}

/**
 * Look up a product by GTIN/EAN (digits in payload) using Icecat Live JSON API.
 */
export async function lookupByGtin(payload: string): Promise<IcecatProduct | null> {
  if (!isIcecatConfigured()) return null;
  const gtin = normalizeGtin(payload);
  if (!gtin) return null;

  const shopname = envTrim("ICECAT_SHOPNAME");
  const apiToken = envTrim("ICECAT_API_TOKEN");
  const contentToken = envTrim("ICECAT_CONTENT_TOKEN");
  const lang = envTrim("ICECAT_LANG") || "EN";

  const headers: Record<string, string> = {
    "api-token": apiToken,
  };
  if (contentToken) {
    headers["content-token"] = contentToken;
  }

  try {
    const { data } = await axios.get<unknown>(ICECAT_BASE, {
      params: {
        lang,
        shopname,
        GTIN: gtin,
        content: "",
      },
      headers,
      timeout: AXIOS_TIMEOUT_MS,
    });
    return mapResponse(data);
  } catch {
    return null;
  }
}

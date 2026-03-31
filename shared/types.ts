/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export type FeedItemType =
  | "product_added"
  | "product_scanned"
  | "warranty_alert"
  | "care_tip"
  | "sustainability_insight"
  | "brand_news"
  | "brand_commercial";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  content: string;
  timestamp: string;
  productId?: number;
  productName?: string;
  productImageUrl?: string | null;
  /** External article or campaign URL (http/https only). */
  linkUrl?: string | null;
  /** Hero image for brand news / commercials. */
  feedImageUrl?: string | null;
  /** Display label for the brand this item relates to. */
  brand?: string | null;
}

/** Tings `/v2/products/registration_form` field (mapped for the client form). */
export interface RegistrationFormField {
  /** Stable field id for submit payload keys (Tings uses `label`). */
  key: string;
  label: string;
  type: "text" | "email" | "textarea" | "date" | "country";
  required: boolean;
  /** API hint: `fullName` / `email` for profile pre-fill, or a literal default. */
  prefilledHint?: string;
}

export interface RegistrationForm {
  productId: string;
  title: string;
  description?: string;
  fields: RegistrationFormField[];
}

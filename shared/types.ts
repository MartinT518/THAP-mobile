/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export type FeedItemType = "product_added" | "product_scanned" | "warranty_alert" | "care_tip" | "sustainability_insight";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  content: string;
  timestamp: string;
  productId?: number;
  productName?: string;
  productImageUrl?: string | null;
}

/**
 * Inserts sample brand_feed_items rows for local/demo testing.
 * brandKey must match normalizeBrandKey(product.brand) — lowercase trimmed.
 *
 * Usage: pnpm exec tsx scripts/seed-brand-feed.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { brandFeedItems } from "../drizzle/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const db = drizzle(url);

const samples = [
  {
    brandKey: "sony",
    kind: "news" as const,
    title: "Sony expands repair-friendly spare parts program",
    summary:
      "New regions now get official parts and guides for select headphones and cameras—check if your model is covered.",
    imageUrl: null as string | null,
    linkUrl: "https://www.sony.com",
    publishedAt: new Date(),
  },
  {
    brandKey: "sony",
    kind: "commercial" as const,
    title: "Winter audio — trade-in bonus on select wireless models",
    summary: "Limited-time upgrade offer for eligible devices. See campaign terms on the official site.",
    imageUrl: null,
    linkUrl: "https://www.sony.com",
    publishedAt: new Date(Date.now() - 86_400_000),
  },
  {
    brandKey: "apple",
    kind: "news" as const,
    title: "Apple publishes new environmental progress report",
    summary: "Highlights recycled materials and energy use across the latest product lines.",
    imageUrl: null,
    linkUrl: "https://www.apple.com/environment/",
    publishedAt: new Date(Date.now() - 2 * 86_400_000),
  },
];

async function main() {
  for (const row of samples) {
    await db.insert(brandFeedItems).values(row);
  }
  console.log(`Inserted ${samples.length} brand_feed_items rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

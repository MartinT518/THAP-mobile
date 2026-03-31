/**
 * Rasterize client/public/favicon.svg to icon-192.png and icon-512.png.
 * Requires: pnpm add -D sharp
 *
 * Usage: pnpm exec node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "client/public/favicon.svg");
const outDir = path.join(root, "client/public");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Install sharp: pnpm add -D sharp");
    process.exit(1);
  }

  const svg = await fs.promises.readFile(svgPath);
  for (const size of [192, 512]) {
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    const dest = path.join(outDir, `icon-${size}.png`);
    await fs.promises.writeFile(dest, png);
    console.log("Wrote", path.relative(root, dest));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

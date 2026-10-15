// Crops the official 2026–27 office-bearer posters (Instagram, 1440×1800)
// to 4:5 portraits above the printed name band, for the Team section.
// Usage: node scripts/prepare-team-portraits.mjs <folder-with-posters>
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join, parse } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Pass the folder containing the poster .jpg files");

// Per-poster crop origin where the default framing clips the subject.
const TOP = { dattaraya: 120 };

for (const file of readdirSync(src).filter(f => f.endsWith(".jpg"))) {
  const name = parse(file).name;
  const info = await sharp(join(src, file))
    .extract({ left: 220, top: TOP[name] ?? 250, width: 1000, height: 1250 })
    .resize(640, 800)
    .webp({ quality: 80 })
    .toFile(`public/media/team-${name}.webp`);
  console.log(name, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}KB`);
}

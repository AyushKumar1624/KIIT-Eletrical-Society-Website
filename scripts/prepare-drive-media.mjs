// Converts photos downloaded from the society's Google Drive folders into
// web-ready WebP files in public/media.
// Usage: node scripts/prepare-drive-media.mjs <folder-with-downloaded-jpgs>
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join, parse } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Pass the folder containing the downloaded .jpg files");

for (const file of readdirSync(src).filter(f => f.endsWith(".jpg"))) {
  const out = `public/media/${parse(file).name}.webp`;
  const info = await sharp(join(src, file)).rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 76 }).toFile(out);
  console.log(parse(file).name, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}KB`);
}

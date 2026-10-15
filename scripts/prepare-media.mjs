// Resizes supplied source photos into web-ready WebP files in public/media.
// Usage: node scripts/prepare-media.mjs
import sharp from "sharp";

const D = "C:/Users/KIIT/Downloads/";
const K = "C:/Users/KIIT/Desktop/konstruct/";
const jobs = [
  [D + "IMG_20260322_120157.jpg", "kk3-drone-workshop.webp"],
  [D + "IMG_20260322_121405.jpg", "kk3-rc-aircraft.webp"],
  [D + "IMG_20260322_112231.jpg", "kk3-audience.webp"],
  [D + "IMG_20260322_111652.jpg", "kk3-inauguration.webp"],
  [K + "poster.PNG", "k-raft-poster.webp"],
];

for (const [src, out] of jobs) {
  const info = await sharp(src).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 }).toFile(`public/media/${out}`);
  console.log(out, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}KB`);
}

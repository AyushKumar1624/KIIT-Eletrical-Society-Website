// Generates the favicon, Apple touch icon and social sharing image from the
// original KES logo and an event photograph.
// Usage: node scripts/prepare-site-icons.mjs
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { SOCIETY } from "../lib/content.js";

const LOGO = "public/kes-logo.jpeg";
const GREEN = "#102f29";

// Round crop of the logo (its square corners are white).
async function roundLogo(size) {
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
  return sharp(LOGO).resize(size, size).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

// Favicon / app icon: logo on a transparent background.
await sharp(await roundLogo(192)).toFile("app/icon.png");

// Apple touch icon: iOS fills transparency with black, so use the brand green.
await sharp({ create: { width: 180, height: 180, channels: 4, background: GREEN } })
  .composite([{ input: await roundLogo(150), top: 15, left: 15 }]).png().toFile("app/apple-icon.png");

// Open Graph / social card, 1200×630.
const W = 1200, H = 630;
const photo = await sharp("public/media/kk3-auditorium.webp").resize(W, H, { fit: "cover", position: "centre" }).toBuffer();
const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" x2="1">
    <stop offset="0" stop-color="${GREEN}" stop-opacity=".97"/>
    <stop offset=".55" stop-color="${GREEN}" stop-opacity=".88"/>
    <stop offset="1" stop-color="${GREEN}" stop-opacity=".25"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#c4a673" stroke-opacity=".55"/>
  <text x="80" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="68" fill="#f7f5ef">KIIT Electrical Society</text>
  <text x="80" y="378" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-style="italic" fill="#e1c595">${SOCIETY.motto}</text>
  <text x="82" y="530" font-family="'Courier New', monospace" font-size="20" letter-spacing="4" fill="#c4a673">KIIT · BHUBANESWAR · STUDENT SOCIETY</text>
</svg>`);
const card = await sharp(photo).composite([{ input: overlay }, { input: await roundLogo(120), top: 80, left: 80 }])
  .jpeg({ quality: 82, mozjpeg: true }).toBuffer();
await writeFile("app/opengraph-image.jpg", card);
await writeFile("app/twitter-image.jpg", card);

console.log("icons and social image written to app/");

// Read-only smoke check. Run after npm run build and npm run start.
import { access, stat } from "node:fs/promises";
import { MEDIA } from "../lib/content.js";
import { NAVIGATION, DOMAIN_CONFIG } from "../lib/portal/config.mjs";

const origin = process.argv[2] || "http://localhost:3001";
const failures = [];
let bytes = 0;
for (const [key, asset] of Object.entries(MEDIA)) {
  try {
    const path = new URL(`../public${asset.src}`, import.meta.url);
    await access(path);
    bytes += (await stat(path)).size;
    if (!asset.alt?.trim()) failures.push(`Missing image description: ${key}`);
  } catch { failures.push(`Missing asset: ${key} (${asset.src})`); }
}
const paths = ["/", ...NAVIGATION.map(([slug]) => `/portal${slug ? `/${slug}` : ""}`),
  ...DOMAIN_CONFIG.map(d => `/portal/domains/${d.id}`), "/portal/login", "/portal/onboarding",
  "/portal/events/khaos-of-circuit-2", "/portal/events/demo-robotics-bench", "/portal/events/demo-design-review",
  "/robots.txt", "/sitemap.xml", "/icon.png", "/apple-icon.png", "/opengraph-image.jpg", "/twitter-image.jpg"];
const result = await Promise.allSettled(paths.map(async path => {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
}));
result.forEach((r, i) => { if (r.status === "rejected") failures.push(`${paths[i]}: ${r.reason.message}`); });
let home = "";
try { home = await (await fetch(origin, { signal: AbortSignal.timeout(15000) })).text(); }
catch (error) { failures.push(`Homepage could not be read: ${error.message}`); }
const links = [...home.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
const assets = [...new Set(links.filter(h => h.startsWith("/_next/") && /\.(css|woff2)(?:\?|$)/.test(h)))];
const responses = await Promise.allSettled(assets.map(async path => {
  const response = await fetch(new URL(path.replaceAll("&amp;", "&"), origin));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
}));
responses.forEach(r => { if (r.status === "rejected") failures.push(r.reason.message); });
console.log(`${Object.keys(MEDIA).length} registered assets (${(bytes / 1024 / 1024).toFixed(2)} MB originals); ${paths.length} routes; ${assets.length} CSS/font links checked.`);
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log("PASS: registered assets, page routes, metadata assets and linked CSS/fonts.");

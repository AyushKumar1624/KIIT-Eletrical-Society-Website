// Read-only smoke check. Run after npm run build and npm start.
import { access, stat, readdir } from "node:fs/promises";
import { MEDIA, NAV } from "../lib/content.js";
import { PROJECT_CATALOGUE } from "../lib/projects/catalogue.mjs";

const origin = process.argv[2] || "http://localhost:3000";
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
const live = ["/", "/robots.txt", "/sitemap.xml", "/icon.png", "/apple-icon.png", "/opengraph-image.jpg", "/twitter-image.jpg"];
const removed = ["/join", "/admin", "/admin/login", "/admin/applications", "/admin/reset-password", "/portal", "/portal/login", "/projects/viewer-preview", "/api/join/applications", "/api/join/verification/request", "/api/admin/auth/session", "/api/admin/applications"];
const check = async (path, expected = 200) => {
  const response = await fetch(new URL(path.replaceAll("&amp;", "&"), origin), { signal: AbortSignal.timeout(15000), redirect: "manual" });
  if (response.status !== expected) throw new Error(`${path}: expected ${expected}, received ${response.status}`);
  return response;
};
const results = await Promise.allSettled([...live.map(path => check(path)), ...removed.map(path => check(path, 404))]);
results.forEach(r => { if (r.status === "rejected") failures.push(r.reason.message); });
let home = "";
try { home = await (await check("/")).text(); }
catch (error) { failures.push(`Homepage could not be read: ${error.message}`); }
for (const { id } of NAV) if (!home.includes(`id="${id}"`)) failures.push(`Missing section: ${id}`);
for (const { id } of PROJECT_CATALOGUE) if (!home.includes(`id="project-${id}"`)) failures.push(`Missing project: ${id}`);
if (/href="\/(?:join|admin|portal)(?:[\/"#?])/.test(home)) failures.push("Homepage links to a removed feature.");
if (home.includes("/_next/image?")) failures.push("Image still requires runtime optimization.");
const links = [...home.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
const assets = [...new Set(links.filter(h => h.startsWith("/_next/") && /\.(?:css|js|woff2)(?:\?|$)/.test(h)))];
const responses = await Promise.allSettled(assets.map(path => check(path)));
responses.forEach(r => { if (r.status === "rejected") failures.push(r.reason.message); });
// Check actual exported routes too: a static host's SPA fallback must not hide stale pages.
for (const name of ["join", "admin", "portal", "api"]) {
  const files = await readdir(new URL("../out/", import.meta.url));
  if (files.includes(name) || files.includes(`${name}.html`)) failures.push(`Removed route present in export: ${name}`);
}
console.log(`${Object.keys(MEDIA).length} registered assets (${(bytes / 1024 / 1024).toFixed(2)} MB); ${live.length} public routes; ${removed.length} removed routes; ${PROJECT_CATALOGUE.length} projects; ${assets.length} CSS/JS/font links.`);
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log("PASS: public export, assets, navigation, project cards and removed routes.");

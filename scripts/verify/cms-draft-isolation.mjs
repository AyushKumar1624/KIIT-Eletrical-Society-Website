process.env.NODE_ENV ??= "development";

import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";

console.log("=== VERIFYING CMS DRAFT / PUBLISHED CONTENT ISOLATION ===");

const { db } = await getDatabase();
const cmsCol = db.collection(COLLECTIONS.cms);

// 1. Clean and insert an unpublished event
await cmsCol.deleteOne({ type: "event", slug: "secret-draft-workshop" });

await cmsCol.insertOne({
  type: "event",
  slug: "secret-draft-workshop",
  title: "Unpublished Internal Planning Workshop",
  published: false,
  order: 999,
  data: { date: "2027-01-01", venue: "Internal Room" },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 2. Query public endpoint
const pubRes = await fetch("http://localhost:3000/api/content/event");
const pubData = await pubRes.json();
const publicSlugs = (pubData.items || []).map(i => i.slug);
const leakInPublic = publicSlugs.includes("secret-draft-workshop");

console.log("Public event count:", publicSlugs.length);
console.log("Unpublished draft leaked in public API?:", leakInPublic);

if (leakInPublic) {
  console.error(">>> FAIL: Unpublished draft was exposed on public CMS API!");
  process.exitCode = 1;
}

// 3. Login as admin and query admin CMS endpoint
const loginRes = await fetch("http://localhost:3000/api/admin/auth/sign-in", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Origin": "http://localhost:3000" },
  body: JSON.stringify({ email: "admin@kes.kiit.ac.in", password: "AdminPassword#2026" }),
});
const authCookie = loginRes.headers.get("set-cookie")?.split(";")[0];

const adminRes = await fetch("http://localhost:3000/api/admin/cms/event", {
  headers: { "Cookie": authCookie, "Origin": "http://localhost:3000" },
});
const adminData = await adminRes.json();
const adminSlugs = (adminData.items || []).map(i => i.slug);
const visibleToAdmin = adminSlugs.includes("secret-draft-workshop");

console.log("Admin event count (includes drafts):", adminSlugs.length);
console.log("Draft visible to authenticated admin?:", visibleToAdmin);

if (!visibleToAdmin) {
  console.error(">>> FAIL: Draft was not visible in admin CMS interface!");
  process.exitCode = 1;
}

// 4. Clean up
await cmsCol.deleteOne({ type: "event", slug: "secret-draft-workshop" });

console.log(">>> PASS: PUBLIC CMS APIS EXPOSE PUBLISHED CONTENT ONLY.");
await closeDatabase();
process.exit(process.exitCode || 0);

process.env.NODE_ENV ??= "development";

import { escapeCsvField } from "../../lib/admin/server/csv.mjs";
import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";

console.log("=== VERIFYING CSV EXPORT SECURITY & FORMULA INJECTION DEFENSE ===");

// 1. Verify unauthenticated export request is rejected
const anonRes = await fetch("http://localhost:3000/api/admin/applications/export");
console.log("Unauthenticated export response status:", anonRes.status);
if (anonRes.status !== 401) {
  console.error(">>> FAIL: CSV export allowed unauthenticated access!");
  process.exitCode = 1;
}

// 2. Insert test application with malicious spreadsheet injection strings
const { db } = await getDatabase();
const applicationsCol = db.collection(COLLECTIONS.applications);
const testId = "test-csv-injection-app";

await applicationsCol.deleteOne({ _id: testId });
await applicationsCol.insertOne({
  _id: testId,
  cycleId: "2026-27",
  reference: "KES-CSV-INJ",
  fullName: "=cmd|' /C calc'!A0",
  email: "@malicious.kiit.ac.in",
  rollNormalized: "9999999",
  whatsapp: "+91 99999 88888",
  school: "-2+3*4",
  programme: "B.Tech, CSE",
  year: "1st year",
  graduation: "2028",
  domains: ["robotics"],
  status: "New",
  version: 1,
  digest: "csv-inj-digest",
  submittedAt: new Date(),
  history: [],
});

// 3. Authenticate as admin
const loginRes = await fetch("http://localhost:3000/api/admin/auth/sign-in", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Origin": "http://localhost:3000" },
  body: JSON.stringify({ email: "admin@kes.kiit.ac.in", password: "AdminPassword#2026" }),
});
const authCookie = loginRes.headers.get("set-cookie")?.split(";")[0];

// 4. Perform authenticated export
const exportRes = await fetch("http://localhost:3000/api/admin/applications/export", {
  headers: { "Cookie": authCookie, "Origin": "http://localhost:3000" },
});
console.log("Authenticated export response status:", exportRes.status);
console.log("Content-Type:", exportRes.headers.get("content-type"));
console.log("Content-Disposition:", exportRes.headers.get("content-disposition"));

const csvText = await exportRes.text();
const lines = csvText.split("\r\n");
console.log(`Exported CSV rows count: ${lines.length}`);

// Find the line for the test injection application
const injectionLine = lines.find(l => l.includes("KES-CSV-INJ"));
console.log("Sample exported row with formula payloads:\n", injectionLine);

// Assert formula injection escaping
const formulaEscaped = injectionLine.includes("''=cmd|' /C calc'!A0") || injectionLine.includes("'=cmd");
const atEscaped = injectionLine.includes("'@malicious");
const minusEscaped = injectionLine.includes("'-2+3*4");

console.log("Formula '=' escaped with leading quote:", formulaEscaped);
console.log("Symbol '@' escaped with leading quote:", atEscaped);
console.log("Symbol '-' escaped with leading quote:", minusEscaped);

// Clean up
await applicationsCol.deleteOne({ _id: testId });

if (formulaEscaped && atEscaped && minusEscaped) {
  console.log(">>> PASS: CSV EXPORT IS ADMIN-ONLY AND SECURED AGAINST SPREADSHEET FORMULA INJECTION.");
} else {
  console.error(">>> FAIL: Formula injection characters were not escaped properly in exported CSV!");
  process.exitCode = 1;
}
await closeDatabase();
process.exit(process.exitCode || 0);

process.env.NODE_ENV ??= "development";

import { createHmac } from "node:crypto";
import { getVerifier } from "../../lib/join/server/index.mjs";
import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";

console.log("=== VERIFYING ATOMIC OTP CONCURRENCY RACE ===");

const email = "2305333@kiit.ac.in";
const verifier = await getVerifier();

// 1. Request OTP
await verifier.requestCode(email, { ip: "127.0.0.1" });

// 2. Lookup code from HMAC in MongoDB
const { db } = await getDatabase();
const challenge = await db.collection(COLLECTIONS.challenges).findOne({ _id: `join:v2:challenge:${email}` });
const secret = process.env.JOIN_SECRET;
const mac = (...parts) => createHmac("sha256", secret).update(parts.join("\n")).digest();

let code = null;
for (let c = 0; c < 1000000; c++) {
  const testCode = String(c).padStart(6, "0");
  if (mac("code", challenge.value.id, email, testCode).toString("base64url") === challenge.value.hash) {
    code = testCode;
    break;
  }
}
console.log(`Generated OTP code for ${email} is ${code}`);

// 3. Dispatch 30 simultaneous confirm requests at the exact same instant
console.log("Dispatching 30 concurrent confirm requests with the SAME OTP...");
const results = await Promise.all(
  Array.from({ length: 30 }, (_, idx) =>
    verifier.confirmCode(email, code).then(res => ({ reqId: idx + 1, status: res.status, hasToken: Boolean(res.token) }))
  )
);

const successes = results.filter(r => r.status === "verified");
const failures = results.filter(r => r.status !== "verified");

console.log(`Total Requests: ${results.length}`);
console.log(`Successful Verifications: ${successes.length}`);
console.log(`Failed / Blocked Requests: ${failures.length}`);

if (successes.length === 1 && failures.length === 29) {
  console.log(">>> PASS: ATOMIC CONCURRENCY ENFORCED. Strictly 1 request won; 29 were blocked.");
} else {
  console.error(">>> FAIL: Race condition detected! Multiple requests verified:", successes.length);
  process.exitCode = 1;
}
await closeDatabase();
process.exit(process.exitCode || 0);

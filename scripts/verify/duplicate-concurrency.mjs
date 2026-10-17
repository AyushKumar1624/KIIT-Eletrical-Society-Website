process.env.NODE_ENV ??= "development";

import { getApplicationService } from "../../lib/join/server/index.mjs";
import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";

console.log("=== VERIFYING CONCURRENT DUPLICATE PREVENTION ===");

const email = "2305444@kiit.ac.in";
const roll = "2305444";
const appService = await getApplicationService();
const { db } = await getDatabase();

const makePayload = (e = email, r = roll) => ({
  application: {
    fullName: "Concurrent Test Student",
    email: e,
    whatsapp: "+91 98888 77777",
    roll: r,
    school: "School of Computer Engineering",
    programme: "B.Tech CSE",
    year: "1st year",
    graduation: "2028",
    domains: ["web"],
    motivation: "Testing concurrent duplicate prevention across identical records.",
    skills: "Next.js",
    explore: "Distributed systems",
    link: "https://github.com/concurrent-test",
    confirmAccurate: true,
    consentContact: true,
  },
});

// 1. Clean test records
await db.collection(COLLECTIONS.applications).deleteMany({ email: { $in: [email, "2305555@kiit.ac.in"] } });
await db.collection(COLLECTIONS.applications).deleteMany({ rollNormalized: roll });

// 2. Dispatch 20 concurrent identical submissions
console.log("Dispatching 20 concurrent submissions for the SAME email and roll...");
const results = await Promise.all(
  Array.from({ length: 20 }, () => appService.submit(email, makePayload()))
);

const statuses = results.map(r => r.status);
console.log("Statuses returned from 20 requests:", statuses[0]);

// 3. Count in MongoDB
const count = await db.collection(COLLECTIONS.applications).countDocuments({ email });
console.log(`Applications persisted in MongoDB for ${email}: ${count}`);

if (count === 1) {
  console.log(">>> PASS: Database uniqueness strictly preserved (exactly 1 document in MongoDB).");
} else {
  console.error(">>> FAIL: Duplicate documents created in MongoDB:", count);
  process.exitCode = 1;
}

// 4. Test conflicting roll number with DIFFERENT email
console.log("Attempting submission with DIFFERENT email (2305555@kiit.ac.in) but SAME roll number...");
const conflictEmail = "2305555@kiit.ac.in";
const conflictResult = await appService.submit(conflictEmail, makePayload(conflictEmail, roll));
console.log("Result of conflicting roll number submission:", conflictResult.status, conflictResult.field || "");

if (conflictResult.status === "duplicate") {
  console.log(">>> PASS: Conflicting roll number successfully rejected as duplicate.");
} else {
  console.error(">>> FAIL: Conflicting roll number was not rejected:", conflictResult);
  process.exitCode = 1;
}

// Clean up
await db.collection(COLLECTIONS.applications).deleteMany({ email: { $in: [email, conflictEmail] } });
await db.collection(COLLECTIONS.applications).deleteMany({ rollNormalized: roll });

console.log("=== DUPLICATE PREVENTION VERIFICATION COMPLETED ===");
await closeDatabase();
process.exit(process.exitCode || 0);

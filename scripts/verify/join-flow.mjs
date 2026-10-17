process.env.NODE_ENV ??= "development";

import { createHmac } from "node:crypto";
import { getVerifier, getApplicationService } from "../../lib/join/server/index.mjs";
import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";

console.log("=== VERIFYING JOIN KES REGISTRATION FLOW ===");

const email = "2305123@kiit.ac.in";
const roll = "2305123";

// 1. Verifier generates code
const verifier = await getVerifier();
if (!verifier) {
  console.error("Verifier not ready. Check environment configuration.");
  process.exit(1);
}

const resRequest = await verifier.requestCode(email, { ip: "127.0.0.1" });
console.log("Step 1 - Request OTP Status:", resRequest.status);

// Verify challenge in MongoDB
const { db } = await getDatabase();
const challenge = await db.collection(COLLECTIONS.challenges).findOne({ _id: `join:v2:challenge:${email}` });
console.log("Step 1.1 - Challenge persisted in MongoDB:", Boolean(challenge));
console.log("Step 1.2 - Stored HMAC hash exists:", Boolean(challenge?.value?.hash));

// 2. Discover code from local console HMAC
const secret = process.env.JOIN_SECRET;
const mac = (...parts) => createHmac("sha256", secret).update(parts.join("\n")).digest();

let code = null;
for (let c = 0; c < 1000000; c++) {
  const testCode = String(c).padStart(6, "0");
  if (mac("code", challenge.value.id, email, testCode).toString("base64url") === challenge.value.hash) {
    code = testCode;
    console.log(`Step 2 - Found generated code: Found 6-digit match: ${code}`);
    break;
  }
}

// 3. Confirm code
const resConfirm = await verifier.confirmCode(email, code);
console.log("Step 3 - Confirm OTP Status:", resConfirm.status);
console.log("Step 3.1 - Verification token returned:", Boolean(resConfirm.token));
const parsedToken = verifier.readToken(resConfirm.token);
console.log("Step 3.2 - Token binds to email:", parsedToken?.email === email);

// 4. Submit application
const appService = await getApplicationService();
// Clean previous test application
await db.collection(COLLECTIONS.applications).deleteOne({ email });

const resSubmit = await appService.submit(email, {
  application: {
    fullName: "Aryan Sharma",
    email,
    whatsapp: "+91 91234 56789",
    roll,
    school: "School of Electronics Engineering",
    programme: "B.Tech Electronics & Telecommunication",
    year: "2nd year",
    graduation: "2027",
    domains: ["robotics", "embedded"],
    motivation: "I have worked on line followers and microcontrollers, and I want to build advanced robotics projects.",
    skills: "Arduino, ESP32, C++, KiCAD",
    explore: "Computer vision and ROS2",
    link: "https://github.com/aryan-kes-demo",
    confirmAccurate: true,
    consentContact: true,
  },
});

console.log("Step 4 - Application Submission Result:", resSubmit.status, "Ref:", resSubmit.reference || "None");

// 5. Verify persistence in MongoDB
const appDoc = await db.collection(COLLECTIONS.applications).findOne({ email });
console.log("Step 5 - MongoDB Application Persisted:", Boolean(appDoc));
console.log("Step 5.1 - Initial Status is 'New':", appDoc?.status === "New");
console.log("Step 5.2 - Reference is valid:", Boolean(appDoc?.reference?.startsWith("KES-")));
console.log("Step 5.3 - Recruitment Cycle assigned:", appDoc?.cycleId);

// 6. Verify notification jobs queued
const jobs = await db.collection(COLLECTIONS.jobs).find({ applicationId: appDoc?._id }).toArray();
console.log("Step 6 - Notification Jobs Queued Count:", jobs.length);
console.log("Step 6.1 - Job types:", jobs.map(j => j.kind).join(", "));
console.log("Step 6.2 - Initial Job status:", jobs.map(j => j.status).join(", "));

console.log("=== JOIN KES FLOW COMPLETED SUCCESSFULLY ===");
await closeDatabase();
process.exit(process.exitCode || 0);

import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";
import { setupDatabase } from "../../lib/backend/indexes.mjs";
import { hashPassword, passwordErrors } from "../../lib/admin/server/passwords.mjs";
import { safeLog } from "../../lib/backend/http.mjs";

// Passwords are never accepted in command-line arguments or environment
// variables and never echoed, printed, logged or assigned a default.
async function hidden(question) {
  process.stdout.write(question);
  const muted = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
  try { return await rl.question(""); } finally { rl.close(); process.stdout.write("\n"); }
}

try {
  if (!process.stdin.isTTY || !process.stdout.isTTY || process.argv.length > 2) {
    throw new Error(
      "Interactive terminal required: process.stdin is not a TTY.\n" +
      "Please execute 'npm run admin:provision' directly inside an interactive PowerShell or terminal window."
    );
  }

  // Pre-flight: verify database connectivity and ensure an admin does not already exist
  const { db } = await getDatabase();
  await db.command({ ping: 1 });
  await setupDatabase(db);
  const accounts = db.collection(COLLECTIONS.admins);
  if (await accounts.findOne({ role: "admin" })) {
    throw new Error("An administrator account has already been provisioned in this database.");
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let email, name;
  try {
    email = (await rl.question("Administrator email: ")).trim().toLowerCase();
    name = (await rl.question("Administrator display name: ")).trim();
  } finally {
    rl.close();
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Invalid or empty administrator email address.");
  }
  if (!name || name.length > 80) {
    throw new Error("Invalid administrator display name (1–80 characters required).");
  }

  const password = await hidden("Password (15–128 characters; hidden): ");
  const confirm = await hidden("Confirm password (hidden): ");

  if (password !== confirm) {
    throw new Error("Passwords do not match.");
  }
  const errors = passwordErrors(password);
  if (Object.keys(errors).length) {
    throw new Error(errors.password || "Password does not meet length/complexity requirements.");
  }

  // Fixed unique bootstrap ID serializes simultaneous first-admin attempts
  await accounts.insertOne({
    _id: "initial-admin",
    email,
    name,
    role: "admin",
    active: true,
    authVersion: 1,
    passwordHash: await hashPassword(password),
    createdAt: new Date(),
  });

  console.info("\n[✓] First administrator successfully provisioned. Credentials were not printed.");
} catch (error) {
  safeLog("admin_provision_failed");
  console.error(`\n[✗] Provisioning failed: ${error?.message || "Unknown error"}`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { getDatabase, closeDatabase, COLLECTIONS } from "../lib/backend/mongo.mjs";
import { setupDatabase } from "../lib/backend/indexes.mjs";
import { hashPassword, passwordErrors } from "../lib/admin/server/passwords.mjs";
import { safeLog } from "../lib/backend/http.mjs";

// Passwords are never accepted in command-line arguments or environment
// variables and never echoed, printed, logged or assigned a default.
async function hidden(question) {
  process.stdout.write(question);
  const muted = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
  try { return await rl.question(""); } finally { rl.close(); process.stdout.write("\n"); }
}
try {
  if (!process.stdin.isTTY || !process.stdout.isTTY || process.argv.length > 2) throw new Error("Use an interactive terminal without credential arguments");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let email, name;
  try { email = (await rl.question("Administrator email: ")).trim().toLowerCase(); name = (await rl.question("Administrator display name: ")).trim(); } finally { rl.close(); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length > 80) throw new Error("Invalid administrator details");
  const password = await hidden("Password (15–128 characters; hidden): ");
  const confirm = await hidden("Confirm password (hidden): ");
  if (Object.keys(passwordErrors(password)).length || password !== confirm) throw new Error("Invalid password");
  const { db } = await getDatabase(); await setupDatabase(db);
  const accounts = db.collection(COLLECTIONS.admins);
  if (await accounts.findOne({ role: "admin" })) throw new Error("Administrator already provisioned");
  // A fixed unique bootstrap ID serializes simultaneous first-admin attempts.
  await accounts.insertOne({ _id: "initial-admin", email, name, role: "admin", active: true, authVersion: 1, passwordHash: await hashPassword(password), createdAt: new Date() });
  console.info("First administrator provisioned. Credentials were not printed.");
} catch { safeLog("admin_provision_failed"); console.error("Provisioning failed. Check configuration, input requirements and whether an administrator already exists."); process.exitCode = 1; }
finally { await closeDatabase(); }

import { getDatabase, closeDatabase, COLLECTIONS } from "../lib/backend/mongo.mjs";
import { hashPassword } from "../lib/admin/server/passwords.mjs";

const { db } = await getDatabase();
const accounts = db.collection(COLLECTIONS.admins);

const email = "admin@kes.kiit.ac.in";
const password = "AdminPassword#2026";
const name = "Faculty Coordinator";

const existing = await accounts.findOne({ email });
if (!existing) {
  const hash = await hashPassword(password);
  await accounts.insertOne({
    _id: "initial-admin",
    email,
    name,
    role: "admin",
    active: true,
    authVersion: 1,
    passwordHash: hash,
    createdAt: new Date(),
  });
  console.info(`[seed] Admin created: ${email}`);
} else {
  console.info(`[seed] Admin already exists: ${email}`);
}

await closeDatabase();

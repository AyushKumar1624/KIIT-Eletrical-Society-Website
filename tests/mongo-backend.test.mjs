import test from "node:test";
import assert from "node:assert/strict";
import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { setupDatabase } from "../lib/backend/indexes.mjs";
import { COLLECTIONS } from "../lib/backend/mongo.mjs";
import { createMongoStore } from "../lib/join/server/store.mjs";
import { createVerifier } from "../lib/join/server/verifier.mjs";
import { createAdminRepository } from "../lib/admin/server/repository.mjs";
import { createAdminBackend } from "../lib/admin/server/service.mjs";

test("real MongoDB: repeatable setup, concurrent OTP transitions, counters and administrator session/recovery CAS", { skip: !process.env.KES_MONGO_TESTS, timeout: 180000 }, async () => {
  // This creates its own temporary local database; it never reads MONGODB_URI
  // or connects to a developer's or production database.
  const server = await MongoMemoryServer.create({ instance: { ip: "127.0.0.1" } });
  const client = new MongoClient(server.getUri());
  try {
    await client.connect(); const db = client.db("kes_backend_regression");
    await setupDatabase(db); await setupDatabase(db);
    const cols = Object.fromEntries(Object.entries(COLLECTIONS).map(([key, name]) => [key, db.collection(name)]));
    assert.ok((await cols.admins.listIndexes().toArray()).some(i => i.name === "admin_email_unique" && i.unique));
    let t = Date.now(); const sent = []; const store = createMongoStore(cols, () => t);
    const verifier = createVerifier({ store, now: () => t, secret: "a-test-only-secret-with-at-least-32-characters", send: async message => { sent.push(message); } });
    await verifier.requestCode("real@kiit.ac.in");
    const confirmed = await Promise.all(Array.from({ length: 40 }, () => verifier.confirmCode("real@kiit.ac.in", sent[0].code)));
    assert.equal(confirmed.filter(r => r.status === "verified").length, 1);
    t += 61000;
    const resends = await Promise.all(Array.from({ length: 3 }, () => verifier.requestCode("real@kiit.ac.in")));
    assert.equal(resends.filter(r => r.status === "sent").length, 1);
    const newId = (await store.get("join:v2:challenge:real@kiit.ac.in")).id;
    await store.deleteIfId("join:v2:challenge:real@kiit.ac.in", "old-id");
    assert.equal((await store.get("join:v2:challenge:real@kiit.ac.in")).id, newId);
    assert.equal((await verifier.confirmCode("real@kiit.ac.in", sent.at(-1).code)).status, "verified");
    const increments = await Promise.all(Array.from({ length: 50 }, () => store.incr("concurrent-counter", 60)));
    assert.deepEqual(increments.sort((a, b) => a - b), Array.from({ length: 50 }, (_, i) => i + 1));
    assert.ok((await cols.limits.findOne({ _id: "concurrent-counter" })).expiresAt instanceof Date);
    const config = { secret: "admin-test-only-secret-with-at-least-32-characters", resetOrigin: "https://kes.example", idleMs: 1800000, absoluteMs: 28800000, recoveryMs: 1200000 };
    await cols.admins.insertOne({ _id: "real-test-admin", email: "admin@example.test", name: "Fictional", role: "admin", active: true, authVersion: 1, passwordHash: "hash:test-only password" });
    const mail = []; const service = createAdminBackend({ repository: createAdminRepository(cols), config, now: () => t, hash: async value => `hash:${value}`, verify: async (hash, value) => hash === `hash:${value}`, dummy: async () => "hash:dummy", sendRecovery: async message => { mail.push(message); } });
    const login = await service.signIn({ email: "admin@example.test", password: "test-only password" }); assert.equal(login.status, "authenticated");
    assert.equal((await service.getSession(login.token)).status, "authenticated");
    await service.recoverPassword("admin@example.test");
    const token = new URLSearchParams(new URL(mail[0].url).hash.slice(1)).get("token");
    const resets = await Promise.all([1, 2, 3].map(() => service.resetPassword({ token, password: "replacement test-only password" })));
    assert.equal(resets.filter(r => r.passwordReset).length, 1);
    assert.equal((await service.getSession(login.token)).status, "unauthenticated");
  } finally { await client.close(); await server.stop(); }
});

test("real MongoDB replica set: application transactions, per-cycle uniqueness, concurrency and rollback", { skip: !process.env.KES_MONGO_TESTS, timeout: 180000 }, async () => {
  const { MongoMemoryReplSet } = await import("mongodb-memory-server");
  const { createApplicationService, createMongoApplicationRepository } = await import("../lib/join/server/applications.mjs");
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" }, instanceOpts: [{ ip: "127.0.0.1" }] });
  const client = new MongoClient(replSet.getUri());
  try {
    await client.connect(); const db = client.db("kes_applications_regression");
    await setupDatabase(db); await setupDatabase(db);
    const cols = { client, cycles: db.collection(COLLECTIONS.cycles), applications: db.collection(COLLECTIONS.applications), jobs: db.collection(COLLECTIONS.jobs) };
    const names = (await cols.applications.listIndexes().toArray()).filter(i => i.unique).map(i => i.name).sort();
    assert.deepEqual(names, ["application_email_per_cycle", "application_reference_unique", "application_roll_per_cycle"]);
    await cols.cycles.insertOne({ _id: "2026-27", name: "Test", open: true, current: true, opensAt: null, closesAt: null, updatedAt: new Date() });
    await assert.rejects(cols.cycles.insertOne({ _id: "other", name: "x", open: true, current: true, updatedAt: new Date() }), e => e.code === 11000, "only one current cycle");

    const application = email => ({ email, fullName: "Test Applicant", whatsapp: "9876543210", roll: "2405001", school: "SEE", programme: "B.Tech", year: "2nd year", graduation: String(new Date().getFullYear() + 2), domains: ["robotics"], motivation: "I want to learn to build circuits with a team.", skills: "", explore: "", link: "", confirmAccurate: true, consentContact: true });
    const svc = createApplicationService({ repository: createMongoApplicationRepository(cols) });

    const same = await Promise.all(Array.from({ length: 12 }, () => svc.submit("a@kiit.ac.in", { application: application("a@kiit.ac.in") })));
    assert.ok(same.every(r => r.status === "submitted" && r.reference === same[0].reference), JSON.stringify(same.map(r => r.status)));
    assert.equal(await cols.applications.countDocuments(), 1);
    assert.equal(await cols.jobs.countDocuments(), 2);

    const rollRace = await Promise.all(["b@kiit.ac.in", "c@kiit.ac.in", "d@kiit.ac.in"].map(e => svc.submit(e, { application: { ...application(e), roll: "2499999" } })));
    assert.equal(rollRace.filter(r => r.status === "submitted").length, 1);
    assert.equal(rollRace.filter(r => r.status === "duplicate").length, 2);

    // Validator: client-controlled status values cannot be stored.
    await assert.rejects(cols.applications.insertOne({ ...(await cols.applications.findOne()), _id: "x", reference: "KES-XXXX-XXXX", email: "z@kiit.ac.in", rollNormalized: "Z", status: "Member" }));

    // Job insert failure aborts the whole transaction: no orphan application.
    const failing = createMongoApplicationRepository({ ...cols, jobs: { insertMany: async (docs, opts) => { await cols.jobs.insertMany(docs, opts); throw new Error("simulated job failure"); } } });
    const before = [await cols.applications.countDocuments(), await cols.jobs.countDocuments()];
    await assert.rejects(createApplicationService({ repository: failing }).submit("e@kiit.ac.in", { application: { ...application("e@kiit.ac.in"), roll: "2400005" } }));
    assert.deepEqual([await cols.applications.countDocuments(), await cols.jobs.countDocuments()], before);

    // New cycle: earlier records kept, same applicant may apply again.
    await cols.cycles.updateOne({ _id: "2026-27" }, { $set: { current: false, open: false } });
    await cols.cycles.insertOne({ _id: "2027-28", name: "Next", open: true, current: true, updatedAt: new Date() });
    const again = await svc.submit("a@kiit.ac.in", { application: application("a@kiit.ac.in") });
    assert.equal(again.status, "submitted"); assert.notEqual(again.reference, same[0].reference);
    assert.equal(await cols.applications.countDocuments({ email: "a@kiit.ac.in" }), 2);

    await cols.cycles.updateOne({ _id: "2027-28" }, { $set: { open: false } });
    assert.deepEqual(await svc.submit("f@kiit.ac.in", { application: application("f@kiit.ac.in") }), { status: "unavailable", reason: "closed" });
  } finally { await client.close(); await replSet.stop(); }
});

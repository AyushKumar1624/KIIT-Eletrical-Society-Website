import "server-only";
import { COLLECTIONS } from "./mongo.mjs";

// Repeatable and explicit: TTL is cleanup only, never an authorization check.
export async function setupDatabase(db) {
  const schemas = {
    admins: { required: ["email", "passwordHash", "role", "active", "authVersion"], properties: { email: { bsonType: "string" }, passwordHash: { bsonType: "string" }, role: { enum: ["admin"] }, active: { bsonType: "bool" }, authVersion: { bsonType: ["int", "long", "double"] } } },
    sessions: { required: ["adminId", "authVersion", "createdAt", "expiresAt", "absoluteExpiresAt"], properties: { adminId: { bsonType: "string" }, expiresAt: { bsonType: "date" }, absoluteExpiresAt: { bsonType: "date" } } },
    limits: { required: ["count", "expiresAt"], properties: { count: { bsonType: ["int", "long", "double"] }, expiresAt: { bsonType: "date" } } },
    challenges: { required: ["value", "expiresAt"], properties: { value: { bsonType: "object" }, expiresAt: { bsonType: "date" } } },
    cycles: { required: ["name", "open", "current", "updatedAt"], properties: { name: { bsonType: "string" }, open: { bsonType: "bool" }, current: { bsonType: "bool" }, opensAt: { bsonType: ["date", "null"] }, closesAt: { bsonType: ["date", "null"] }, updatedAt: { bsonType: "date" } } },
    applications: { required: ["reference", "cycleId", "email", "rollNormalized", "fullName", "domains", "status", "submittedAt", "digest", "history"], properties: { reference: { bsonType: "string" }, cycleId: { bsonType: "string" }, email: { bsonType: "string" }, rollNormalized: { bsonType: "string" }, domains: { bsonType: "array", minItems: 1, items: { enum: ["robotics", "embedded", "ai", "web", "design", "media", "outreach", "events", "writing"] } }, status: { enum: ["New", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Not Selected"] }, submittedAt: { bsonType: "date" }, digest: { bsonType: "string" }, history: { bsonType: "array" }, confirmAccurate: { enum: [true] }, consentContact: { enum: [true] } } },
    jobs: { required: ["kind", "applicationId", "status", "attempts", "createdAt", "availableAt"], properties: { kind: { enum: ["applicant-acknowledgement", "admin-new-application", "shortlisting", "interview-invitation", "selection", "non-selection"] }, applicationId: { bsonType: "string" }, status: { enum: ["pending", "processing", "sent", "failed"] }, attempts: { bsonType: ["int", "long", "double"] }, createdAt: { bsonType: "date" }, availableAt: { bsonType: "date" } } },
    audit: { required: ["actorId", "action", "entity", "entityId", "timestamp"], properties: { actorId: { bsonType: "string" }, action: { bsonType: "string" }, entity: { bsonType: "string" }, entityId: { bsonType: "string" }, timestamp: { bsonType: "date" } } },
    cms: { required: ["type", "slug", "title", "published", "updatedAt"], properties: { type: { enum: ["project", "achievement", "milestone", "event", "leadership", "faculty", "domain", "gallery"] }, slug: { bsonType: "string" }, title: { bsonType: "string" }, published: { bsonType: "bool" }, order: { bsonType: ["int", "long", "double"] }, updatedAt: { bsonType: "date" } } },
    settings: { required: ["updatedAt"], properties: { updatedAt: { bsonType: "date" } } },
  };
  for (const [key, schema] of Object.entries(schemas)) {
    const name = COLLECTIONS[key]; const validator = { $jsonSchema: { bsonType: "object", ...schema } };
    try { await db.createCollection(name, { validator, validationLevel: "strict" }); }
    catch (error) { if (error.code !== 48) throw error; await db.command({ collMod: name, validator, validationLevel: "strict" }); }
  }
  await db.collection(COLLECTIONS.admins).createIndex({ email: 1 }, { name: "admin_email_unique", unique: true });
  await db.collection(COLLECTIONS.admins).createIndex({ "recovery.digest": 1 }, { name: "admin_recovery_unique", unique: true, partialFilterExpression: { "recovery.digest": { $type: "string" } } });
  for (const key of ["sessions", "limits", "challenges"]) await db.collection(COLLECTIONS[key]).createIndex({ expiresAt: 1 }, { name: "expiry_cleanup", expireAfterSeconds: 0 });
  await db.collection(COLLECTIONS.sessions).createIndex({ adminId: 1 }, { name: "sessions_by_admin" });
  // Applications: one per normalized email and one per normalized roll number in
  // each recruitment cycle; earlier cycles keep their records.
  await db.collection(COLLECTIONS.cycles).createIndex({ current: 1 }, { name: "single_current_cycle", unique: true, partialFilterExpression: { current: true } });
  await db.collection(COLLECTIONS.applications).createIndex({ cycleId: 1, email: 1 }, { name: "application_email_per_cycle", unique: true });
  await db.collection(COLLECTIONS.applications).createIndex({ cycleId: 1, rollNormalized: 1 }, { name: "application_roll_per_cycle", unique: true });
  await db.collection(COLLECTIONS.applications).createIndex({ reference: 1 }, { name: "application_reference_unique", unique: true });
  await db.collection(COLLECTIONS.applications).createIndex({ cycleId: 1, submittedAt: -1 }, { name: "applications_by_cycle" });
  await db.collection(COLLECTIONS.applications).createIndex({ cycleId: 1, status: 1 }, { name: "applications_by_status" });
  await db.collection(COLLECTIONS.applications).createIndex({ cycleId: 1, domains: 1 }, { name: "applications_by_domain" });
  await db.collection(COLLECTIONS.jobs).createIndex({ kind: 1, applicationId: 1 }, { name: "one_job_per_kind", unique: true });
  await db.collection(COLLECTIONS.jobs).createIndex({ status: 1, availableAt: 1 }, { name: "jobs_due" });
  await db.collection(COLLECTIONS.audit).createIndex({ entity: 1, entityId: 1, timestamp: -1 }, { name: "audit_entity_timeline" });
  await db.collection(COLLECTIONS.audit).createIndex({ actorId: 1, timestamp: -1 }, { name: "audit_actor_timeline" });
  await db.collection(COLLECTIONS.audit).createIndex({ timestamp: -1 }, { name: "audit_recent" });
  await db.collection(COLLECTIONS.cms).createIndex({ type: 1, slug: 1 }, { name: "cms_type_slug_unique", unique: true });
  await db.collection(COLLECTIONS.cms).createIndex({ type: 1, published: 1, order: 1 }, { name: "cms_type_published_order" });
}

// Join KES application persistence.
//
// submit() order: recruitment cycle open → strict parse (email from the
// verified session) → same-cycle duplicate/retry check → one transaction that
// inserts the application and its notification jobs together. The unique
// indexes (cycle+email, cycle+roll, reference) are the final authority, so
// concurrent submissions cannot both succeed. Email delivery is not part of
// submission: jobs are durable intents for a separate worker.
import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { parseSubmission, normalizeRoll, submissionDigest } from "./submission.mjs";

export class DuplicateKeyError extends Error {
  constructor(index) { super("Duplicate key"); this.index = index; }
}

export function isCycleOpen(cycle, now = new Date()) {
  if (!cycle || cycle.open !== true) return false;
  if (cycle.opensAt && now < new Date(cycle.opensAt)) return false;
  if (cycle.closesAt && now >= new Date(cycle.closesAt)) return false;
  return true;
}

// Opaque, unguessable, readable aloud: KES-XXXX-XXXX (Crockford base32, no I/L/O/U).
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function newReference() {
  const bytes = randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % 32];
  return `KES-${s.slice(0, 4)}-${s.slice(4)}`;
}

const submitted = app => ({ status: "submitted", reference: app.reference, submittedAt: new Date(app.submittedAt).toISOString() });

export function createApplicationService({ repository, now = () => new Date(), reference = newReference }) {
  async function submit(verifiedEmail, body) {
    const t = now();
    const cycle = await repository.currentCycle();
    if (!isCycleOpen(cycle, t)) return { status: "unavailable", reason: "closed" };

    const parsed = parseSubmission(body, verifiedEmail, t);
    if (!parsed.ok) return parsed.errors ? { status: parsed.status, errors: parsed.errors } : { status: parsed.status };
    const { application } = parsed;
    const digest = submissionDigest(application);
    const rollNormalized = normalizeRoll(application.roll);

    // Retry of the same submission → its existing reference. Anything else
    // from this address or roll number in this cycle is a duplicate.
    const existing = await repository.findInCycle(cycle._id, { email: application.email, rollNormalized });
    if (existing) return existing.email === application.email && existing.digest === digest ? submitted(existing) : { status: "duplicate" };

    for (let attempt = 0; attempt < 3; attempt++) {
      const id = randomUUID();
      const doc = {
        _id: id, reference: reference(), cycleId: cycle._id, ...application, rollNormalized, digest,
        status: "New", notes: "", interview: null, messages: {}, version: 1, submittedAt: t,
        history: [{ at: t, by: "Applicant", action: "submitted" }],
      };
      const jobs = ["applicant-acknowledgement", "admin-new-application"].map(kind => ({
        _id: randomUUID(), kind, applicationId: id, status: "pending", attempts: 0, createdAt: t, availableAt: t,
      }));
      try {
        await repository.insertWithJobs(doc, jobs);
        return submitted(doc);
      } catch (error) {
        if (!(error instanceof DuplicateKeyError)) throw error;
        if (error.index === "reference") continue; // vanishingly rare: draw a new reference
        // Lost a race with a concurrent submission: same content → same answer.
        const winner = await repository.findInCycle(cycle._id, { email: application.email, rollNormalized });
        return winner && winner.email === application.email && winner.digest === digest ? submitted(winner) : { status: "duplicate" };
      }
    }
    throw new Error("Could not allocate a reference");
  }

  async function readiness() {
    return isCycleOpen(await repository.currentCycle(), now());
  }

  return { submit, readiness };
}

/** MongoDB repository. Requires a replica set or Atlas cluster (transactions). */
export function createMongoApplicationRepository({ client, cycles, applications, jobs }) {
  return {
    currentCycle: () => cycles.findOne({ current: true }),
    async findInCycle(cycleId, { email, rollNormalized }) {
      const found = await applications.find({ cycleId, $or: [{ email }, { rollNormalized }] }, { projection: { email: 1, digest: 1, reference: 1, submittedAt: 1 } }).toArray();
      return found.find(a => a.email === email) ?? found[0] ?? null;
    },
    async insertWithJobs(doc, jobDocs) {
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          await applications.insertOne(doc, { session });
          await jobs.insertMany(jobDocs, { session });
        }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
      } catch (error) {
        if (error?.code === 11000) {
          const key = Object.keys(error.keyPattern ?? {});
          throw new DuplicateKeyError(key.includes("reference") ? "reference" : key.includes("rollNormalized") ? "roll" : "email");
        }
        // Support standalone local MongoDB instances (transactions require replica sets)
        const isStandalone = error?.code === 20 || error?.originalError?.code === 20 ||
          /replica set/i.test(error?.message || "") || /replica set/i.test(error?.originalError?.message || "");
        if (isStandalone) {
          try {
            await applications.insertOne(doc);
            await jobs.insertMany(jobDocs);
            return;
          } catch (innerError) {
            if (innerError?.code === 11000) {
              const key = Object.keys(innerError.keyPattern ?? {});
              throw new DuplicateKeyError(key.includes("reference") ? "reference" : key.includes("rollNormalized") ? "roll" : "email");
            }
            throw innerError;
          }
        }
        throw error;
      } finally {
        await session.endSession();
      }
    },
  };
}

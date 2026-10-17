import "server-only";
import { randomUUID } from "node:crypto";
import { COLLECTIONS } from "../backend/mongo.mjs";
import { mailConfig } from "../join/server/config.mjs";
import { createMailSender } from "../join/server/mailer.mjs";
import { buildNotificationEmail } from "./jobs.mjs";
import { recordAuditLog } from "../admin/server/audit.mjs";

const MAX_ATTEMPTS = 5;

/** Computes exponential backoff delay in ms based on attempts */
function getBackoffDelay(attempts) {
  // 1 min, 2 min, 4 min, 8 min, etc.
  return Math.min(1800_000, Math.pow(2, Math.max(0, attempts - 1)) * 60_000);
}

export async function processSingleJob(db, job, { mailer = null, now = () => Date.now() } = {}) {
  const jobsCol = db.collection(COLLECTIONS.jobs);
  const applicationsCol = db.collection(COLLECTIONS.applications);
  const t = now();

  // Atomically claim the job
  const claimed = await jobsCol.findOneAndUpdate(
    { _id: job._id, status: { $in: ["pending", "failed"] } },
    { $set: { status: "processing", lastAttemptAt: new Date(t) } },
    { returnDocument: "after", includeResultMetadata: false }
  );

  if (!claimed) return { status: "skipped" };

  try {
    const app = await applicationsCol.findOne({ _id: claimed.applicationId });
    if (!app) {
      await jobsCol.updateOne(
        { _id: claimed._id },
        { $set: { status: "failed", error: "Application not found", attempts: (claimed.attempts || 0) + 1 } }
      );
      return { status: "failed", error: "Application not found" };
    }

    const email = await buildNotificationEmail(db, claimed, app);

    // Resolve mailer
    let sendFn = mailer;
    if (!sendFn) {
      const config = mailConfig();
      if (!config) {
        if (process.env.NODE_ENV === "development" && process.env.JOIN_DELIVERY === "console") {
          sendFn = async ({ to, subject }) => {
            console.info(`[notification] DEVELOPMENT ONLY — Recipient: ${to}, Subject: ${subject}`);
          };
        } else {
          throw new Error("Mail transport configuration unavailable");
        }
      } else {
        sendFn = createMailSender(config);
      }
    }

    // Execute delivery
    await sendFn(email);

    // Mark as sent
    await jobsCol.updateOne(
      { _id: claimed._id },
      { $set: { status: "sent", sentAt: new Date(t), error: null } }
    );

    // Record into application history
    await applicationsCol.updateOne(
      { _id: app._id },
      {
        $push: {
          history: {
            at: new Date(t),
            by: "Email Service",
            action: "message",
            kind: claimed.kind,
            text: `Sent ${claimed.kind} to ${email.to}`,
          },
        },
      }
    );

    return { status: "sent", jobId: claimed._id };
  } catch (err) {
    const nextAttempts = (claimed.attempts || 0) + 1;
    const isExhausted = nextAttempts >= MAX_ATTEMPTS;
    const backoff = getBackoffDelay(nextAttempts);

    await jobsCol.updateOne(
      { _id: claimed._id },
      {
        $set: {
          status: isExhausted ? "failed" : "pending",
          attempts: nextAttempts,
          availableAt: new Date(t + (isExhausted ? 0 : backoff)),
          error: String(err?.message || "Unknown delivery failure"),
        },
      }
    );

    return { status: isExhausted ? "failed" : "retry_scheduled", error: err?.message };
  }
}

/** Processes all jobs currently due for delivery */
export async function processDueJobs(db, { limit = 20, mailer = null, now = () => Date.now() } = {}) {
  const jobsCol = db.collection(COLLECTIONS.jobs);
  const t = new Date(now());

  const dueJobs = await jobsCol.find({
    status: { $in: ["pending", "failed"] },
    availableAt: { $lte: t },
    attempts: { $lt: MAX_ATTEMPTS },
  }).limit(limit).toArray();

  const results = [];
  for (const job of dueJobs) {
    const res = await processSingleJob(db, job, { mailer, now });
    results.push({ id: job._id, kind: job.kind, result: res });
  }

  return { processed: results.length, details: results };
}

/**
 * Explicit admin action to queue and dispatch a reviewer message.
 */
export async function enqueueReviewerMessage(db, { applicationId, kind, customMessage = "", actor = {}, mailer = null, dispatchImmediate = true }) {
  const jobsCol = db.collection(COLLECTIONS.jobs);
  const applicationsCol = db.collection(COLLECTIONS.applications);

  const app = await applicationsCol.findOne({ _id: applicationId });
  if (!app) return { status: "not-found" };

  const id = randomUUID();
  const t = new Date();

  const job = {
    _id: id,
    kind,
    applicationId,
    customMessage: customMessage || null,
    status: "pending",
    attempts: 0,
    createdAt: t,
    availableAt: t,
    queuedBy: actor.email || actor.id || "admin",
  };

  await jobsCol.insertOne(job);

  // Record audit log
  await recordAuditLog(db, {
    actorId: actor.id || "admin",
    actorEmail: actor.email,
    action: `enqueue_reviewer_email_${kind}`,
    entity: "application",
    entityId: applicationId,
    newValue: { kind, jobId: id },
    timestamp: t,
  });

  // Dual model: attempt immediate non-blocking dispatch in background if requested
  if (dispatchImmediate) {
    Promise.resolve().then(() => processSingleJob(db, job, { mailer })).catch(() => {});
  }

  return { status: "queued", jobId: id };
}

/**
 * Synchronous/direct reviewer message dispatch helper (ideal for test verification and synchronous flows).
 */
export async function dispatchReviewerMessage(db, { applicationId, kind, customMessage = "", actor = {}, mailer = null }) {
  const res = await enqueueReviewerMessage(db, { applicationId, kind, customMessage, actor, mailer, dispatchImmediate: false });
  if (res.status !== "queued") return res;

  const jobsCol = db.collection(COLLECTIONS.jobs);
  const job = await jobsCol.findOne({ _id: res.jobId });
  const processRes = await processSingleJob(db, job, { mailer });
  return { status: "sent", jobId: res.jobId, jobResult: processRes };
}

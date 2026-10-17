import "server-only";
import { COLLECTIONS } from "../../backend/mongo.mjs";
import { recordAuditLog } from "./audit.mjs";
import { validateReview, toReviewPayload, APPLICATION_STATUSES, PAGE_SIZE } from "../applications.mjs";

/** Formats a MongoDB document for the Admin Review Panel DTO */
export function formatApplication(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: String(_id),
    ...rest,
    submittedAt: doc.submittedAt ? new Date(doc.submittedAt).toISOString() : null,
    history: Array.isArray(doc.history) ? doc.history.map(h => ({
      ...h,
      at: h.at ? new Date(h.at).toISOString() : null,
    })) : [],
  };
}

export function createAdminApplicationsService({ db, now = () => new Date() }) {
  const applicationsCol = db.collection(COLLECTIONS.applications);
  const cyclesCol = db.collection(COLLECTIONS.cycles);

  async function getCurrentCycleId() {
    const current = await cyclesCol.findOne({ current: true });
    return current?._id || null;
  }

  return {
    async listApplications(options = {}, actor = {}) {
      const cycleId = options.cycleId || await getCurrentCycleId();
      const filter = {};
      if (cycleId) filter.cycleId = cycleId;

      // Role / domain scoping: restricted reviewers only access their assigned domain
      if (actor.role === "reviewer" && actor.domain) {
        filter.domains = actor.domain;
      } else if (options.domain) {
        filter.domains = options.domain;
      }

      if (options.status) {
        filter.status = options.status;
      }
      if (options.year) {
        filter.year = options.year;
      }

      if (options.query?.trim()) {
        const q = options.query.trim();
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ fullName: regex }, { rollNormalized: regex }, { email: regex }, { reference: regex }];
      }

      const page = Math.max(1, parseInt(options.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(options.limit || options.pageSize, 10) || PAGE_SIZE));
      const skip = (page - 1) * limit;

      const [docs, total, summaryCounts] = await Promise.all([
        applicationsCol.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit).toArray(),
        applicationsCol.countDocuments(filter),
        cycleId ? (async () => {
          const baseCycleFilter = { cycleId };
          if (actor.role === "reviewer" && actor.domain) baseCycleFilter.domains = actor.domain;
          const [totalCycle, newCount, shortlistedCount, selectedCount] = await Promise.all([
            applicationsCol.countDocuments(baseCycleFilter),
            applicationsCol.countDocuments({ ...baseCycleFilter, status: "New" }),
            applicationsCol.countDocuments({ ...baseCycleFilter, status: "Shortlisted" }),
            applicationsCol.countDocuments({ ...baseCycleFilter, status: "Selected" }),
          ]);
          return { total: totalCycle, new: newCount, shortlisted: shortlistedCount, selected: selectedCount };
        })() : { total: 0, new: 0, shortlisted: 0, selected: 0 },
      ]);

      const applications = docs.map(formatApplication);
      const pages = Math.max(1, Math.ceil(total / limit));

      return {
        status: "ok",
        applications,
        summary: summaryCounts,
        pagination: {
          page,
          pages,
          total,
          limit,
          start: total ? skip + 1 : 0,
          end: Math.min(skip + limit, total),
        },
      };
    },

    async getApplication(id, actor = {}) {
      if (!id) return { status: "not-found" };
      const doc = await applicationsCol.findOne({ $or: [{ _id: id }, { reference: id }] });
      if (!doc) return { status: "not-found" };

      // Domain reviewer authorization check
      if (actor.role === "reviewer" && actor.domain && !doc.domains?.includes(actor.domain)) {
        return { status: "unauthorized" };
      }

      return { status: "ok", application: formatApplication(doc) };
    },

    async saveReview(id, review, actor = {}) {
      if (!id || typeof review !== "object") return { status: "invalid", errors: { form: "Invalid request payload." } };

      const errors = validateReview(review);
      if (Object.keys(errors).length) return { status: "invalid", errors };

      const existing = await applicationsCol.findOne({ _id: id });
      if (!existing) return { status: "not-found" };

      // Domain reviewer scoping
      if (actor.role === "reviewer" && actor.domain && !existing.domains?.includes(actor.domain)) {
        return { status: "unauthorized" };
      }

      // Optimistic Concurrency Control: verify version matches
      const expectedVersion = review.version ?? existing.version;
      if (existing.version !== expectedVersion) {
        return { status: "conflict" };
      }

      const payload = toReviewPayload(review);
      const t = now();
      const actorName = actor.name || actor.email || "Administrator";

      // Build new history events
      const newHistory = [];
      if (existing.status !== payload.status) {
        newHistory.push({ at: t, by: actorName, action: "status", from: existing.status, to: payload.status });
      }
      if ((existing.notes || "").trim() !== payload.notes) {
        newHistory.push({ at: t, by: actorName, action: "notes" });
      }
      const existingInterviewStr = JSON.stringify(existing.interview || null);
      const newInterviewStr = JSON.stringify(payload.interview || null);
      if (existingInterviewStr !== newInterviewStr) {
        const text = payload.interview ? `${payload.interview.date} ${payload.interview.time} (${payload.interview.mode})` : "";
        newHistory.push({ at: t, by: actorName, action: "interview", text });
      }

      // Check messages
      const existingMessages = existing.messages || {};
      for (const [kind, text] of Object.entries(payload.messages || {})) {
        if (existingMessages[kind] !== text) {
          newHistory.push({ at: t, by: actorName, action: "message", kind });
        }
      }

      const newVersion = existing.version + 1;

      // Atomic conditional update
      const result = await applicationsCol.findOneAndUpdate(
        { _id: id, version: expectedVersion },
        {
          $set: {
            status: payload.status,
            notes: payload.notes,
            interview: payload.interview,
            messages: payload.messages,
            version: newVersion,
            updatedAt: t,
          },
          $push: {
            history: { $each: newHistory },
          },
        },
        { returnDocument: "after", includeResultMetadata: false }
      );

      if (!result) {
        // Concurrency collision occurred between read and write
        return { status: "conflict" };
      }

      // Audit log
      await recordAuditLog(db, {
        actorId: actor.id || "admin",
        actorEmail: actor.email,
        action: "save_application_review",
        entity: "application",
        entityId: id,
        oldValue: { status: existing.status, version: existing.version },
        newValue: { status: payload.status, version: newVersion },
        timestamp: t,
      });

      return { status: "saved", application: formatApplication(result) };
    },

    async updateStatus(id, newStatus, { version } = {}, actor = {}) {
      if (!APPLICATION_STATUSES.includes(newStatus)) {
        return { status: "invalid", errors: { status: "Choose a valid status." } };
      }
      const existing = await applicationsCol.findOne({ _id: id });
      if (!existing) return { status: "not-found" };
      return this.saveReview(id, {
        version: version ?? existing.version,
        status: newStatus,
        notes: existing.notes || "",
        interview: existing.interview || null,
        messages: existing.messages || {},
      }, actor);
    },
  };
}

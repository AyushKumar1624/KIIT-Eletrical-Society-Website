import test from "node:test";
import assert from "node:assert/strict";
import { createAdminApplicationsService, formatApplication } from "../lib/admin/server/applications-service.mjs";
import { escapeCsvField } from "../lib/admin/server/csv.mjs";
import { buildNotificationEmail, DEFAULT_COMMUNITY_LINKS, getCommunityLinks } from "../lib/notifications/jobs.mjs";
import { processSingleJob } from "../lib/notifications/runner.mjs";
import { createCmsService, CMS_TYPES } from "../lib/cms/service.mjs";
import { COLLECTIONS } from "../lib/backend/mongo.mjs";

function createMockDb() {
  const store = {
    [COLLECTIONS.applications]: new Map(),
    [COLLECTIONS.cycles]: new Map(),
    [COLLECTIONS.jobs]: new Map(),
    [COLLECTIONS.audit]: new Map(),
    [COLLECTIONS.cms]: new Map(),
    [COLLECTIONS.settings]: new Map(),
  };

  function collection(name) {
    const data = store[name] ??= new Map();
    return {
      async findOne(query) {
        for (const doc of data.values()) {
          if (match(doc, query)) return structuredClone(doc);
        }
        return null;
      },
      find(query = {}) {
        let items = Array.from(data.values()).filter(doc => match(doc, query));
        return {
          sort(sortObj) {
            const [key, dir] = Object.entries(sortObj)[0] || [];
            if (key) {
              items.sort((a, b) => {
                const va = a[key] instanceof Date ? a[key].getTime() : a[key];
                const vb = b[key] instanceof Date ? b[key].getTime() : b[key];
                return dir === -1 ? (vb > va ? 1 : vb < va ? -1 : 0) : (va > vb ? 1 : va < vb ? -1 : 0);
              });
            }
            return this;
          },
          skip(n) { items = items.slice(n); return this; },
          limit(n) { items = items.slice(0, n); return this; },
          async toArray() { return items.map(doc => structuredClone(doc)); },
        };
      },
      async countDocuments(query = {}) {
        return Array.from(data.values()).filter(doc => match(doc, query)).length;
      },
      async insertOne(doc) {
        data.set(doc._id, structuredClone(doc));
        return { insertedId: doc._id };
      },
      async updateOne(query, update) {
        for (const [id, doc] of data.entries()) {
          if (match(doc, query)) {
            applyUpdate(doc, update);
            data.set(id, doc);
            return { matchedCount: 1, modifiedCount: 1 };
          }
        }
        return { matchedCount: 0, modifiedCount: 0 };
      },
      async findOneAndUpdate(query, update, options = {}) {
        for (const [id, doc] of data.entries()) {
          if (match(doc, query)) {
            const before = structuredClone(doc);
            applyUpdate(doc, update);
            data.set(id, doc);
            return structuredClone(options.returnDocument === "after" ? doc : before);
          }
        }
        if (options.upsert) {
          const newDoc = { _id: query._id || `id-${Date.now()}-${Math.random()}` };
          applyUpdate(newDoc, update);
          data.set(newDoc._id, newDoc);
          return structuredClone(newDoc);
        }
        return null;
      },
      async deleteOne(query) {
        for (const [id, doc] of data.entries()) {
          if (match(doc, query)) {
            data.delete(id);
            return { deletedCount: 1 };
          }
        }
        return { deletedCount: 0 };
      },
    };
  }

  function match(doc, query) {
    if (!query || !Object.keys(query).length) return true;
    for (const [key, val] of Object.entries(query)) {
      if (key === "$or" && Array.isArray(val)) {
        if (!val.some(subQuery => match(doc, subQuery))) return false;
      } else if (val && typeof val === "object" && "$in" in val) {
        if (!val.$in.includes(doc[key])) return false;
      } else if (val && typeof val === "object" && "$lte" in val) {
        if (!(doc[key] <= val.$lte)) return false;
      } else if (val && typeof val === "object" && "$lt" in val) {
        if (!(doc[key] < val.$lt)) return false;
      } else if (val instanceof RegExp) {
        if (!val.test(String(doc[key] || ""))) return false;
      } else if (Array.isArray(doc[key])) {
        if (!doc[key].includes(val)) return false;
      } else {
        if (doc[key] !== val) return false;
      }
    }
    return true;
  }

  function applyUpdate(doc, update) {
    if (update.$set) {
      Object.assign(doc, structuredClone(update.$set));
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        doc[k] ??= [];
        if (v && v.$each && Array.isArray(v.$each)) {
          doc[k].push(...structuredClone(v.$each));
        } else {
          doc[k].push(structuredClone(v));
        }
      }
    }
  }

  return { collection, store };
}

test("Admin review service: server-side search, filtering, and summary counts", async () => {
  const db = createMockDb();
  await db.collection(COLLECTIONS.cycles).insertOne({ _id: "cycle-2026", name: "Recruitment 2026", current: true, open: true });

  const sampleApps = [
    { _id: "app-1", cycleId: "cycle-2026", reference: "KES-AAAA-1111", fullName: "Aarav Sharma", email: "aarav@kiit.ac.in", rollNormalized: "2305001", domains: ["robotics"], year: "2nd year", status: "New", version: 1, submittedAt: new Date(1000) },
    { _id: "app-2", cycleId: "cycle-2026", reference: "KES-BBBB-2222", fullName: "Bhavna Patel", email: "bhavna@kiit.ac.in", rollNormalized: "2305002", domains: ["web", "design"], year: "2nd year", status: "Shortlisted", version: 1, submittedAt: new Date(2000) },
    { _id: "app-3", cycleId: "cycle-2026", reference: "KES-CCCC-3333", fullName: "Chirag Sen", email: "chirag@kiit.ac.in", rollNormalized: "2405003", domains: ["embedded"], year: "1st year", status: "Selected", version: 1, submittedAt: new Date(3000) },
  ];

  for (const a of sampleApps) await db.collection(COLLECTIONS.applications).insertOne(a);

  const service = createAdminApplicationsService({ db });

  // List all in cycle
  const all = await service.listApplications({}, { role: "admin" });
  assert.equal(all.status, "ok");
  assert.equal(all.applications.length, 3);
  assert.deepEqual(all.summary, { total: 3, new: 1, shortlisted: 1, selected: 1 });

  // Search by query (name or roll)
  const searchName = await service.listApplications({ query: "aarav" }, { role: "admin" });
  assert.equal(searchName.applications.length, 1);
  assert.equal(searchName.applications[0].fullName, "Aarav Sharma");

  // Filter by domain
  const searchDomain = await service.listApplications({ domain: "web" }, { role: "admin" });
  assert.equal(searchDomain.applications.length, 1);
  assert.equal(searchDomain.applications[0].email, "bhavna@kiit.ac.in");

  // Domain reviewer isolation: a reviewer for 'robotics' cannot see 'web' applications
  const reviewerList = await service.listApplications({}, { role: "reviewer", domain: "robotics" });
  assert.equal(reviewerList.applications.length, 1);
  assert.equal(reviewerList.applications[0].id, "app-1");
});

test("Optimistic concurrency: stale version update is rejected with conflict", async () => {
  const db = createMockDb();
  await db.collection(COLLECTIONS.applications).insertOne({
    _id: "app-concurr",
    cycleId: "cycle-2026",
    fullName: "Concurrent Tester",
    email: "tester@kiit.ac.in",
    domains: ["ai"],
    status: "New",
    version: 3,
    notes: "Initial note",
    history: [],
  });

  const service = createAdminApplicationsService({ db });

  // Reviewer A saves version 3 -> succeeds, bumps to version 4
  const resA = await service.saveReview("app-concurr", {
    version: 3,
    status: "Under Review",
    notes: "Reviewer A note",
    interview: null,
    messages: {},
  }, { email: "reviewerA@example.com" });
  assert.equal(resA.status, "saved");
  assert.equal(resA.application.version, 4);
  assert.equal(resA.application.status, "Under Review");

  // Reviewer B had loaded version 3 and tries to save -> fails with conflict
  const resB = await service.saveReview("app-concurr", {
    version: 3,
    status: "Shortlisted",
    notes: "Reviewer B note",
    interview: null,
    messages: {},
  }, { email: "reviewerB@example.com" });
  assert.equal(resB.status, "conflict");

  // Check audit log was written for Reviewer A
  const auditLogs = await db.collection(COLLECTIONS.audit).find({ entityId: "app-concurr" }).toArray();
  assert.equal(auditLogs.length, 1);
  assert.equal(auditLogs[0].action, "save_application_review");
  assert.equal(auditLogs[0].oldValue.status, "New");
  assert.equal(auditLogs[0].newValue.status, "Under Review");
});

test("CSV Escaping protects against formula injection and delimiters", () => {
  assert.equal(escapeCsvField("Normal text"), "Normal text");
  assert.equal(escapeCsvField("Text with, comma"), '"Text with, comma"');
  assert.equal(escapeCsvField('Text with "quotes"'), '"Text with ""quotes"""');
  // Formula injection
  assert.equal(escapeCsvField("=SUM(A1:A10)"), "'=SUM(A1:A10)");
  assert.equal(escapeCsvField("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0");
  assert.equal(escapeCsvField("-2+3"), "'-2+3");
  assert.equal(escapeCsvField("@malicious"), "'@malicious");
});

test("Notification jobs: email template generation and selection links security", async () => {
  const db = createMockDb();
  const app = {
    _id: "app-sel-1",
    reference: "KES-WXYZ-7777",
    fullName: "Rohan Varma",
    email: "rohan@kiit.ac.in",
    domains: ["robotics", "embedded"],
    status: "Selected",
  };

  // 1. Acknowledgement email
  const ackEmail = await buildNotificationEmail(db, { kind: "applicant-acknowledgement" }, app);
  assert.equal(ackEmail.to, "rohan@kiit.ac.in");
  assert.match(ackEmail.subject, /KES-WXYZ-7777/);
  assert.ok(!ackEmail.text.includes("Official Group Links")); // Acknowledgement NEVER leaks group links

  // 2. Selection email includes domain-specific group links
  const selEmail = await buildNotificationEmail(db, { kind: "selection" }, app);
  assert.equal(selEmail.to, "rohan@kiit.ac.in");
  assert.ok(selEmail.text.includes("Official Group Links for Selected Members"));
  assert.ok(selEmail.text.includes("robotics"));
  assert.ok(selEmail.text.includes("embedded"));
  assert.ok(!selEmail.text.includes("design")); // Only chosen domains

  // 3. Process job execution
  const job = {
    _id: "job-1",
    kind: "selection",
    applicationId: "app-sel-1",
    status: "pending",
    attempts: 0,
    availableAt: new Date(Date.now() - 1000),
  };
  await db.collection(COLLECTIONS.jobs).insertOne(job);
  await db.collection(COLLECTIONS.applications).insertOne(app);

  const sentMails = [];
  const res = await processSingleJob(db, job, {
    mailer: async msg => { sentMails.push(msg); },
  });

  assert.equal(res.status, "sent");
  assert.equal(sentMails.length, 1);
  assert.equal(sentMails[0].to, "rohan@kiit.ac.in");

  // Check job updated to sent
  const updatedJob = await db.collection(COLLECTIONS.jobs).findOne({ _id: "job-1" });
  assert.equal(updatedJob.status, "sent");
});

test("CMS Service: CRUD operations and static fallbacks", async () => {
  const db = createMockDb();
  const cms = createCmsService({ db });

  // 1. Fallback returns static catalogue projects when collection is empty
  const initial = await cms.listContent("project", { publishedOnly: true });
  assert.equal(initial.status, "ok");
  assert.equal(initial.fallback, true);
  assert.equal(initial.items.length, 17); // Exact 17-project catalogue
  assert.equal(initial.items[0].slug, "self-balancing-robot");

  // 2. Save a new CMS event
  const saveRes = await cms.saveContent("event", "tech-fest-2027", {
    title: "Tech Fest 2027",
    published: true,
    order: 1,
    data: { venue: "Auditorium" },
  }, { email: "admin@example.com" });

  assert.equal(saveRes.status, "saved");
  assert.equal(saveRes.item.title, "Tech Fest 2027");

  // 3. List events now serves from MongoDB
  const events = await cms.listContent("event", { publishedOnly: true });
  assert.equal(events.fallback, false);
  assert.equal(events.items.length, 1);
  assert.equal(events.items[0].slug, "tech-fest-2027");

  // 4. Toggle publish state
  await cms.setPublishState("event", "tech-fest-2027", false);
  const publishedOnly = await cms.listContent("event", { publishedOnly: true });
  assert.equal(publishedOnly.items.length, 0); // unpublished not visible
  const allEvents = await cms.listContent("event", { publishedOnly: false });
  assert.equal(allEvents.items.length, 1);
});

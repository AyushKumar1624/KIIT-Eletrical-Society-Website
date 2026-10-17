import test from "node:test";
import assert from "node:assert/strict";
import { createVerifier } from "../lib/join/server/verifier.mjs";
import { createMemoryStore } from "../lib/join/server/store.mjs";
import { createApplicationService, DuplicateKeyError } from "../lib/join/server/applications.mjs";
import { hashPassword, verifyPassword } from "../lib/admin/server/passwords.mjs";
import { createAdminApplicationsService } from "../lib/admin/server/applications-service.mjs";
import { dispatchReviewerMessage } from "../lib/notifications/runner.mjs";
import { escapeCsvField } from "../lib/admin/server/csv.mjs";
import { COLLECTIONS } from "../lib/backend/mongo.mjs";

test("End-to-End Flow: Applicant Submission -> Mongo Record -> Admin Review -> Interview -> Selection", async () => {
  // Step 1: Storage and Mock Adapters
  const cycle = { _id: "2026-27", name: "Recruitment 2026", open: true, current: true };
  const apps = [];
  const jobs = [];
  const auditLogs = [];

  const repository = {
    apps,
    jobs,
    cycle,
    async currentCycle() { return this.cycle; },
    async findInCycle(cycleId, { email, rollNormalized }) {
      return apps.find(a => a.cycleId === cycleId && (a.email === email || a.rollNormalized === rollNormalized)) || null;
    },
    async insertWithJobs(doc, jobDocs) {
      if (apps.some(a => a.cycleId === doc.cycleId && a.email === doc.email)) throw new DuplicateKeyError("email");
      if (apps.some(a => a.cycleId === doc.cycleId && a.rollNormalized === doc.rollNormalized)) throw new DuplicateKeyError("roll");
      if (apps.some(a => a.reference === doc.reference)) throw new DuplicateKeyError("reference");
      apps.push(structuredClone(doc));
      jobs.push(...structuredClone(jobDocs));
    },
  };

  const appService = createApplicationService({ repository, now: () => new Date("2026-10-15T10:00:00Z") });

  // Step 2: Applicant OTP Flow
  let sentOtpEmail = null;
  const store = createMemoryStore();
  const secret = "test-secret-at-least-32-chars-long-12345";
  const verifier = createVerifier({
    store,
    send: async (msg) => { sentOtpEmail = msg; },
    secret,
    now: () => 1700000000000,
  });

  // A. Request OTP for KIIT institutional email
  const sendRes = await verifier.requestCode("2305999@kiit.ac.in", { ip: "127.0.0.1" });
  assert.equal(sendRes.status, "sent");
  assert.ok(sentOtpEmail != null);
  assert.equal(sentOtpEmail.to, "2305999@kiit.ac.in");
  assert.match(sentOtpEmail.code, /^\d{6}$/);

  // B. Confirm OTP atomically
  const confirmRes = await verifier.confirmCode("2305999@kiit.ac.in", sentOtpEmail.code);
  assert.equal(confirmRes.status, "verified");
  assert.ok(confirmRes.token);
  const tokenPayload = verifier.readToken(confirmRes.token);
  assert.equal(tokenPayload.email, "2305999@kiit.ac.in");

  // C. Submit Complete Application
  const submissionBody = {
    email: "2305999@kiit.ac.in",
    fullName: "Aaradhya Saxena",
    whatsapp: "+91 98765 43210",
    roll: "2305999",
    school: "School of Electrical Engineering",
    programme: "B.Tech EE",
    year: "2nd year",
    graduation: "2027",
    domains: ["robotics", "embedded"],
    motivation: "I have deep interest in microcontrollers and autonomous robotics projects.",
    skills: "C++, Python, FreeRTOS",
    explore: "Hardware control loops",
    link: "https://github.com/aaradhya-kes",
    confirmAccurate: true,
    consentContact: true,
  };

  const submitRes = await appService.submit(tokenPayload.email, { application: submissionBody });
  assert.equal(submitRes.status, "submitted");
  assert.ok(submitRes.reference.startsWith("KES-"));
  const reference = submitRes.reference;

  // Verify persistence
  assert.equal(apps.length, 1);
  const savedApp = apps[0];
  assert.equal(savedApp.reference, reference);
  assert.equal(savedApp.status, "New");
  assert.equal(savedApp.cycleId, "2026-27");
  assert.equal(savedApp.version, 1);

  // Verify queued notification jobs
  assert.equal(jobs.length, 2);
  const ackJob = jobs.find(j => j.kind === "applicant-acknowledgement");
  assert.ok(ackJob);
  assert.equal(ackJob.status, "pending");
  assert.equal(ackJob.applicationId, savedApp._id);

  // Step 3: Admin Provisioning & Authentication
  const hashedPw = await hashPassword("StrongAdminPass#2026");
  const isValidPw = await verifyPassword(hashedPw, "StrongAdminPass#2026");
  assert.equal(isValidPw, true);
  const isInvalidPw = await verifyPassword(hashedPw, "WrongPassword");
  assert.equal(isInvalidPw, false);

  // Step 4: Admin Review Service with Optimistic Concurrency
  // Build DB adapter for Admin Applications Service using the in-memory array
  const db = {
    collection(name) {
      if (name === COLLECTIONS.applications) {
        return {
          async findOne(query) {
            const item = apps.find(a => (!query._id || a._id === query._id) && (!query.cycleId || a.cycleId === query.cycleId));
            return item ? structuredClone(item) : null;
          },
          find(query = {}) {
            let filtered = [...apps];
            if (query.cycleId) filtered = filtered.filter(a => a.cycleId === query.cycleId);
            if (query.status) filtered = filtered.filter(a => a.status === query.status);
            if (query.domains) filtered = filtered.filter(a => a.domains.includes(query.domains));
            if (query.$or) {
              filtered = filtered.filter(a =>
                query.$or.some(sub => Object.entries(sub).every(([k, v]) => v instanceof RegExp ? v.test(a[k]) : a[k] === v))
              );
            }
            return {
              sort() { return this; },
              skip(n) { filtered = filtered.slice(n); return this; },
              limit(n) { filtered = filtered.slice(0, n); return this; },
              async toArray() { return filtered.map(x => structuredClone(x)); },
            };
          },
          async countDocuments() { return apps.length; },
          async findOneAndUpdate(query, update, options = {}) {
            const index = apps.findIndex(a => {
              for (const [k, v] of Object.entries(query)) {
                if (a[k] !== v) return false;
              }
              return true;
            });
            if (index === -1) return null;
            const before = structuredClone(apps[index]);
            if (update.$set) Object.assign(apps[index], structuredClone(update.$set));
            if (update.$push) {
              for (const [pk, pv] of Object.entries(update.$push)) {
                apps[index][pk] ??= [];
                apps[index][pk].push(structuredClone(pv));
              }
            }
            return structuredClone(options.returnDocument === "after" ? apps[index] : before);
          },
        };
      }
      if (name === COLLECTIONS.cycles) {
        return {
          async findOne(query) { return structuredClone(cycle); },
        };
      }
      if (name === COLLECTIONS.audit) {
        return {
          async insertOne(doc) {
            auditLogs.push(structuredClone(doc));
            return { insertedId: doc._id };
          },
        };
      }
      if (name === COLLECTIONS.jobs) {
        return {
          async insertOne(doc) {
            jobs.push(structuredClone(doc));
            return { insertedId: doc._id };
          },
          async findOne(query) {
            const j = jobs.find(job => (!query._id || job._id === query._id));
            return j ? structuredClone(j) : null;
          },
          async updateOne(query, update) {
            const j = jobs.find(job => (!query._id || job._id === query._id));
            if (!j) return { matchedCount: 0 };
            if (update.$set) Object.assign(j, structuredClone(update.$set));
            return { matchedCount: 1, modifiedCount: 1 };
          },
          async findOneAndUpdate(query, update, options = {}) {
            const j = jobs.find(job => {
              if (query._id && job._id !== query._id) return false;
              if (query.status && query.status.$in && !query.status.$in.includes(job.status)) return false;
              return true;
            });
            if (!j) return null;
            const before = structuredClone(j);
            if (update.$set) Object.assign(j, structuredClone(update.$set));
            return structuredClone(options.returnDocument === "after" ? j : before);
          },
        };
      }
      return {
        async findOne() { return null; },
        find() { return { sort() { return this; }, toArray: async () => [] }; },
      };
    },
  };

  const adminService = createAdminApplicationsService({ db });

  // A. List applications
  const list = await adminService.listApplications({ query: "Aaradhya" }, { role: "admin" });
  assert.equal(list.status, "ok");
  assert.equal(list.applications.length, 1);
  assert.equal(list.applications[0].reference, reference);
  assert.equal(list.summary.total, 1);
  assert.equal(list.summary.new, 1);

  // B. Open application details
  const detail = await adminService.getApplication(savedApp._id, { role: "admin" });
  assert.equal(detail.status, "ok");
  assert.equal(detail.application.fullName, "Aaradhya Saxena");
  assert.equal(detail.application.version, 1);

  // C. Reviewer updates status to Interview Scheduled
  const reviewUpdate = await adminService.saveReview(savedApp._id, {
    version: 1,
    status: "Interview Scheduled",
    notes: "Candidate has strong knowledge of STM32 and ROS.",
    interview: {
      date: "2026-11-05",
      time: "15:30",
      mode: "In person",
      place: "Robotics Lab, Campus 3",
    },
    messages: {},
  }, { id: "admin-1", email: "admin@kes.kiit.ac.in" });

  assert.equal(reviewUpdate.status, "saved");
  assert.equal(reviewUpdate.application.status, "Interview Scheduled");
  assert.equal(reviewUpdate.application.version, 2);

  // Verify audit log recorded
  assert.ok(auditLogs.length >= 1);
  const auditEntry = auditLogs[auditLogs.length - 1];
  assert.equal(auditEntry.action, "save_application_review");
  assert.equal(auditEntry.oldValue.status, "New");
  assert.equal(auditEntry.newValue.status, "Interview Scheduled");

  // Step 5: Explicit Reviewer Triggered Email for Interview
  const sentReviewerMails = [];
  const inviteRes = await dispatchReviewerMessage(db, {
    applicationId: savedApp._id,
    kind: "interview",
    actor: { id: "admin-1", email: "admin@kes.kiit.ac.in" },
    mailer: async msg => { sentReviewerMails.push(msg); },
  });
  assert.equal(inviteRes.status, "sent");
  assert.equal(sentReviewerMails.length, 1);
  assert.equal(sentReviewerMails[0].to, "2305999@kiit.ac.in");
  assert.match(sentReviewerMails[0].subject, /Interview Invitation/);
  assert.ok(sentReviewerMails[0].text.includes("Campus 3"));

  // Step 6: Advance status to Selected & Dispatch Selection Links
  const selectUpdate = await adminService.saveReview(savedApp._id, {
    version: 2,
    status: "Selected",
    notes: "Outstanding technical performance.",
    interview: reviewUpdate.application.interview,
    messages: {},
  }, { id: "admin-1", email: "admin@kes.kiit.ac.in" });

  assert.equal(selectUpdate.status, "saved");
  assert.equal(selectUpdate.application.status, "Selected");

  const sentSelectionMails = [];
  const selectEmailRes = await dispatchReviewerMessage(db, {
    applicationId: savedApp._id,
    kind: "selection",
    actor: { id: "admin-1", email: "admin@kes.kiit.ac.in" },
    mailer: async msg => { sentSelectionMails.push(msg); },
  });
  assert.equal(selectEmailRes.status, "sent");
  assert.equal(sentSelectionMails.length, 1);
  assert.ok(sentSelectionMails[0].text.includes("Official Group Links for Selected Members"));
  assert.ok(sentSelectionMails[0].text.includes("robotics"));
  assert.ok(sentSelectionMails[0].text.includes("embedded"));
  assert.ok(!sentSelectionMails[0].text.includes("design")); // Unchosen domains not leaked

  // Step 7: CSV Escaping Test
  const row = [reference, "=cmd|'calc'!A0", "Selected"].map(escapeCsvField).join(",");
  assert.equal(row, `${reference},'=cmd|'calc'!A0,Selected`);
});

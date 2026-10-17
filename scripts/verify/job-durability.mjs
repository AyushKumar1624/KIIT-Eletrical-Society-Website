process.env.NODE_ENV ??= "development";

import { processSingleJob } from "../../lib/notifications/runner.mjs";
import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";

console.log("=== VERIFYING DURABLE NOTIFICATION JOB FAILURE & RETRY BACKOFF ===");

const { db } = await getDatabase();
const jobsCol = db.collection(COLLECTIONS.jobs);
const applicationsCol = db.collection(COLLECTIONS.applications);

const testAppId = "test-job-durability-app";
const testJobId = "test-job-durability-job";

// Clean existing
await jobsCol.deleteOne({ _id: testJobId });
await applicationsCol.deleteOne({ _id: testAppId });

// Create test application
await applicationsCol.insertOne({
  _id: testAppId,
  cycleId: "2026-27",
  reference: "KES-TEST-DURABLE",
  fullName: "Durability Test Candidate",
  email: "durable.candidate@kiit.ac.in",
  rollNormalized: "2305999",
  whatsapp: "+91 99999 00000",
  school: "SEE",
  programme: "B.Tech",
  year: "1st year",
  graduation: "2028",
  domains: ["robotics"],
  status: "New",
  version: 1,
  digest: "digest-durable",
  submittedAt: new Date(),
  history: [],
});

// Create test pending job
await jobsCol.insertOne({
  _id: testJobId,
  kind: "applicant-acknowledgement",
  applicationId: testAppId,
  status: "pending",
  attempts: 0,
  createdAt: new Date(),
  availableAt: new Date(Date.now() - 1000),
});

// Mock failing mailer (simulating network outage / SMTP timeout)
const failingMailer = async () => {
  throw new Error("SMTP connection timeout (connection refused 504)");
};

console.log("Executing job with simulated SMTP failure...");
const failResult = await processSingleJob(db, { _id: testJobId }, { mailer: failingMailer });
console.log("Process result under SMTP failure:", failResult.status, "attempts:", failResult.attempts, "retryInMs:", failResult.retryInMs);

const updatedJob = await jobsCol.findOne({ _id: testJobId });
console.log("Job status in MongoDB:", updatedJob.status);
console.log("Job attempts counter in MongoDB:", updatedJob.attempts);
console.log("Job error message in MongoDB:", updatedJob.error);
console.log("Next availableAt scheduled in future:", updatedJob.availableAt > new Date());

// Assert application integrity was not affected
const appCheck = await applicationsCol.findOne({ _id: testAppId });
console.log("Application remains safely persisted:", Boolean(appCheck));

if (updatedJob.status === "pending" && updatedJob.attempts === 1 && updatedJob.availableAt > new Date()) {
  console.log(">>> PASS: Job state durably recorded as pending retry with future availableAt.");
} else {
  console.error(">>> FAIL: Job failure was not handled gracefully:", updatedJob);
  process.exitCode = 1;
}

// Now simulate restored SMTP service
console.log("\nSimulating retry when SMTP connectivity is restored...");
const sentMails = [];
const succeedingMailer = async (msg) => {
  sentMails.push(msg);
  return { messageId: "simulated-msg-id" };
};

const retryResult = await processSingleJob(db, { _id: testJobId }, { mailer: succeedingMailer });
console.log("Retry process result:", retryResult.status);
console.log("Sent emails count:", sentMails.length);

const finalJob = await jobsCol.findOne({ _id: testJobId });
console.log("Final job status in MongoDB:", finalJob.status);

// Clean up
await jobsCol.deleteOne({ _id: testJobId });
await applicationsCol.deleteOne({ _id: testAppId });

if (finalJob.status === "sent" && sentMails.length === 1) {
  console.log(">>> PASS: NOTIFICATION JOBS ARE DURABLE WITH RETRY AND BACKOFF.");
} else {
  console.error(">>> FAIL: Retrying job failed to reach 'sent' state:", finalJob);
  process.exitCode = 1;
}
await closeDatabase();
process.exit(process.exitCode || 0);

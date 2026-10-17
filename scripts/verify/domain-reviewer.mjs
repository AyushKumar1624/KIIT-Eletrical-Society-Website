process.env.NODE_ENV ??= "development";

import { createAdminApplicationsService } from "../../lib/admin/server/applications-service.mjs";
import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";

console.log("=== VERIFYING DOMAIN REVIEWER ISOLATION ===");

const { db } = await getDatabase();
const applicationsCol = db.collection(COLLECTIONS.applications);
const cyclesCol = db.collection(COLLECTIONS.cycles);

const cycle = await cyclesCol.findOne({ current: true });
const cycleId = cycle?._id || "2026-27";

// Clean existing test reviewer apps
await applicationsCol.deleteMany({ _id: { $in: ["test-app-robotics", "test-app-embedded"] } });

// Insert two applications with different domains
await applicationsCol.insertOne({
  _id: "test-app-robotics",
  cycleId,
  reference: "KES-ROBO-9999",
  fullName: "Robotics Candidate",
  email: "robotics.candidate@kiit.ac.in",
  rollNormalized: "2305991",
  whatsapp: "+91 99999 11111",
  school: "SEE",
  programme: "B.Tech",
  year: "1st year",
  graduation: "2028",
  domains: ["robotics"],
  status: "New",
  version: 1,
  digest: "digest-robo",
  submittedAt: new Date(),
  history: [],
});

await applicationsCol.insertOne({
  _id: "test-app-embedded",
  cycleId,
  reference: "KES-EMBD-9999",
  fullName: "Embedded Candidate",
  email: "embedded.candidate@kiit.ac.in",
  rollNormalized: "2305992",
  whatsapp: "+91 99999 22222",
  school: "SEE",
  programme: "B.Tech",
  year: "1st year",
  graduation: "2028",
  domains: ["embedded"],
  status: "New",
  version: 1,
  digest: "digest-embd",
  submittedAt: new Date(),
  history: [],
});

// Domain reviewer restricted to 'robotics'
const roboticsReviewer = {
  id: "reviewer-robo",
  email: "reviewer.robo@kes.kiit.ac.in",
  role: "reviewer",
  domain: "robotics",
};

const service = createAdminApplicationsService({ db });

// 1. List applications as robotics reviewer
const listResult = await service.listApplications({ cycleId }, roboticsReviewer);
const listedIds = listResult.applications.map(a => a.id);
console.log("Robotics Reviewer listed application IDs:", listedIds);

const seesRobotics = listedIds.includes("test-app-robotics");
const seesEmbedded = listedIds.includes("test-app-embedded");

console.log("Robotics Reviewer sees Robotics App:", seesRobotics);
console.log("Robotics Reviewer sees Embedded App:", seesEmbedded);

// 2. Direct fetch of own domain application
const fetchOwnResult = await service.getApplication("test-app-robotics", roboticsReviewer);
console.log("Fetch own domain application (robotics):", fetchOwnResult.status);

// 3. Direct fetch of unauthorized domain application
const fetchOtherResult = await service.getApplication("test-app-embedded", roboticsReviewer);
console.log("Fetch other domain application (embedded):", fetchOtherResult.status);

// 4. Mutation attempt on unauthorized domain application
const mutateOtherResult = await service.saveReview("test-app-embedded", {
  version: 1,
  status: "Under Review",
  notes: "Unauthorized edit",
}, roboticsReviewer);
console.log("Mutate other domain application (embedded):", mutateOtherResult.status);

// Clean up
await applicationsCol.deleteMany({ _id: { $in: ["test-app-robotics", "test-app-embedded"] } });

if (seesRobotics && !seesEmbedded && fetchOwnResult.status === "ok" && fetchOtherResult.status === "unauthorized" && mutateOtherResult.status === "unauthorized") {
  console.log(">>> PASS: DOMAIN REVIEWER ISOLATION STRICTLY ENFORCED SERVER-SIDE.");
} else {
  console.error(">>> FAIL: Domain reviewer isolation was violated!");
  process.exitCode = 1;
}
await closeDatabase();
process.exit(process.exitCode || 0);

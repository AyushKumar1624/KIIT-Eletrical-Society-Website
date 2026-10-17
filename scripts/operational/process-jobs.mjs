import { getDatabase, closeDatabase } from "../../lib/backend/mongo.mjs";
import { processDueJobs } from "../../lib/notifications/runner.mjs";

console.info("[jobs] Checking and processing due notification jobs in MongoDB...");

try {
  const { db } = await getDatabase();
  const result = await processDueJobs(db, { limit: 50 });
  console.info(`[jobs] Processed ${result.processed} job(s).`);
  for (const item of result.details) {
    console.info(`  - Job ${item.id} (${item.kind}): ${item.result.status}${item.result.error ? ` (${item.result.error})` : ""}`);
  }
} catch (error) {
  console.error("[jobs] Failed to process notification jobs:", error?.message || error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

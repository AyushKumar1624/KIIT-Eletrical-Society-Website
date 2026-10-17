/**
 * Production Database Initializer
 * Safe, idempotent database setup and content bootstrap.
 * 
 * Invariants:
 * - NEVER drops databases or collections.
 * - NEVER deletes existing data.
 * - NEVER overwrites existing records (uses $setOnInsert for initial seed).
 * - Ensures JSON schema validators and indexes are up to date.
 */

import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";
import { setupDatabase } from "../../lib/backend/indexes.mjs";
import { CMS_TYPES, getStaticFallback } from "../../lib/cms/service.mjs";

console.info(`\n==================================================================`);
console.info(`  KIIT ELECTRICAL SOCIETY — PRODUCTION DATABASE INITIALIZER`);
console.info(`==================================================================\n`);

try {
  console.info("[init] 1. Connecting to MongoDB...");
  const { db } = await getDatabase();
  await db.command({ ping: 1 });
  console.info("  [✓] Database connection established.");

  console.info("[init] 2. Applying schema validators and creating indexes...");
  await setupDatabase(db);
  console.info("  [✓] All 10 collection schemas and indexes verified.");

  console.info("[init] 3. Verifying recruitment cycle...");
  const cyclesCol = db.collection(COLLECTIONS.cycles);
  const currentCycle = await cyclesCol.findOne({ current: true });
  if (!currentCycle) {
    const defaultCycle = {
      name: "2026-27",
      open: true,
      current: true,
      opensAt: new Date(),
      closesAt: null,
      updatedAt: new Date(),
    };
    await cyclesCol.insertOne(defaultCycle);
    console.info("  [✓] Initial recruitment cycle '2026-27' created as active.");
  } else {
    console.info(`  [✓] Current active recruitment cycle exists: '${currentCycle.name}'`);
  }

  console.info("[init] 4. Seeding default CMS content if unpopulated (idempotent)...");
  const cmsCol = db.collection(COLLECTIONS.cms);
  let seededCount = 0;

  for (const type of CMS_TYPES) {
    const items = getStaticFallback(type);
    for (const item of items) {
      const { type: itemType, slug, ...rest } = item;
      const res = await cmsCol.updateOne(
        { type: itemType, slug },
        {
          $setOnInsert: {
            type: itemType,
            slug,
            ...rest,
            createdAt: new Date(),
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      if (res.upsertedCount > 0) seededCount++;
    }
  }
  console.info(`  [✓] CMS seed check complete. (${seededCount} new documents seeded, existing preserved).`);

  console.info(`\n==================================================================`);
  console.info(`  RESULT: SUCCESS — Production database is fully initialized and ready.`);
  console.info(`==================================================================\n`);
} catch (error) {
  console.error(`\n  [✗ ERROR] Production initialization failed: ${error?.message || error}`);
  console.info(`==================================================================\n`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

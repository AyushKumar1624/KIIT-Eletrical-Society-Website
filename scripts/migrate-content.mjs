// Safe, idempotent migration of static website content into MongoDB cms_content collection.
// Does NOT delete or replace existing factual content.
// Never invents fake dates, projects, prize amounts, or photographs.

import { getDatabase, closeDatabase, COLLECTIONS } from "../lib/backend/mongo.mjs";
import { setupDatabase } from "../lib/backend/indexes.mjs";
import { CMS_TYPES, getStaticFallback } from "../lib/cms/service.mjs";

console.info("[migration] Starting content migration from local content registry to MongoDB...");

try {
  const { db } = await getDatabase();
  await setupDatabase(db);
  const cmsCol = db.collection(COLLECTIONS.cms);

  let totalMigrated = 0;

  for (const type of CMS_TYPES) {
    const items = getStaticFallback(type);
    console.info(`[migration] Processing type: ${type} (${items.length} items)...`);

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

      if (res.upsertedCount > 0) {
        totalMigrated++;
        console.info(`  + Inserted ${itemType}/${slug}`);
      }
    }
  }

  console.info(`[migration] Content migration complete. Total new items inserted: ${totalMigrated}.`);
} catch (error) {
  console.error("[migration] Content migration failed:", error?.message || error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

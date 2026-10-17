import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";
import { setupDatabase } from "../../lib/backend/indexes.mjs";
import { CMS_TYPES, getStaticFallback } from "../../lib/cms/service.mjs";

console.info("[migration] Starting idempotent content migration to MongoDB...");

try {
  const { db } = await getDatabase();
  await setupDatabase(db);
  const cmsCol = db.collection(COLLECTIONS.cms);

  let totalMigrated = 0;

  for (const type of CMS_TYPES) {
    const items = getStaticFallback(type);
    console.info(`[migration] Processing ${type} (${items.length} items)...`);

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

  console.info(`[migration] Migration complete. Total new items inserted: ${totalMigrated}. Existing items preserved.`);
} catch (error) {
  console.error("[migration] Migration failed:", error?.message || error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

import { getDatabase, closeDatabase } from "../lib/backend/mongo.mjs";
import { setupDatabase } from "../lib/backend/indexes.mjs";
import { safeLog } from "../lib/backend/http.mjs";
try {
  const { db } = await getDatabase();
  await db.command({ ping: 1 });
  await setupDatabase(db);
  console.info("Backend collections and indexes are ready.");
} catch { safeLog("backend_setup_failed"); process.exitCode = 1; }
finally { await closeDatabase(); }

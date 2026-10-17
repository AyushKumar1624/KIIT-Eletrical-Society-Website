import { requireAdminRequest } from "@/lib/admin/server/http.mjs";
import { json, sameOrigin, safeLog } from "@/lib/backend/http.mjs";
import { getDatabase } from "@/lib/backend/mongo.mjs";
import { processDueJobs } from "@/lib/notifications/runner.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return json({ status: "error" }, 403);
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;

  try {
    const { db } = await getDatabase();
    const result = await processDueJobs(db, { limit: 20 });
    return json({ status: "ok", ...result }, 200);
  } catch (error) {
    safeLog("admin_service_failed");
    return json({ status: "unavailable" }, 503);
  }
}

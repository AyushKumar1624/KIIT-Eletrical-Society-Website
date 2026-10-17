import { requireAdminRequest } from "@/lib/admin/server/http.mjs";
import { json, readJson, sameOrigin, RequestError, safeLog } from "@/lib/backend/http.mjs";
import { getDatabase } from "@/lib/backend/mongo.mjs";
import { createAdminApplicationsService } from "@/lib/admin/server/applications-service.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;

  try {
    const { db } = await getDatabase();
    const service = createAdminApplicationsService({ db });
    const { searchParams } = new URL(request.url);

    const result = await service.listApplications({
      query: searchParams.get("query") || "",
      domain: searchParams.get("domain") || "",
      year: searchParams.get("year") || "",
      status: searchParams.get("status") || "",
      cycleId: searchParams.get("cycleId") || "",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 50,
    }, access.session.user);

    return json(result, 200);
  } catch (error) {
    safeLog("admin_service_failed");
    return json({ status: "unavailable" }, 503);
  }
}

export async function PUT(request) {
  if (!sameOrigin(request)) return json({ status: "error" }, 403);
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;

  try {
    const body = await readJson(request);
    const { id, review } = body;
    if (!id || !review) return json({ status: "invalid", errors: { form: "Missing application ID or review data." } }, 400);

    const { db } = await getDatabase();
    const service = createAdminApplicationsService({ db });
    const result = await service.saveReview(id, review, access.session.user);

    const statusCodes = {
      saved: 200,
      invalid: 400,
      "not-found": 404,
      conflict: 409,
      unauthorized: 403,
      unavailable: 503,
    };

    return json(result, statusCodes[result.status] || 500);
  } catch (error) {
    if (error instanceof RequestError) return json({ status: "invalid" }, error.status);
    safeLog("admin_service_failed");
    return json({ status: "unavailable" }, 503);
  }
}

export async function PATCH(request) {
  return PUT(request);
}

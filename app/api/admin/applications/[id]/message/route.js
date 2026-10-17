import { requireAdminRequest } from "@/lib/admin/server/http.mjs";
import { json, readJson, sameOrigin, RequestError, safeLog } from "@/lib/backend/http.mjs";
import { getDatabase } from "@/lib/backend/mongo.mjs";
import { enqueueReviewerMessage } from "@/lib/notifications/runner.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_KINDS = new Set(["shortlisting", "interview-invitation", "selection", "non-selection"]);

export async function POST(request, { params }) {
  if (!sameOrigin(request)) return json({ status: "error" }, 403);
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;

  try {
    const { id } = await params;
    const body = await readJson(request);
    const { kind, message } = body;

    if (!kind || !VALID_KINDS.has(kind)) {
      return json({ status: "invalid", errors: { kind: "Invalid or unsupported message kind." } }, 400);
    }

    const { db } = await getDatabase();
    const result = await enqueueReviewerMessage(db, {
      applicationId: id,
      kind,
      customMessage: message,
      actor: access.session.user,
    });

    if (result.status === "not-found") {
      return json({ status: "not-found" }, 404);
    }

    return json(result, 200);
  } catch (error) {
    if (error instanceof RequestError) return json({ status: "invalid" }, error.status);
    safeLog("admin_service_failed");
    return json({ status: "unavailable" }, 503);
  }
}

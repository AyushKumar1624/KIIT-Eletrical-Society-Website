import { requireAdminRequest } from "@/lib/admin/server/http.mjs";
import { json, readJson, sameOrigin, RequestError, safeLog } from "@/lib/backend/http.mjs";
import { getDatabase } from "@/lib/backend/mongo.mjs";
import { createCmsService, CMS_TYPES } from "@/lib/cms/service.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;

  try {
    const { type } = await params;
    if (!CMS_TYPES.includes(type)) return json({ status: "invalid" }, 400);

    const { db } = await getDatabase();
    const cms = createCmsService({ db });
    const result = await cms.listContent(type, { publishedOnly: false });

    return json(result, 200);
  } catch (error) {
    safeLog("admin_service_failed");
    return json({ status: "unavailable" }, 503);
  }
}

export async function POST(request, { params }) {
  if (!sameOrigin(request)) return json({ status: "error" }, 403);
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;

  try {
    const { type } = await params;
    if (!CMS_TYPES.includes(type)) return json({ status: "invalid" }, 400);

    const body = await readJson(request);
    const { slug, ...payload } = body;
    if (!slug) return json({ status: "invalid", errors: { slug: "Slug is required." } }, 400);

    const { db } = await getDatabase();
    const cms = createCmsService({ db });
    const result = await cms.saveContent(type, slug, payload, access.session.user);

    return json(result, 200);
  } catch (error) {
    if (error instanceof RequestError) return json({ status: "invalid" }, error.status);
    safeLog("admin_service_failed");
    return json({ status: "unavailable" }, 503);
  }
}

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) return json({ status: "error" }, 403);
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;

  try {
    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) return json({ status: "invalid" }, 400);

    const { db } = await getDatabase();
    const cms = createCmsService({ db });
    const result = await cms.deleteContent(type, slug, access.session.user);

    return json(result, 200);
  } catch (error) {
    safeLog("admin_service_failed");
    return json({ status: "unavailable" }, 503);
  }
}

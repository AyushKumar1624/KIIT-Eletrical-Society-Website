import { json, safeLog } from "@/lib/backend/http.mjs";
import { getDatabase } from "@/lib/backend/mongo.mjs";
import { createCmsService, CMS_TYPES } from "@/lib/cms/service.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { type } = await params;
    if (!CMS_TYPES.includes(type)) {
      return json({ status: "not-found", message: `Unknown content type: ${type}` }, 404);
    }

    const { db } = await getDatabase();
    const cms = createCmsService({ db });

    const result = await cms.listContent(type, { publishedOnly: true });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // If database connection is not configured yet, serve from static fallback
    try {
      const { type } = await params;
      const { getStaticFallback } = await import("@/lib/cms/service.mjs");
      const items = getStaticFallback(type);
      return json({ status: "ok", items, fallback: true }, 200);
    } catch {
      return json({ status: "unavailable" }, 503);
    }
  }
}

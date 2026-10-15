import { requireAdminRequest } from "@/lib/admin/server/http.mjs";
import { json } from "@/lib/backend/http.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request) {
  const access = await requireAdminRequest(request);
  if (access.response) return access.response;
  return json({ status: "unavailable" }, 503);
}

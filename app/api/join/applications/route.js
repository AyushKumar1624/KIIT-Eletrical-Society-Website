// POST { token, application }. Verification is connected; storing or
// forwarding applications is not yet. A valid token gets an honest
// "unavailable" — nothing is claimed as received.
import { getVerifier, sameOrigin, readJson, json } from "@/lib/join/server/index.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return json({ status: "error" }, 403);
  const verifier = getVerifier();
  if (!verifier) return json({ status: "unavailable" }, 503);
  const body = await readJson(request);
  const verified = verifier.readToken(body?.token);
  if (!verified || verified.email !== String(body?.application?.email ?? "").toLowerCase()) {
    return json({ status: "unauthorized" }, 401);
  }
  return json({ status: "unavailable" }, 503);
}

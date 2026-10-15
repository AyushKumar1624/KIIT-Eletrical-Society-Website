// POST { email, code } → { status: "verified", token } when the code matches.
import { getVerifier, sameOrigin, readJson, json } from "@/lib/join/server/index.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return json({ status: "error" }, 403);
  const verifier = getVerifier();
  if (!verifier) return json({ status: "unavailable" }, 503);
  const body = await readJson(request);
  try {
    return json(await verifier.confirmCode(body?.email, body?.code));
  } catch (error) {
    console.error("[join] Could not check a verification code:", error?.message || error);
    return json({ status: "error" }, 500);
  }
}

// POST { email } → sends a one-time code to an eligible KIIT address.
import { getVerifier, verificationStatus, sameOrigin, clientIp, readJson, json } from "@/lib/join/server/index.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return json({ status: "error" }, 403);
  const verifier = getVerifier();
  if (!verifier) return json({ status: "unavailable" }, 503);
  const body = await readJson(request);
  try {
    const result = await verifier.requestCode(body?.email, { ip: clientIp(request) });
    if (result.status === "sent" && verificationStatus().mode === "console") {
      result.devNote = "Development server: no email was sent. The code is printed in the server console.";
    }
    return json(result, result.status === "rate_limited" ? 429 : 200);
  } catch (error) {
    console.error("[join] Could not send a verification code:", error?.message || error);
    return json({ status: "error" }, 502);
  }
}

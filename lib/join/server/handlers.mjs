import "server-only";
import { getVerifier, verificationStatus, getApplicationService } from "./index.mjs";
import { applicantCookie, applicantToken } from "./applicant-session.mjs";
import { JOIN_LIMITS } from "./config.mjs";
import { sameOrigin, clientIp, readJson, json, RequestError, safeLog } from "../../backend/http.mjs";
// Factories let regression tests exercise the actual HTTP behaviour without
// Next.js aliases or a network server.
export function verificationHandler(kind, { verifier = getVerifier, status = verificationStatus, origin = sameOrigin, ip = clientIp } = {}) {
  return async request => {
    if (!origin(request)) return json({ status: "error" }, 403);
    try {
      const body = await readJson(request);
      if (typeof body.email !== "string" || body.email.length > 254 || kind === "confirm" && typeof body.code !== "string") return json({ status: "invalid" }, 400);
      const service = await verifier();
      if (!service) return json({ status: "unavailable" }, 503);
      const result = kind === "request" ? await service.requestCode(body.email, { ip: ip(request) }) : await service.confirmCode(body.email, body.code);
      if (result.status === "sent" && status().mode === "console") result.devNote = "Development server: no email was sent. The code is printed in the server console.";
      // The verification token never reaches page scripts: it becomes an
      // HttpOnly cookie, and the response names only the verified address.
      if (result.status === "verified") {
        return json({ status: "verified", email: service.readToken(result.token).email, expiresIn: JOIN_LIMITS.tokenTtl }, 200, { "Set-Cookie": applicantCookie(result.token) });
      }
      return json(result, result.status === "rate_limited" ? 429 : 200, result.retryAfter ? { "Retry-After": String(result.retryAfter) } : {});
    } catch (error) {
      if (error instanceof RequestError) return json({ status: "invalid" }, error.status);
      safeLog(kind === "request" ? "join_request_failed" : "join_confirm_failed");
      return json({ status: "unavailable" }, 503);
    }
  };
}

const SUBMIT_CODES = { submitted: 201, invalid: 400, unauthorized: 401, duplicate: 409, unavailable: 503 };
// POST /api/join/applications { application }. The applicant is identified
// only by the verified-applicant cookie.
export function applicationsHandler({ verifier = getVerifier, applications = getApplicationService, origin = sameOrigin } = {}) {
  return async request => {
    if (!origin(request)) return json({ status: "error" }, 403);
    try {
      const body = await readJson(request);
      const [verify, service] = [await verifier(), await applications()];
      if (!verify || !service) return json({ status: "unavailable" }, 503);
      const session = verify.readToken(applicantToken(request));
      if (!session) return json({ status: "unauthorized" }, 401, { "Set-Cookie": applicantCookie("", { clear: true }) });
      const result = await service.submit(session.email, body);
      // A completed submission ends the verified session and kicks off background notifications
      if (result.status === "submitted") {
        import("../../backend/mongo.mjs").then(m => m.getDatabase()).then(({ db }) => {
          import("../../notifications/runner.mjs").then(r => r.processDueJobs(db, { limit: 5 })).catch(() => {});
        }).catch(() => {});
      }
      const headers = result.status === "submitted" ? { "Set-Cookie": applicantCookie("", { clear: true }) } : {};
      return json(result, SUBMIT_CODES[result.status] ?? 500, headers);
    } catch (error) {
      if (error instanceof RequestError) return json({ status: "invalid" }, error.status);
      safeLog("join_submit_failed");
      return json({ status: "unavailable" }, 503);
    }
  };
}

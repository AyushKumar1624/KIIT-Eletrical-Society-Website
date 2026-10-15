import "server-only";
import { adminConfig } from "../../backend/config.mjs";
import { getAdminBackend } from "./index.mjs";
import { json, sameOrigin, readJson, clientIp, RequestError, safeLog } from "../../backend/http.mjs";

export const cookieName = (env = process.env) => env.NODE_ENV === "production" ? "__Host-kes-admin" : "kes-admin";
export function sessionToken(request, env = process.env) {
  const value = (request.headers.get("cookie") || "").split(";").map(s => s.trim()).find(s => s.startsWith(`${cookieName(env)}=`));
  return value?.slice(value.indexOf("=") + 1) || null;
}
export function sessionCookie(token, config, clear = false) {
  return `${cookieName({ NODE_ENV: config.secure ? "production" : "development" })}=${clear ? "" : token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : Math.floor(config.absoluteMs / 1000)}${config.secure ? "; Secure" : ""}`;
}
export function createAuthHandler(action, { backend = getAdminBackend, origin = sameOrigin, ip = clientIp, config = adminConfig } = {}) {
  return async request => {
    if (action !== "session" && !origin(request)) return json({ status: "rejected" }, 403);
    if (action === "session" && (request.headers.get("sec-fetch-site") === "cross-site" || (request.headers.has("origin") && !origin(request)))) return json({ status: "unauthenticated" }, 403);
    try {
      const body = ["sign-in", "recovery", "reset"].includes(action) ? await readJson(request) : {};
      const service = await backend(); const settings = config();
      if (!service || !settings) return json({ status: "unavailable" }, 503);
      const token = sessionToken(request); const context = { ip: ip(request) };
      const result = action === "sign-in" ? await service.signIn(body, context) : action === "session" ? await service.getSession(token) : action === "logout" ? await service.logout(token) : action === "recovery" ? await service.recoverPassword(body.email, context) : await service.resetPassword(body, context);
      const { token: newToken, ...publicResult } = result;
      const headers = {};
      if (newToken) headers["Set-Cookie"] = sessionCookie(newToken, settings);
      if (action === "logout" && result.status === "unauthenticated" || action === "reset" && result.passwordReset) headers["Set-Cookie"] = sessionCookie("", settings, true);
      if (result.retryAfter) headers["Retry-After"] = String(result.retryAfter);
      const statusCode = result.status === "unavailable" ? 503 : result.status === "invalid" ? 400 : result.status === "rejected" ? result.retryAfter ? 429 : 401 : 200;
      return json(publicResult, statusCode, headers);
    } catch (error) {
      if (error instanceof RequestError) return json({ status: "invalid" }, error.status);
      safeLog("admin_service_failed"); return json({ status: "unavailable" }, 503);
    }
  };
}
export async function requireAdminRequest(request, backend = getAdminBackend) {
  try {
    const service = await backend();
    if (!service) return { response: json({ status: "unavailable" }, 503) };
    const result = await service.getSession(sessionToken(request));
    return result.status === "authenticated" ? { session: result.session } : { response: json({ status: "unauthenticated" }, 401) };
  } catch { safeLog("admin_service_failed"); return { response: json({ status: "unavailable" }, 503) }; }
}

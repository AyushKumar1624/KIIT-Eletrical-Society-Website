// Verified-applicant session: the signed, email-bound verification token in a
// short-lived HttpOnly cookie. Separate name and purpose from the admin session;
// never readable by page scripts and never stored in localStorage/sessionStorage.
import "server-only";
import { JOIN_LIMITS } from "./config.mjs";

export const applicantCookieName = (env = process.env) => env.NODE_ENV === "production" ? "__Host-kes-join" : "kes-join";

export function applicantToken(request, env = process.env) {
  const prefix = `${applicantCookieName(env)}=`;
  const value = (request.headers.get("cookie") || "").split(";").map(s => s.trim()).find(s => s.startsWith(prefix));
  return value?.slice(prefix.length) || null;
}

export function applicantCookie(token, { clear = false, env = process.env } = {}) {
  const secure = env.NODE_ENV === "production";
  return `${applicantCookieName(env)}=${clear ? "" : token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : JOIN_LIMITS.tokenTtl}${secure ? "; Secure" : ""}`;
}

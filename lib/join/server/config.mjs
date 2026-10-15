import "server-only";
import { databaseConfig, applicationOrigins } from "../../backend/config.mjs";
export const JOIN_LIMITS = Object.freeze({ codeTtl: 600, resendAfter: 60, maxAttempts: 5, perEmailPerHour: 5, perIpPerHour: 20, tokenTtl: 1800 });
export function mailConfig(e = process.env) {
  if (!e.SMTP_HOST || !e.JOIN_EMAIL_FROM || /[\r\n]/.test(`${e.SMTP_HOST}${e.JOIN_EMAIL_FROM}${e.JOIN_EMAIL_REPLY_TO || ""}`)) return null;
  const port = Number(e.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || Boolean(e.SMTP_USER) !== Boolean(e.SMTP_PASS)) return null;
  if (e.SMTP_SECURE && !["true", "false"].includes(e.SMTP_SECURE)) return null;
  return { host: e.SMTP_HOST, port, secure: e.SMTP_SECURE ? e.SMTP_SECURE === "true" : port === 465, user: e.SMTP_USER || "", pass: e.SMTP_PASS || "", from: e.JOIN_EMAIL_FROM, replyTo: e.JOIN_EMAIL_REPLY_TO || undefined };
}
export function joinSecret(e = process.env) { return (e.JOIN_SECRET || "").length >= 32 ? e.JOIN_SECRET : null; }
export function storeConfig(e = process.env) {
  const kind = e.JOIN_STORE || (e.UPSTASH_REDIS_REST_URL || e.UPSTASH_REDIS_REST_TOKEN ? "upstash" : databaseConfig(e) ? "mongodb" : null);
  if (kind === "memory") return e.NODE_ENV === "development" ? { kind } : null;
  if (kind === "mongodb") return databaseConfig(e) ? { kind } : null;
  if (kind === "upstash") {
    try { const url = new URL(e.UPSTASH_REDIS_REST_URL); if (url.protocol !== "https:" || url.username || url.password || !e.UPSTASH_REDIS_REST_TOKEN) return null; return { kind, url: url.href.replace(/\/$/, ""), token: e.UPSTASH_REDIS_REST_TOKEN }; } catch { return null; }
  }
  return null;
}
// Configuration readiness only; runtime store/SMTP failures return 503.
export function verificationStatus(e = process.env) {
  const store = storeConfig(e);
  const mode = e.JOIN_DELIVERY === "console" ? e.NODE_ENV === "development" ? "console" : null : (!e.JOIN_DELIVERY || e.JOIN_DELIVERY === "smtp") && mailConfig(e) ? "smtp" : null;
  return { ready: Boolean(joinSecret(e) && store && mode && applicationOrigins(e).length), mode, store: store?.kind || null };
}

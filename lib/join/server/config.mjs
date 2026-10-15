// Server-only settings for Join KES email verification. Read from the
// environment at request time; see .env.example and docs/join-kes-integration.md.
import { randomBytes } from "node:crypto";

export const JOIN_LIMITS = Object.freeze({
  codeTtl: 600,        // a code works for 10 minutes
  resendAfter: 60,     // seconds before another code can be sent to the same address
  maxAttempts: 5,      // wrong guesses per code
  perEmailPerHour: 5,  // codes per address per hour
  perIpPerHour: 20,    // code requests per client per hour
  tokenTtl: 1800,      // a verified session lasts 30 minutes
});

const env = () => process.env;
const isDev = () => env().NODE_ENV !== "production";

/** SMTP settings, or null when email sending isn't configured. */
export function mailConfig() {
  const e = env();
  if (!e.SMTP_HOST || !e.JOIN_EMAIL_FROM) return null;
  const port = Number(e.SMTP_PORT || 587);
  return {
    host: e.SMTP_HOST,
    port,
    secure: e.SMTP_SECURE ? e.SMTP_SECURE === "true" : port === 465,
    user: e.SMTP_USER || "",
    pass: e.SMTP_PASS || "",
    from: e.JOIN_EMAIL_FROM,
    replyTo: e.JOIN_EMAIL_REPLY_TO || undefined,
  };
}

/** Signing secret for codes and tokens. Production requires JOIN_SECRET (32+ characters). */
export function joinSecret() {
  const s = env().JOIN_SECRET;
  if (s && s.length >= 32) return s;
  if (!isDev()) return null;
  globalThis.__kesJoinDevSecret ??= randomBytes(32).toString("hex"); // development only, per process
  return globalThis.__kesJoinDevSecret;
}

export function storeConfig() {
  const e = env();
  return e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN
    ? { kind: "upstash", url: e.UPSTASH_REDIS_REST_URL, token: e.UPSTASH_REDIS_REST_TOKEN }
    : { kind: "memory" };
}

/**
 * Whether verification can run. In development without SMTP, codes are
 * printed to the server console instead of emailed ("console" mode).
 * Production never falls back: without SMTP and a secret it is unavailable.
 */
export function verificationStatus() {
  const secret = Boolean(joinSecret());
  const mail = mailConfig();
  if (secret && mail) return { ready: true, mode: "smtp" };
  if (secret && isDev()) return { ready: true, mode: "console" };
  return { ready: false, mode: null };
}

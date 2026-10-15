// Server entry point for Join KES verification. Import only from route
// handlers and server components.
import { joinSecret, mailConfig, storeConfig, verificationStatus } from "./config.mjs";
import { createMemoryStore, createUpstashStore } from "./store.mjs";
import { createConsoleSender, createSmtpSender } from "./mailer.mjs";
import { createVerifier } from "./verifier.mjs";

export { verificationStatus };

/** The shared verifier, or null when verification isn't configured. */
export function getVerifier() {
  const status = verificationStatus();
  if (!status.ready) return null;
  const key = `${status.mode}:${storeConfig().kind}`;
  if (globalThis.__kesJoinVerifier?.key !== key) {
    const store = storeConfig().kind === "upstash" ? createUpstashStore(storeConfig()) : createMemoryStore();
    const send = status.mode === "smtp" ? createSmtpSender(mailConfig()) : createConsoleSender();
    globalThis.__kesJoinVerifier = { key, verifier: createVerifier({ store, send, secret: joinSecret() }) };
  }
  return globalThis.__kesJoinVerifier.verifier;
}

/** Rejects cross-site browser requests. Requests without an Origin header (non-browser) pass to the rate limits. */
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") || request.headers.get("host"));
  } catch {
    return false;
  }
}

export function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function readJson(request) {
  if (Number(request.headers.get("content-length") || 0) > 20_000) return null;
  try { return await request.json(); } catch { return null; }
}

export const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

import "server-only";
import { isIP } from "node:net";
import { applicationOrigins } from "./config.mjs";

export class RequestError extends Error { constructor(status = 400) { super("Invalid request"); this.status = status; } }
export function sameOrigin(request, env = process.env) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try { return origin === new URL(origin).origin && applicationOrigins(env).includes(origin); } catch { return false; }
}
export function clientIp(request, env = process.env) {
  // Vercel overwrites X-Forwarded-For. Outside that deployment boundary no
  // caller-supplied proxy header is trusted; all clients share "unknown".
  if (env.TRUST_PROXY !== "vercel" || env.VERCEL !== "1") return "unknown";
  const value = request.headers.get("x-forwarded-for")?.trim();
  return value && isIP(value) ? value : "unknown";
}
export async function readJson(request, maxBytes = 20_000) {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw new RequestError(413);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) throw new RequestError(415);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError();
  let size = 0; const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel().catch(() => {}); throw new RequestError(413); }
      chunks.push(value);
    }
    const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new RequestError();
    return body;
  } catch (error) { if (error instanceof RequestError) throw error; throw new RequestError(); }
  finally { reader.releaseLock(); }
}
export const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff", ...headers } });
export function safeLog(event) {
  // Only static allowlisted event codes. Never log request bodies, email/IP,
  // database URLs, passwords, tokens, SMTP errors or raw exception messages.
  const codes = new Set(["join_request_failed", "join_confirm_failed", "join_submit_failed", "admin_service_failed", "backend_setup_failed", "admin_provision_failed"]);
  if (codes.has(event)) console.error(JSON.stringify({ event }));
}

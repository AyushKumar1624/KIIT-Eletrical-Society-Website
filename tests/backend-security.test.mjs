import test from "node:test";
import assert from "node:assert/strict";
import { createVerifier } from "../lib/join/server/verifier.mjs";
import { createMemoryStore, createUpstashStore } from "../lib/join/server/store.mjs";
import { verificationStatus } from "../lib/join/server/config.mjs";
import { readJson, sameOrigin, clientIp } from "../lib/backend/http.mjs";
import { verificationHandler } from "../lib/join/server/handlers.mjs";

const secret = "test-only-secret-with-more-than-32-characters";
function fixture(sendOverride) {
  let time = Date.now(); const now = () => time; const sent = []; const store = createMemoryStore(now);
  return { sent, store, tick: seconds => { time += seconds * 1000; }, verifier: createVerifier({ store, now, secret, send: sendOverride || (async message => { sent.push(message); }) }) };
}
test("parallel OTP confirmations yield exactly one verified token", async () => {
  const f = fixture(); await f.verifier.requestCode("parallel@kiit.ac.in");
  const results = await Promise.all(Array.from({ length: 50 }, () => f.verifier.confirmCode("parallel@kiit.ac.in", f.sent[0].code)));
  assert.equal(results.filter(r => r.status === "verified").length, 1);
  assert.equal(results.filter(r => r.status === "expired").length, 49);
});
test("parallel wrong guesses share one five-attempt budget", async () => {
  const f = fixture(); await f.verifier.requestCode("attempt@kiit.ac.in");
  const wrong = f.sent[0].code === "000000" ? "111111" : "000000";
  const results = await Promise.all(Array.from({ length: 30 }, () => f.verifier.confirmCode("attempt@kiit.ac.in", wrong)));
  assert.equal(results.filter(r => r.status === "invalid").length, 4);
  assert.equal((await f.verifier.confirmCode("attempt@kiit.ac.in", f.sent[0].code)).status, "locked");
});
test("parallel resend reserves one replacement; concurrent verification cannot consume a different challenge", async () => {
  const f = fixture(); await f.verifier.requestCode("race@kiit.ac.in"); f.tick(61);
  const operations = [f.verifier.confirmCode("race@kiit.ac.in", f.sent[0].code), ...Array.from({ length: 3 }, () => f.verifier.requestCode("race@kiit.ac.in"))];
  const results = await Promise.all(operations);
  assert.equal(results.filter(r => r.status === "sent").length, 1);
  const lastCode = f.sent.at(-1).code;
  assert.equal((await f.verifier.confirmCode("race@kiit.ac.in", lastCode)).status, "verified");
  assert.equal((await f.verifier.confirmCode("race@kiit.ac.in", lastCode)).status, "expired");
});
test("older failed-send cleanup cannot delete a newer challenge", async () => {
  let failFirst; let started; const ready = new Promise(resolve => { started = resolve; }); let calls = 0;
  const f = fixture(async () => { if (++calls === 1) { started(); await new Promise((_, reject) => { failFirst = reject; }); } });
  const first = f.verifier.requestCode("cleanup@kiit.ac.in"); await ready;
  f.tick(61); await f.verifier.requestCode("cleanup@kiit.ac.in");
  const replacement = await f.store.get("join:v2:challenge:cleanup@kiit.ac.in");
  failFirst(new Error("private SMTP failure")); await assert.rejects(first);
  assert.equal((await f.store.get("join:v2:challenge:cleanup@kiit.ac.in")).id, replacement.id);
});
test("production cannot report ready with memory, console delivery, missing secret or partial shared-store config", () => {
  const env = { NODE_ENV: "production", APP_ORIGINS: "https://kes.example", JOIN_SECRET: secret, SMTP_HOST: "smtp.example", JOIN_EMAIL_FROM: "KES <sender@example.test>", MONGODB_URI: "mongodb://localhost:27017", MONGODB_DB: "kes_test" };
  assert.equal(verificationStatus(env).ready, true);
  for (const override of [{ JOIN_STORE: "memory" }, { JOIN_DELIVERY: "console" }, { JOIN_SECRET: "short" }, { UPSTASH_REDIS_REST_URL: "https://store.example" }]) assert.equal(verificationStatus({ ...env, ...override }).ready, false);
  assert.equal(verificationStatus({ ...env, NODE_ENV: "development", JOIN_STORE: "memory", JOIN_DELIVERY: "console" }).ready, true);
});
test("actual streamed bytes are bounded even without or with a lying Content-Length", async () => {
  for (const headers of [{}, { "Content-Length": "1" }]) {
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"x":"')); controller.enqueue(new Uint8Array(20001)); controller.close(); } });
    const request = new Request("https://kes.example/api", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: stream, duplex: "half" });
    await assert.rejects(readJson(request), error => error.status === 413);
  }
  const good = new Request("https://kes.example", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"ok":true}' });
  assert.deepEqual(await readJson(good), { ok: true });
});
test("origins are exact configured origins, forwarded Host/IP cannot create trust", () => {
  const env = { NODE_ENV: "production", APP_ORIGINS: "https://kes.example" };
  const make = origin => new Request("https://kes.example", { headers: { origin, host: "evil.example", "x-forwarded-host": "evil.example", "x-forwarded-for": "1.2.3.4" } });
  assert.equal(sameOrigin(make("https://evil.example"), env), false);
  assert.equal(sameOrigin(make("http://kes.example"), env), false);
  assert.equal(sameOrigin(make("https://kes.example"), env), true);
  assert.equal(clientIp(make("https://kes.example"), env), "unknown");
  assert.equal(clientIp(make("https://kes.example"), { ...env, TRUST_PROXY: "vercel", VERCEL: "1" }), "1.2.3.4");
});
test("shared-store failures return unavailable and never leak raw errors", async () => {
  const handler = verificationHandler("request", { origin: () => true, verifier: async () => ({ requestCode: async () => { throw new Error("secret/credential@private"); } }) });
  const response = await handler(new Request("https://kes.example", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"email":"a@kiit.ac.in"}' }));
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { status: "unavailable" });
});
test("Upstash counter uses a single EVAL including TTL, and Redis errors throw", async () => {
  const commands = [];
  const store = createUpstashStore({ url: "https://redis.example", token: "test-token" }, async (_url, options) => { commands.push(JSON.parse(options.body)); return Response.json({ result: 1 }); });
  assert.equal(await store.incr("test", 60), 1);
  assert.equal(commands.length, 1); assert.equal(commands[0][0], "EVAL"); assert.match(commands[0][1], /EXPIRE/);
  const broken = createUpstashStore({ url: "https://redis.example", token: "test-token" }, async () => Response.json({ error: "private" }));
  await assert.rejects(broken.get("test"));
});

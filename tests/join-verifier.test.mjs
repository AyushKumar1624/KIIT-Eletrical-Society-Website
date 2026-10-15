import test from "node:test";
import assert from "node:assert/strict";
import { createVerifier } from "../lib/join/server/verifier.mjs";
import { createMemoryStore } from "../lib/join/server/store.mjs";
import { codeEmail } from "../lib/join/server/mailer.mjs";

function setup(overrides = {}) {
  let t = Date.parse("2026-10-15T10:00:00Z");
  const now = () => t;
  const sent = [];
  const store = createMemoryStore(now);
  const verifier = createVerifier({
    store, now, secret: "test-secret-that-is-at-least-32-characters",
    send: async m => { sent.push(m); },
    ...overrides,
  });
  return { verifier, sent, store, tick: s => { t += s * 1000; } };
}

test("sends a 6-digit code only to eligible addresses, and never stores it in plain text", async () => {
  const { verifier, sent, store } = setup();
  assert.deepEqual(await verifier.requestCode("someone@gmail.com"), { status: "ineligible" });
  assert.deepEqual(await verifier.requestCode("a@cse.kiit.ac.in"), { status: "ineligible" });
  assert.equal(sent.length, 0);
  const r = await verifier.requestCode("  Student@KIIT.ac.in ");
  assert.equal(r.status, "sent");
  assert.equal(sent[0].to, "student@kiit.ac.in");
  assert.match(sent[0].code, /^\d{6}$/);
  const challenge = await store.get("join:challenge:student@kiit.ac.in");
  assert.ok(!JSON.stringify(challenge).includes(sent[0].code));
});

test("correct code verifies once and yields a token bound to the email", async () => {
  const { verifier, sent } = setup();
  await verifier.requestCode("student@kiit.ac.in");
  const r = await verifier.confirmCode("STUDENT@kiit.ac.in", sent[0].code);
  assert.equal(r.status, "verified");
  assert.deepEqual(verifier.readToken(r.token), { email: "student@kiit.ac.in" });
  assert.equal((await verifier.confirmCode("student@kiit.ac.in", sent[0].code)).status, "expired"); // single use
});

test("wrong codes count down, then lock; a new code resets", async () => {
  const { verifier, sent, tick } = setup();
  await verifier.requestCode("student@kiit.ac.in");
  const wrong = sent[0].code === "000000" ? "111111" : "000000";
  for (let left = 4; left >= 1; left--) {
    assert.deepEqual(await verifier.confirmCode("student@kiit.ac.in", wrong), { status: "invalid", attemptsLeft: left });
  }
  assert.equal((await verifier.confirmCode("student@kiit.ac.in", wrong)).status, "locked");
  assert.equal((await verifier.confirmCode("student@kiit.ac.in", sent[0].code)).status, "locked"); // even the right one
  tick(61);
  await verifier.requestCode("student@kiit.ac.in");
  assert.equal((await verifier.confirmCode("student@kiit.ac.in", sent[1].code)).status, "verified");
});

test("codes expire after 10 minutes; malformed codes don't use attempts", async () => {
  const { verifier, sent, tick } = setup();
  await verifier.requestCode("student@kiit.ac.in");
  assert.deepEqual(await verifier.confirmCode("student@kiit.ac.in", "12"), { status: "invalid" });
  tick(601);
  assert.equal((await verifier.confirmCode("student@kiit.ac.in", sent[0].code)).status, "expired");
});

test("resend cooldown, per-address and per-client hourly limits", async () => {
  const { verifier, tick } = setup();
  await verifier.requestCode("student@kiit.ac.in");
  const again = await verifier.requestCode("student@kiit.ac.in");
  assert.equal(again.status, "rate_limited");
  assert.equal(again.retryAfter, 60);
  for (let i = 0; i < 4; i++) { tick(61); assert.equal((await verifier.requestCode("student@kiit.ac.in")).status, "sent"); }
  tick(61);
  assert.equal((await verifier.requestCode("student@kiit.ac.in")).status, "rate_limited"); // 6th in the hour

  const { verifier: v2 } = setup();
  for (let i = 0; i < 20; i++) assert.equal((await v2.requestCode(`s${i}@kiit.ac.in`, { ip: "1.2.3.4" })).status, "sent");
  assert.equal((await v2.requestCode("s20@kiit.ac.in", { ip: "1.2.3.4" })).status, "rate_limited");
  assert.equal((await v2.requestCode("s20@kiit.ac.in", { ip: "5.6.7.8" })).status, "sent");
});

test("a newer code replaces the old one", async () => {
  const { verifier, sent, tick } = setup();
  await verifier.requestCode("student@kiit.ac.in");
  tick(61);
  await verifier.requestCode("student@kiit.ac.in");
  if (sent[0].code !== sent[1].code) {
    assert.equal((await verifier.confirmCode("student@kiit.ac.in", sent[0].code)).status, "invalid");
  }
  assert.equal((await verifier.confirmCode("student@kiit.ac.in", sent[1].code)).status, "verified");
});

test("tokens: tampering, expiry and other secrets are rejected", async () => {
  const { verifier, sent, tick } = setup();
  await verifier.requestCode("student@kiit.ac.in");
  const { token } = await verifier.confirmCode("student@kiit.ac.in", sent[0].code);
  const [payload, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ purpose: "kes-join", email: "other@kiit.ac.in", exp: Date.now() * 2 })).toString("base64url");
  assert.equal(verifier.readToken(`${forged}.${sig}`), null);
  assert.equal(verifier.readToken(`${payload}.x${sig.slice(1)}`), null);
  assert.equal(verifier.readToken("nonsense"), null);
  const { verifier: other } = setup({ secret: "a-different-secret-of-thirty-two-chars!!" });
  assert.equal(other.readToken(token), null);
  tick(1801);
  assert.equal(verifier.readToken(token), null);
});

test("a failed send leaves no usable code", async () => {
  const { verifier, store } = setup({ send: async () => { throw new Error("SMTP down"); } });
  await assert.rejects(verifier.requestCode("student@kiit.ac.in"));
  assert.equal(await store.get("join:challenge:student@kiit.ac.in"), null);
});

test("the email states the code, expiry and the no-password promise", () => {
  const m = codeEmail({ code: "482913", expiresIn: 600 });
  assert.match(m.subject, /^482913 is your KES verification code$/);
  for (const part of [m.text, m.html]) {
    assert.ok(part.includes("482913"));
    assert.ok(part.includes("10 minutes"));
    assert.ok(part.includes("never ask for your email password"));
  }
});

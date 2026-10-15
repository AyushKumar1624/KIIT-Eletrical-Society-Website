import test from "node:test";
import assert from "node:assert/strict";
import { createAdminBackend, tokenDigest } from "../lib/admin/server/service.mjs";
import { hashPassword, verifyPassword } from "../lib/admin/server/passwords.mjs";
import { createAuthHandler, requireAdminRequest, sessionCookie } from "../lib/admin/server/http.mjs";
import { adminRepositoryFixture } from "./support/admin-repository.mjs";
import { createAdminAuthService, createAdminHttpAdapter } from "../lib/admin/auth.mjs";

const config = { secret: "test-secret-at-least-thirty-two-characters", idleMs: 30 * 60000, absoluteMs: 8 * 3600000, recoveryMs: 20 * 60000, resetOrigin: "https://kes.example", secure: true };
const credentials = { email: "admin@example.test", password: "test-only password input" };
function setup(overrides = {}) {
  let t = Date.now(); const data = adminRepositoryFixture(); const mail = [];
  const service = createAdminBackend({ repository: data.repository, config, now: () => t, hash: async password => `hash:${password}`, verify: async (hash, password) => hash === `hash:${password}`, dummy: async () => "hash:random-dummy", sendRecovery: async message => { mail.push(message); }, ...overrides });
  return { ...data, service, mail, tick: ms => { t += ms; } };
}
test("admin login uses opaque digest-only sessions and generic rejection", async () => {
  const f = setup();
  assert.equal((await f.service.signIn({ ...credentials, password: "wrong" })).status, "rejected");
  assert.equal((await f.service.signIn({ ...credentials, email: "unknown@example.test" })).status, "rejected");
  const result = await f.service.signIn(credentials);
  assert.equal(result.status, "authenticated"); assert.match(result.token, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(f.sessions.has(tokenDigest(result.token))); assert.ok(!JSON.stringify([...f.sessions.values()]).includes(result.token));
  assert.deepEqual((await f.service.getSession(result.token)).session.user, { id: f.admin._id, email: credentials.email, name: "Fictional Admin" });
});
test("idle and absolute expiry, logout, account disabling and version changes revoke access", async () => {
  const f = setup(); const first = await f.service.signIn(credentials);
  f.tick(config.idleMs + 1); assert.equal((await f.service.getSession(first.token)).status, "unauthenticated");
  const second = await f.service.signIn(credentials);
  for (let i = 0; i < 31; i++) { f.tick(config.idleMs / 2); await f.service.getSession(second.token); }
  f.tick(config.idleMs + 1); assert.equal((await f.service.getSession(second.token)).status, "unauthenticated");
  const third = await f.service.signIn(credentials); await f.service.logout(third.token); assert.equal((await f.service.getSession(third.token)).status, "unauthenticated");
  const fourth = await f.service.signIn(credentials); f.admin.authVersion++; assert.equal((await f.service.getSession(fourth.token)).status, "unauthenticated");
  const fifth = await f.service.signIn(credentials); f.admin.active = false; assert.equal((await f.service.getSession(fifth.token)).status, "unauthenticated");
});
test("recovery is generic, trusted URL tokens are single-use and reset revokes old sessions", async () => {
  const f = setup(); const login = await f.service.signIn(credentials);
  assert.deepEqual(await f.service.recoverPassword("unknown@example.test"), { status: "recovery-requested" });
  assert.deepEqual(await f.service.recoverPassword(credentials.email), { status: "recovery-requested" });
  const url = new URL(f.mail[0].url); assert.equal(url.origin, config.resetOrigin); assert.equal(url.search, "");
  const token = new URLSearchParams(url.hash.slice(1)).get("token"); assert.equal(f.admin.recovery.digest, tokenDigest(token));
  const results = await Promise.all([1, 2].map(() => f.service.resetPassword({ token, password: "a new test-only password" })));
  assert.equal(results.filter(r => r.passwordReset).length, 1);
  assert.equal((await f.service.getSession(login.token)).status, "unauthenticated");
  assert.equal((await f.service.signIn(credentials)).status, "rejected");
  assert.equal((await f.service.signIn({ ...credentials, password: "a new test-only password" })).status, "authenticated");
});
test("expired recovery tokens fail, missing SMTP never claims delivery, and failed send clears only its token", async () => {
  const noMail = setup({ sendRecovery: null }); assert.equal((await noMail.service.recoverPassword(credentials.email)).status, "unavailable");
  const failure = setup({ sendRecovery: async () => { throw new Error("private SMTP error"); } });
  assert.equal((await failure.service.recoverPassword(credentials.email)).status, "recovery-requested"); assert.equal(failure.admin.recovery, undefined);
  const f = setup(); await f.service.recoverPassword(credentials.email);
  const token = new URLSearchParams(new URL(f.mail[0].url).hash.slice(1)).get("token"); f.tick(config.recoveryMs + 1);
  assert.equal((await f.service.resetPassword({ token, password: "a new test-only password" })).status, "rejected");
});
test("persistent login throttling is shared across service instances", async () => {
  const f = setup();
  for (let i = 0; i < 10; i++) await f.service.signIn({ ...credentials, password: "wrong" });
  assert.equal((await f.service.signIn(credentials)).status, "rejected");
  const other = createAdminBackend({ repository: f.repository, config, verify: async () => true });
  assert.equal((await other.signIn(credentials)).status, "rejected");
  f.tick(901000); assert.equal((await f.service.signIn(credentials)).status, "authenticated");
});
test("HTTP sign-in sets a secure HttpOnly cookie, never returns the token, and enforces origins", async () => {
  const f = setup(); const handler = createAuthHandler("sign-in", { backend: async () => f.service, config: () => config, origin: request => request.headers.get("origin") === "https://kes.example" });
  const request = origin => new Request("https://kes.example/api/admin/auth/sign-in", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
  assert.equal((await handler(request("https://evil.example"))).status, 403);
  const response = await handler(request("https://kes.example")); assert.equal(response.status, 200);
  const body = await response.json(); assert.equal(body.status, "authenticated"); assert.equal(body.token, undefined);
  assert.match(response.headers.get("set-cookie"), /^__Host-kes-admin=.*HttpOnly; SameSite=Strict; Max-Age=28800; Secure$/);
  assert.match(sessionCookie("", config, true), /Max-Age=0; Secure/);
});
test("administrator API guard denies unauthenticated access and fails closed on database errors", async () => {
  const request = new Request("https://kes.example/api/admin/applications");
  const missing = await requireAdminRequest(request, async () => ({ getSession: async () => ({ status: "unauthenticated" }) })); assert.equal(missing.response.status, 401);
  const broken = await requireAdminRequest(request, async () => { throw new Error("mongodb://private-credential"); }); assert.equal(broken.response.status, 503);
  const handler = createAuthHandler("session", { backend: async () => { throw new Error("private"); }, config: () => config });
  assert.deepEqual(await (await handler(request)).json(), { status: "unavailable" });
});
test("client HTTP adapter uses same-origin credentials and never uses browser storage", async () => {
  const calls = []; const service = createAdminAuthService(createAdminHttpAdapter(async (url, options) => { calls.push({ url, options }); return Response.json({ status: "unauthenticated" }); }));
  assert.equal((await service.getSession()).status, "unauthenticated"); await service.logout();
  assert.equal(calls[0].url, "/api/admin/auth/session"); assert.equal(calls[0].options.credentials, "same-origin"); assert.equal(calls[0].options.cache, "no-store"); assert.equal(calls[1].options.method, "POST");
});
test("real password hashing is Argon2id and validates without exposing plaintext", async () => {
  const hash = await hashPassword("test-only strong password"); assert.match(hash, /^\$argon2id\$v=19\$/);
  assert.deepEqual(hash.split("$")[3].split(",").sort(), ["m=65536", "p=1", "t=3"]);
  assert.equal(await verifyPassword(hash, "test-only strong password"), true); assert.equal(await verifyPassword(hash, "different test input"), false);
});

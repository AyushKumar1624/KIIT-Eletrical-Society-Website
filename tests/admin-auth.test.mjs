import test from "node:test";
import assert from "node:assert/strict";
import { adminAuth, createAdminAuthService, validateCredentials } from "../lib/admin/auth.mjs";

test("unconnected admin service never authenticates, ends a session or claims recovery delivery", async () => {
  assert.deepEqual(await adminAuth.getSession(), { status: "unavailable" });
  assert.deepEqual(await adminAuth.signIn({ email: "admin@example.test", password: "test input only" }), { status: "unavailable" });
  assert.deepEqual(await adminAuth.logout(), { status: "unavailable" });
  assert.deepEqual(await adminAuth.recoverPassword("admin@example.test"), { status: "unavailable" });
});
test("invalid fields are rejected before invoking an adapter", async () => {
  let calls = 0;
  const service = createAdminAuthService({ signIn: async () => { calls++; } });
  const result = await service.signIn({ email: "invalid", password: "" });
  assert.equal(result.status, "invalid");
  assert.deepEqual(Object.keys(result.errors), ["email", "password"]);
  assert.equal(calls, 0);
  assert.deepEqual(validateCredentials({ email: "admin@example.test" }, true), {});
});
test("adapter credentials are passed without changing password whitespace; sessions must have identity", async () => {
  const session = { user: { id: "test-admin", email: "admin@example.test" } };
  let received;
  const service = createAdminAuthService({ signIn: async payload => { received = payload; return { status: "authenticated", session }; }, getSession: async () => ({ status: "authenticated", session }) });
  assert.equal((await service.signIn({ email: " admin@example.test ", password: " test input " })).status, "authenticated");
  assert.deepEqual(received, { email: "admin@example.test", password: " test input " });
  assert.deepEqual(await service.getSession(), { status: "authenticated", session });
  const malformed = createAdminAuthService({ getSession: async () => ({ status: "authenticated" }) });
  assert.equal((await malformed.getSession()).status, "unavailable");
});
test("expired sessions, rejected sign-in and confirmed logout stay distinct", async () => {
  const service = createAdminAuthService({ getSession: async () => ({ status: "unauthenticated" }), signIn: async () => ({ status: "rejected" }), logout: async () => ({ status: "unauthenticated" }) });
  assert.equal((await service.getSession()).status, "unauthenticated");
  assert.equal((await service.signIn({ email: "admin@example.test", password: "test input" })).status, "rejected");
  assert.equal((await service.logout()).status, "unauthenticated");
});
test("transport failures and unexpected responses fail closed without leaking raw errors", async () => {
  const service = createAdminAuthService({ getSession: async () => { throw new Error("private transport detail"); }, logout: async () => ({ status: "authenticated" }), recoverPassword: async () => ({ status: "sent" }) });
  assert.deepEqual(await service.getSession(), { status: "unavailable" });
  assert.deepEqual(await service.logout(), { status: "unavailable" });
  assert.deepEqual(await service.recoverPassword("admin@example.test"), { status: "unavailable" });
});

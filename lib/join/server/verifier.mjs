// One-time-code verification of a KIIT institutional email address.
//
// Codes are 6 random digits, stored only as an HMAC, valid for 10 minutes,
// with 5 guesses each. A new code replaces the old one. Success returns a
// signed, short-lived token bound to the verified address; an application
// service must accept a submission only with a valid token for that email.

import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { checkInstitutionalEmail } from "../eligibility.mjs";
import { JOIN_LIMITS } from "./config.mjs";

const HOUR = 3_600_000;

export function createVerifier({ store, send, secret, limits = JOIN_LIMITS, now = () => Date.now() }) {
  if (!secret) throw new Error("A signing secret is required.");
  const mac = (...parts) => createHmac("sha256", secret).update(parts.join("\n")).digest();
  const challengeKey = email => `join:challenge:${email}`;
  const nextHour = t => Math.ceil((HOUR - (t % HOUR)) / 1000);

  async function requestCode(rawEmail, { ip = "unknown" } = {}) {
    const check = checkInstitutionalEmail(rawEmail);
    if (!check.ok) return { status: "ineligible" };
    const { email } = check;
    const t = now();

    const current = await store.get(challengeKey(email));
    const wait = current ? Math.ceil((current.sentAt + limits.resendAfter * 1000 - t) / 1000) : 0;
    if (wait > 0) return { status: "rate_limited", retryAfter: wait };

    const hour = Math.floor(t / HOUR);
    if (await store.incr(`join:rl:ip:${ip}:${hour}`, 3600) > limits.perIpPerHour) return { status: "rate_limited", retryAfter: nextHour(t) };
    if (await store.incr(`join:rl:email:${email}:${hour}`, 3600) > limits.perEmailPerHour) return { status: "rate_limited", retryAfter: nextHour(t) };

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const id = randomUUID();
    await store.set(challengeKey(email), {
      id,
      hash: mac("code", id, email, code).toString("base64url"),
      sentAt: t,
      expiresAt: t + limits.codeTtl * 1000,
    }, limits.codeTtl);

    try {
      await send({ to: email, code, expiresIn: limits.codeTtl });
    } catch (error) {
      await store.del(challengeKey(email)); // nothing was delivered: don't leave a usable code
      throw error;
    }
    return { status: "sent", resendAfter: limits.resendAfter, expiresIn: limits.codeTtl };
  }

  async function confirmCode(rawEmail, rawCode) {
    const check = checkInstitutionalEmail(rawEmail);
    if (!check.ok) return { status: "ineligible" };
    const { email } = check;
    const code = String(rawCode ?? "").trim();
    if (!/^\d{6}$/.test(code)) return { status: "invalid" };

    const challenge = await store.get(challengeKey(email));
    if (!challenge || challenge.expiresAt <= now()) return { status: "expired" };

    // Count the attempt before comparing, atomically, so parallel guesses share one budget.
    const attempt = await store.incr(`join:attempts:${challenge.id}`, limits.codeTtl);
    if (attempt > limits.maxAttempts) return { status: "locked" };

    const expected = Buffer.from(challenge.hash, "base64url");
    const given = mac("code", challenge.id, email, code);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
      const attemptsLeft = limits.maxAttempts - attempt;
      return attemptsLeft > 0 ? { status: "invalid", attemptsLeft } : { status: "locked" };
    }

    await store.del(challengeKey(email)); // single use
    return { status: "verified", token: issueToken(email) };
  }

  function issueToken(email) {
    const payload = Buffer.from(JSON.stringify({ purpose: "kes-join", email, exp: now() + limits.tokenTtl * 1000 })).toString("base64url");
    return `${payload}.${mac("token", payload).toString("base64url")}`;
  }

  /** The verified email for a valid, unexpired token; otherwise null. */
  function readToken(token) {
    const [payload, signature] = String(token ?? "").split(".");
    if (!payload || !signature) return null;
    const expected = mac("token", payload);
    const given = Buffer.from(signature, "base64url");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    try {
      const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (data.purpose !== "kes-join" || !(data.exp > now())) return null;
      const check = checkInstitutionalEmail(data.email); // the allowlist applies here too
      return check.ok ? { email: check.email } : null;
    } catch {
      return null;
    }
  }

  return { requestCode, confirmCode, readToken };
}

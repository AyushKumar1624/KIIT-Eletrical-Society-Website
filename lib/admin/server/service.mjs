import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { hashPassword, verifyPassword, passwordErrors, dummyHash } from "./passwords.mjs";

export const tokenDigest = token => createHash("sha256").update(token).digest("hex");
const validEmail = email => typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const validToken = token => typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
const publicSession = admin => ({ user: { id: String(admin._id), email: admin.email, name: admin.name || "Administrator" } });

export function createAdminBackend({ repository, config, sendRecovery, hash = hashPassword, verify = verifyPassword, dummy = dummyHash, now = () => Date.now(), random = () => randomBytes(32).toString("base64url") }) {
  const key = (purpose, value) => createHmac("sha256", config.secret).update(`${purpose}\n${value}`).digest("hex");
  async function throttle(purpose, email, ip, maximum = 10, ipMaximum = 50) {
    const t = now(); const seconds = 900;
    const addressCount = await repository.limit(key(`${purpose}:email`, email), seconds, t);
    const clientCount = await repository.limit(key(`${purpose}:ip`, ip), seconds, t);
    return addressCount <= maximum && clientCount <= ipMaximum;
  }
  return {
    async signIn({ email, password }, { ip = "unknown" } = {}) {
      if (!validEmail(email) || typeof password !== "string" || !password || password.length > 128) return { status: "invalid" };
      email = email.trim().toLowerCase();
      if (!await throttle("login", email, ip)) return { status: "rejected", retryAfter: 900 };
      const admin = await repository.findByEmail(email);
      const matches = await verify(admin?.passwordHash || await dummy(), password);
      if (!admin || !matches) return { status: "rejected" };
      const token = random(); const t = now();
      await repository.createSession({ _id: tokenDigest(token), adminId: admin._id, authVersion: admin.authVersion, createdAt: new Date(t), expiresAt: new Date(t + config.idleMs), absoluteExpiresAt: new Date(t + config.absoluteMs) });
      // A reset/disable racing password verification cannot grant a usable
      // old-version session. Every later API guard rechecks the account too.
      const current = await repository.findById(admin._id);
      if (!current || current.authVersion !== admin.authVersion) { await repository.deleteSession(tokenDigest(token)); return { status: "rejected" }; }
      return { status: "authenticated", session: publicSession(current), token };
    },
    async getSession(token) {
      if (!validToken(token)) return { status: "unauthenticated" };
      const digest = tokenDigest(token);
      const session = await repository.touchSession(digest, now(), config.idleMs);
      if (!session) return { status: "unauthenticated" };
      const admin = await repository.findById(session.adminId);
      if (!admin || admin.authVersion !== session.authVersion) { await repository.deleteSession(digest); return { status: "unauthenticated" }; }
      return { status: "authenticated", session: publicSession(admin) };
    },
    async logout(token) { if (validToken(token)) await repository.deleteSession(tokenDigest(token)); return { status: "unauthenticated" }; },
    async recoverPassword(email, { ip = "unknown" } = {}) {
      if (!validEmail(email)) return { status: "invalid" };
      if (!sendRecovery) return { status: "unavailable" };
      email = email.trim().toLowerCase();
      if (!await throttle("recovery", email, ip, 3, 15)) return { status: "recovery-requested" };
      const admin = await repository.findByEmail(email);
      if (!admin) return { status: "recovery-requested" };
      const token = random(); const digest = tokenDigest(token);
      if (!await repository.setRecovery(admin._id, admin.authVersion, { digest, expiresAt: new Date(now() + config.recoveryMs) })) return { status: "recovery-requested" };
      const url = new URL("/admin/reset-password", config.resetOrigin);
      // A fragment is never sent in HTTP access logs or the Referer header.
      url.hash = `token=${token}`;
      try { await sendRecovery({ to: admin.email, url: url.href, expiresIn: config.recoveryMs / 1000 }); }
      catch { await repository.clearRecovery(admin._id, digest); return { status: "recovery-requested" }; }
      return { status: "recovery-requested" };
    },
    async resetPassword({ token, password }, { ip = "unknown" } = {}) {
      const errors = passwordErrors(password);
      if (!validToken(token) || Object.keys(errors).length) return { status: "invalid", errors };
      if (!await throttle("reset", "all", ip, 100, 15)) return { status: "rejected", retryAfter: 900 };
      const admin = await repository.resetPassword(tokenDigest(token), await hash(password), now());
      if (!admin) return { status: "rejected" };
      // authVersion revokes all previous sessions atomically with the reset;
      // cleanup is best-effort and cannot roll back that security guarantee.
      await repository.deleteAdminSessions(admin._id, admin.authVersion).catch(() => {});
      return { status: "unauthenticated", passwordReset: true };
    },
  };
}

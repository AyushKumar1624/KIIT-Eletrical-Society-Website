// Deterministic test double only; production always uses MongoDB.
export function adminRepositoryFixture() {
  const admin = { _id: "test-admin", email: "admin@example.test", name: "Fictional Admin", role: "admin", active: true, authVersion: 1, passwordHash: "hash:test-only password input" };
  const sessions = new Map(); const limits = new Map();
  const eligible = () => admin.active && admin.role === "admin";
  const repository = {
    async limit(key, ttl, t) { let entry = limits.get(key); if (!entry || entry.expires <= t) { entry = { count: 0, expires: t + ttl * 1000 }; limits.set(key, entry); } return ++entry.count; },
    async findByEmail(email) { return eligible() && email === admin.email ? structuredClone(admin) : null; },
    async findById(id) { return eligible() && id === admin._id ? structuredClone(admin) : null; },
    async createSession(record) { sessions.set(record._id, structuredClone(record)); },
    async touchSession(digest, t, idle) { const session = sessions.get(digest); if (!session || +session.expiresAt <= t || +session.absoluteExpiresAt <= t) return null; session.expiresAt = new Date(Math.min(+session.absoluteExpiresAt, t + idle)); return structuredClone(session); },
    async deleteSession(digest) { sessions.delete(digest); },
    async setRecovery(id, version, recovery) { if (!eligible() || id !== admin._id || version !== admin.authVersion) return false; admin.recovery = structuredClone(recovery); return true; },
    async clearRecovery(id, digest) { if (id === admin._id && admin.recovery?.digest === digest) delete admin.recovery; },
    async resetPassword(digest, passwordHash, t) { if (!eligible() || admin.recovery?.digest !== digest || +admin.recovery.expiresAt <= t) return null; admin.passwordHash = passwordHash; admin.authVersion++; delete admin.recovery; return structuredClone(admin); },
    async deleteAdminSessions(id, version) { for (const [key, session] of sessions) if (session.adminId === id && session.authVersion < version) sessions.delete(key); },
  };
  return { repository, admin, sessions, limits };
}

import "server-only";
import { createMongoCounter } from "../../backend/counters.mjs";

export function createAdminRepository({ admins, sessions, limits }) {
  return {
    limit: createMongoCounter(limits),
    findByEmail: email => admins.findOne({ email, role: "admin", active: true }),
    findById: id => admins.findOne({ _id: id, role: "admin", active: true }),
    createSession: session => sessions.insertOne(session),
    async touchSession(digest, now, idleMs) {
      return sessions.findOneAndUpdate({ _id: digest, expiresAt: { $gt: new Date(now) }, absoluteExpiresAt: { $gt: new Date(now) } }, [{ $set: { expiresAt: { $min: ["$absoluteExpiresAt", new Date(now + idleMs)] } } }], { returnDocument: "after", includeResultMetadata: false });
    },
    deleteSession: digest => sessions.deleteOne({ _id: digest }),
    async setRecovery(id, version, recovery) { return (await admins.updateOne({ _id: id, active: true, role: "admin", authVersion: version }, { $set: { recovery } })).modifiedCount === 1; },
    clearRecovery: (id, digest) => admins.updateOne({ _id: id, "recovery.digest": digest }, { $unset: { recovery: "" } }),
    async resetPassword(digest, passwordHash, now) {
      return admins.findOneAndUpdate({ "recovery.digest": digest, "recovery.expiresAt": { $gt: new Date(now) }, active: true, role: "admin" }, { $set: { passwordHash, passwordChangedAt: new Date(now) }, $inc: { authVersion: 1 }, $unset: { recovery: "" } }, { returnDocument: "after", includeResultMetadata: false });
    },
    deleteAdminSessions: (adminId, version) => sessions.deleteMany({ adminId, authVersion: { $lt: version } }),
  };
}

import "server-only";
import { randomUUID } from "node:crypto";
import { COLLECTIONS } from "../../backend/mongo.mjs";

/**
 * Records an immutable audit log entry for administrative actions.
 * Never records secrets, passwords, OTPs, or recovery tokens.
 */
export async function recordAuditLog(db, { actorId, actorEmail, action, entity, entityId, oldValue = null, newValue = null, timestamp = new Date() }) {
  try {
    const entry = {
      _id: randomUUID(),
      actorId: String(actorId || "system"),
      actorEmail: actorEmail ? String(actorEmail) : null,
      action: String(action),
      entity: String(entity),
      entityId: String(entityId),
      oldValue: oldValue != null ? JSON.parse(JSON.stringify(oldValue)) : null,
      newValue: newValue != null ? JSON.parse(JSON.stringify(newValue)) : null,
      timestamp,
    };
    await db.collection(COLLECTIONS.audit).insertOne(entry);
    return entry;
  } catch {
    return null;
  }
}

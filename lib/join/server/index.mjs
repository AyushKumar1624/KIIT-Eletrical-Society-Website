import "server-only";
import { createHash } from "node:crypto";
import { joinSecret, mailConfig, storeConfig, verificationStatus } from "./config.mjs";
import { createMemoryStore, createUpstashStore, createMongoStore } from "./store.mjs";
import { createConsoleSender, createSmtpSender } from "./mailer.mjs";
import { createVerifier } from "./verifier.mjs";
import { collections, getDatabase } from "../../backend/mongo.mjs";
import { databaseConfig } from "../../backend/config.mjs";
import { createApplicationService, createMongoApplicationRepository } from "./applications.mjs";
export { verificationStatus };
export { sameOrigin, clientIp, readJson, json } from "../../backend/http.mjs";

export async function getVerifier() {
  const status = verificationStatus();
  if (!status.ready) return null;
  const config = storeConfig();
  const key = createHash("sha256").update(JSON.stringify([status, config, mailConfig(), joinSecret(), process.env.MONGODB_URI, process.env.MONGODB_DB])).digest("hex");
  if (globalThis.__kesJoinVerifier?.key !== key) {
    const store = config.kind === "upstash" ? createUpstashStore(config) : config.kind === "mongodb" ? createMongoStore(await collections()) : createMemoryStore();
    const send = status.mode === "smtp" ? createSmtpSender(mailConfig()) : createConsoleSender();
    globalThis.__kesJoinVerifier = { key, verifier: createVerifier({ store, send, secret: joinSecret() }) };
  }
  return globalThis.__kesJoinVerifier.verifier;
}

/** Application persistence, or null when MongoDB isn't configured. */
export async function getApplicationService() {
  if (!databaseConfig()) return null;
  globalThis.__kesJoinApplications ??= getDatabase().then(({ client, db }) => {
    const cols = Object.fromEntries(Object.entries({ cycles: "recruitment_cycles", applications: "join_applications", jobs: "notification_jobs" }).map(([k, n]) => [k, db.collection(n)]));
    return createApplicationService({ repository: createMongoApplicationRepository({ client, ...cols }) });
  }).catch(error => { globalThis.__kesJoinApplications = undefined; throw error; });
  return globalThis.__kesJoinApplications;
}

/**
 * Whether /join may accept applications right now: verification configured,
 * database reachable and the current recruitment cycle open. SMTP working is
 * not enough on its own. Any failure reads as "not open".
 */
export async function applicationReadiness() {
  try {
    if (!verificationStatus().ready) return false;
    const service = await getApplicationService();
    return Boolean(service && await service.readiness());
  } catch {
    return false;
  }
}

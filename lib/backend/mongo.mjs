import "server-only";
import { MongoClient } from "mongodb";
import { databaseConfig, ConfigurationError } from "./config.mjs";

export const COLLECTIONS = Object.freeze({ admins: "admin_accounts", sessions: "admin_sessions", limits: "rate_limits", challenges: "join_challenges", cycles: "recruitment_cycles", applications: "join_applications", jobs: "notification_jobs" });
export async function getDatabase() {
  const config = databaseConfig();
  if (!config) throw new ConfigurationError();
  const cache = globalThis.__kesMongo ??= new Map();
  const key = `${config.uri}\n${config.database}`;
  if (!cache.has(key)) {
    const client = new MongoClient(config.uri, { maxPoolSize: 10, minPoolSize: 0, serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, socketTimeoutMS: 10000, retryWrites: true, writeConcern: { w: "majority" } });
    cache.set(key, client.connect().then(() => ({ client, db: client.db(config.database) })).catch(async () => { cache.delete(key); await client.close().catch(() => {}); throw new Error("Database unavailable"); }));
  }
  return cache.get(key);
}
export async function collections() {
  const { db } = await getDatabase();
  return Object.fromEntries(Object.entries(COLLECTIONS).map(([key, name]) => [key, db.collection(name)]));
}
export async function closeDatabase() {
  const cache = globalThis.__kesMongo;
  if (!cache) return;
  await Promise.allSettled([...cache.values()].map(async connection => (await connection).client.close()));
  cache.clear();
}

import "server-only";

export class ConfigurationError extends Error { constructor() { super("Backend configuration unavailable"); this.name = "ConfigurationError"; } }
export function databaseConfig(env = process.env) {
  if (!/^mongodb(?:\+srv)?:\/\//.test(env.MONGODB_URI || "") || !/^[a-zA-Z0-9_-]{1,64}$/.test(env.MONGODB_DB || "")) return null;
  return { uri: env.MONGODB_URI, database: env.MONGODB_DB };
}
export function applicationOrigins(env = process.env) {
  const values = (env.APP_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!values.length) return [];
  try {
    return values.map(value => {
      const url = new URL(value);
      if (!(["http:", "https:"].includes(url.protocol)) || (env.NODE_ENV === "production" && url.protocol !== "https:") || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new ConfigurationError();
      return url.origin;
    });
  } catch { return []; }
}
export function adminConfig(env = process.env) {
  const origins = applicationOrigins(env);
  const resetOrigin = env.ADMIN_RESET_ORIGIN;
  if (!databaseConfig(env) || (env.ADMIN_SECRET || "").length < 32 || !origins.length || !origins.includes(resetOrigin)) return null;
  return { secret: env.ADMIN_SECRET, resetOrigin, secure: env.NODE_ENV === "production", idleMs: 30 * 60_000, absoluteMs: 8 * 3600_000, recoveryMs: 20 * 60_000 };
}

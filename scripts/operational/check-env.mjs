/**
 * Safe Environment Configuration Validator
 * Validates presence, formatting, and invariants of environment variables.
 * NEVER prints secret values (passwords, tokens, keys, URIs with credentials).
 */

import { databaseConfig, applicationOrigins } from "../../lib/backend/config.mjs";
import { mailConfig, joinSecret, storeConfig } from "../../lib/join/server/config.mjs";

const isProduction = process.argv.includes("--production") || process.env.NODE_ENV === "production";

console.info(`\n==================================================================`);
console.info(`  KIIT ELECTRICAL SOCIETY — ENVIRONMENT VALIDATION`);
console.info(`  Mode: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
console.info(`==================================================================\n`);

let hasErrors = false;
let hasWarnings = false;

function check(name, testFn, { required = true, advice = "" } = {}) {
  try {
    const result = testFn();
    if (result.ok) {
      console.info(`  [✓ PASS] ${name}: ${result.note || "configured and valid"}`);
    } else {
      if (required) {
        hasErrors = true;
        console.error(`  [✗ FAIL] ${name}: ${result.error}${advice ? ` (${advice})` : ""}`);
      } else {
        hasWarnings = true;
        console.warn(`  [! WARN] ${name}: ${result.error}${advice ? ` (${advice})` : ""}`);
      }
    }
  } catch (err) {
    if (required) {
      hasErrors = true;
      console.error(`  [✗ FAIL] ${name}: Exception during check - ${err.message}`);
    } else {
      hasWarnings = true;
      console.warn(`  [! WARN] ${name}: ${err.message}`);
    }
  }
}

// 1. Database Configuration
check("MONGODB_URI", () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) return { ok: false, error: "Missing MONGODB_URI" };
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) return { ok: false, error: "Must start with mongodb:// or mongodb+srv://" };
  return { ok: true, note: uri.startsWith("mongodb+srv://") ? "valid SRV connection string" : "valid standard connection string" };
}, { advice: "Set your MongoDB Atlas SRV URI in environment" });

check("MONGODB_DB", () => {
  const db = process.env.MONGODB_DB;
  if (!db) return { ok: false, error: "Missing MONGODB_DB" };
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(db)) return { ok: false, error: "Must be 1-64 alphanumeric characters, underscores or hyphens" };
  return { ok: true, note: "valid database name" };
});

// 2. Security Secrets
check("ADMIN_SECRET", () => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return { ok: false, error: "Missing ADMIN_SECRET" };
  if (secret.length < 32) return { ok: false, error: `Secret is too short (${secret.length} chars; min 32 required)` };
  return { ok: true, note: `configured (length ${secret.length})` };
}, { advice: "Generate a 32+ character random string" });

check("JOIN_SECRET", () => {
  const secret = joinSecret();
  if (!secret) return { ok: false, error: "Missing or too short (<32 chars)" };
  return { ok: true, note: "configured (valid length)" };
}, { advice: "Generate a 32+ character random string" });

// 3. Application Origins
check("APP_ORIGINS", () => {
  const origins = applicationOrigins();
  if (!origins.length) return { ok: false, error: "No valid origins found in APP_ORIGINS" };
  if (isProduction) {
    const nonHttps = origins.filter(o => !o.startsWith("https://"));
    if (nonHttps.length > 0) return { ok: false, error: "All origins must use https:// in production" };
  }
  return { ok: true, note: `${origins.length} origin(s) configured` };
}, { advice: "Comma-separated HTTPS origins without trailing slashes" });

check("ADMIN_RESET_ORIGIN", () => {
  const origin = process.env.ADMIN_RESET_ORIGIN;
  const origins = applicationOrigins();
  if (!origin) return { ok: false, error: "Missing ADMIN_RESET_ORIGIN" };
  if (!origins.includes(origin)) return { ok: false, error: "ADMIN_RESET_ORIGIN must match one of the origins in APP_ORIGINS" };
  return { ok: true, note: "valid and present in APP_ORIGINS" };
});

// 4. Join Recruitment Flow Settings
check("JOIN_STORE", () => {
  const store = storeConfig();
  if (!store) return { ok: false, error: "Invalid store configuration for current environment" };
  if (isProduction && store.kind === "memory") return { ok: false, error: "In-memory store is forbidden in production" };
  return { ok: true, note: `using ${store.kind} store` };
});

check("JOIN_DELIVERY", () => {
  const delivery = process.env.JOIN_DELIVERY || "smtp";
  if (isProduction && delivery === "console") {
    return { ok: false, error: "Console delivery is forbidden in production" };
  }
  if (!["smtp", "console"].includes(delivery)) {
    return { ok: false, error: `Invalid delivery mode: ${delivery}` };
  }
  return { ok: true, note: `configured for ${delivery}` };
});

// 5. SMTP / Brevo Mail Configuration
check("SMTP Configuration", () => {
  const mail = mailConfig();
  const delivery = process.env.JOIN_DELIVERY || "smtp";
  if (!mail) {
    if (delivery === "console" && !isProduction) {
      return { ok: true, note: "skipped (using dev console delivery)" };
    }
    return { ok: false, error: "Missing or invalid SMTP configuration (host, port, user/pass, or from)" };
  }
  return { ok: true, note: `host=${mail.host}, port=${mail.port}, secure=${mail.secure}` };
}, { required: isProduction });

check("JOIN_EMAIL_FROM", () => {
  const from = process.env.JOIN_EMAIL_FROM;
  if (!from) return { ok: false, error: "Missing JOIN_EMAIL_FROM" };
  if (!/^[^\r\n]+<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(from) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) {
    return { ok: false, error: "Format must be 'Name <email@domain>' or 'email@domain'" };
  }
  return { ok: true, note: "valid sender format" };
}, { required: isProduction });

// 6. Production Host / Vercel Invariants
if (isProduction) {
  check("TRUST_PROXY", () => {
    const proxy = process.env.TRUST_PROXY;
    if (proxy !== "vercel") return { ok: false, error: "TRUST_PROXY should be set to 'vercel' on Vercel deployments" };
    return { ok: true, note: "configured for vercel" };
  }, { required: false });
}

console.info(`\n------------------------------------------------------------------`);
if (hasErrors) {
  console.error(`  RESULT: FAILED — Required environment configuration is missing or invalid.`);
  console.error(`  Please update your environment variables or .env.local file.`);
  console.info(`==================================================================\n`);
  process.exit(1);
} else if (hasWarnings) {
  console.warn(`  RESULT: PASSED WITH WARNINGS — Review optional suggestions above.`);
  console.info(`==================================================================\n`);
  process.exit(0);
} else {
  console.info(`  RESULT: PASSED — All environment variables are properly formatted and valid.`);
  console.info(`==================================================================\n`);
  process.exit(0);
}

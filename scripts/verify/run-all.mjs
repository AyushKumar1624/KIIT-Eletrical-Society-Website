// Consolidated runner for all operational smoke checks against live local server & MongoDB
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const checks = [
  { name: "Admin Server-Side Authorization", file: "admin-auth.mjs" },
  { name: "Domain Reviewer RBAC Isolation", file: "domain-reviewer.mjs" },
  { name: "CMS Draft / Published Isolation", file: "cms-draft-isolation.mjs" },
  { name: "CSV Export Formula Injection Defense", file: "csv-export.mjs" },
  { name: "Atomic OTP Verification Concurrency", file: "otp-concurrency.mjs" },
  { name: "Concurrent Duplicate Application Prevention", file: "duplicate-concurrency.mjs" },
  { name: "Notification Job Durability & Retry Backoff", file: "job-durability.mjs" },
  { name: "Join KES Flow End-to-End", file: "join-flow.mjs" },
  { name: "Public API Sensitive Field Leakage", file: "public-api-leakage.mjs" },
  { name: "Production Security Controls (CSRF, Cache, Limits)", file: "security-controls.mjs" },
];

console.log("==================================================================");
console.log("  KIIT ELECTRICAL SOCIETY — OPERATIONAL VERIFICATION SUITE");
console.log("==================================================================\n");

function runCheck(check) {
  return new Promise((resolve) => {
    const fullPath = join(__dirname, check.file);
    const proc = spawn(process.execPath, [
      "--conditions=react-server",
      "--env-file-if-exists=.env.local",
      fullPath,
    ], { stdio: "inherit" });

    proc.on("exit", (code) => {
      resolve({ name: check.name, file: check.file, success: code === 0 });
    });
  });
}

const results = [];
for (const check of checks) {
  console.log(`\n>>> [RUNNING] ${check.name} (${check.file})`);
  const res = await runCheck(check);
  results.push(res);
}

console.log("\n==================================================================");
console.log("  VERIFICATION SUITE SUMMARY");
console.log("==================================================================");

let allPassed = true;
for (const r of results) {
  const status = r.success ? "✓ PASS" : "✗ FAIL";
  console.log(`  [${status}] ${r.name}`);
  if (!r.success) allPassed = false;
}

console.log("==================================================================");
if (allPassed) {
  console.log("  ALL 10 OPERATIONAL SMOKE CHECKS PASSED SUCCESSFULLY!");
  console.log("==================================================================\n");
} else {
  console.error("  SOME VERIFICATION CHECKS FAILED. Inspect logs above.");
  console.log("==================================================================\n");
  process.exitCode = 1;
}

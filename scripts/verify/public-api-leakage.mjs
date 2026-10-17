process.env.NODE_ENV ??= "development";

console.log("=== AUDITING PUBLIC APIS FOR DATA LEAKS ===");

const SENSITIVE_KEYWORDS = [
  "passwordHash",
  "ADMIN_SECRET",
  "JOIN_SECRET",
  "sessionSecret",
  "mongoUri",
  "smtp_pass",
  "internalNote",
  "internal_note",
  "audit_log",
  "auditLog",
  "rollNormalized",
  "chat.whatsapp.com/private",
];

const publicUrls = [
  "http://localhost:3000/api/content/project",
  "http://localhost:3000/api/content/event",
  "http://localhost:3000/api/content/leadership",
  "http://localhost:3000/api/content/faculty",
  "http://localhost:3000/api/content/domain",
  "http://localhost:3000/api/content/milestone",
  "http://localhost:3000/api/content/achievement",
  "http://localhost:3000/api/content/gallery",
  "http://localhost:3000/robots.txt",
  "http://localhost:3000/sitemap.xml",
];

let leaksFound = 0;

for (const url of publicUrls) {
  const res = await fetch(url);
  const text = await res.text();

  for (const keyword of SENSITIVE_KEYWORDS) {
    if (text.includes(keyword)) {
      console.error(`>>> LEAK DETECTED: [${keyword}] found in ${url}`);
      leaksFound++;
    }
  }

  // If JSON, verify applicant data structure is not present
  try {
    const data = JSON.parse(text);
    if (data.applications || data.history || data.audit || data.otp) {
      console.error(`>>> LEAK DETECTED: Private data objects found in ${url}`);
      leaksFound++;
    }
  } catch {
    // Non-JSON (txt/xml) is normal for robots/sitemap
  }
}

console.log(`Audited ${publicUrls.length} public endpoints.`);
if (leaksFound === 0) {
  console.log(">>> PASS: ZERO SENSITIVE DATA LEAKED VIA PUBLIC APIS.");
} else {
  console.error(`>>> FAIL: Found ${leaksFound} potential data leaks.`);
  process.exitCode = 1;
}
process.exit(process.exitCode || 0);

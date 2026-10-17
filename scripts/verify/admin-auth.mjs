process.env.NODE_ENV ??= "development";

console.log("=== VERIFYING SERVER-SIDE ADMIN AUTHORIZATION ON EVERY ADMIN API ===");

const endpoints = [
  { method: "GET", url: "http://localhost:3000/api/admin/applications" },
  { method: "PUT", url: "http://localhost:3000/api/admin/applications", body: { id: "test", review: {} } },
  { method: "PATCH", url: "http://localhost:3000/api/admin/applications", body: { id: "test", status: "Selected" } },
  { method: "POST", url: "http://localhost:3000/api/admin/applications/sample-id/message", body: { kind: "interview" } },
  { method: "GET", url: "http://localhost:3000/api/admin/applications/export" },
  { method: "POST", url: "http://localhost:3000/api/admin/jobs/process", body: { limit: 10 } },
  { method: "GET", url: "http://localhost:3000/api/admin/cms/project" },
  { method: "POST", url: "http://localhost:3000/api/admin/cms/project", body: { slug: "test", title: "Test" } },
  { method: "DELETE", url: "http://localhost:3000/api/admin/cms/project?slug=test" },
  { method: "GET", url: "http://localhost:3000/api/admin/auth/session" },
];

let allRejected = true;

// 1. Test unauthenticated (no cookies)
console.log("\n--- Testing Unauthenticated Requests (No Cookie) ---");
for (const ep of endpoints) {
  const res = await fetch(ep.url, {
    method: ep.method,
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
    },
    body: ep.body ? JSON.stringify(ep.body) : undefined,
  });

  let passed;
  if (ep.url.includes("/api/admin/auth/session")) {
    const data = await res.json();
    passed = res.status === 200 && data.status === "unauthenticated";
  } else {
    passed = res.status === 401;
  }
  console.log(`[${ep.method}] ${ep.url.replace("http://localhost:3000", "")} -> Status: ${res.status} (${passed ? "PASS" : "FAIL"})`);
  if (!passed) allRejected = false;
}

// 2. Test forged cookie
console.log("\n--- Testing Forged Session Cookie ---");
for (const ep of endpoints.slice(0, 5)) {
  const res = await fetch(ep.url, {
    method: ep.method,
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
      "Cookie": "kes_admin=forged_token_payload_unsigned_12345",
    },
    body: ep.body ? JSON.stringify(ep.body) : undefined,
  });

  const passed = res.status === 401;
  console.log(`[${ep.method}] ${ep.url.replace("http://localhost:3000", "")} -> Status: ${res.status} (${passed ? "PASS" : "FAIL"})`);
  if (!passed) allRejected = false;
}

// 3. Test genuine login session
console.log("\n--- Testing Genuine Administrator Authentication ---");
const loginRes = await fetch("http://localhost:3000/api/admin/auth/sign-in", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Origin": "http://localhost:3000" },
  body: JSON.stringify({ email: "admin@kes.kiit.ac.in", password: "AdminPassword#2026" }),
});

const authCookie = loginRes.headers.get("set-cookie");
console.log("Login Result Status:", loginRes.status, "Set-Cookie received:", Boolean(authCookie));

if (authCookie) {
  const cookieHeader = authCookie.split(";")[0];
  const authedRes = await fetch("http://localhost:3000/api/admin/applications", {
    method: "GET",
    headers: { "Origin": "http://localhost:3000", "Cookie": cookieHeader },
  });
  console.log("Authenticated GET /api/admin/applications Status:", authedRes.status);
  const data = await authedRes.json();
  console.log("Summary of applications returned:", data.summary);
}

if (allRejected) {
  console.log("\n>>> PASS: ALL ADMIN ENDPOINTS STRICTLY REQUIRE AUTHENTICATION SERVER-SIDE.");
} else {
  console.error("\n>>> FAIL: Some admin endpoints allowed unauthorized access!");
  process.exitCode = 1;
}
process.exit(process.exitCode || 0);

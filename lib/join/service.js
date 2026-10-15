// Client-side integration points for Join KES. The page passes the server's
// status ({ verification, applications }); verification runs through the
// route handlers in app/api/join (or NEXT_PUBLIC_JOIN_API_URL, if set).
// Without a configured service the page says so — it never pretends a code
// was sent, an email verified or an application received.
// Contract: docs/join-kes-integration.md.
//
// Every method resolves to an object with a `status`:
//   requestCode(email)            → sent {resendAfter, expiresIn, devNote?} | ineligible | rate_limited {retryAfter} | unavailable | error
//   verifyCode(email, code)       → verified {token} | invalid {attemptsLeft?} | expired | locked | unavailable | error
//   submitApplication(token, app) → submitted {reference?} | invalid {errors} | unauthorized | duplicate | unavailable | error

const API = (process.env.NEXT_PUBLIC_JOIN_API_URL || "/api/join").replace(/\/$/, "");

async function post(path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (data && typeof data.status === "string") return data;
    return { status: res.status === 503 ? "unavailable" : "error" };
  } catch {
    return { status: "error" };
  }
}

const httpService = status => ({
  available: true,
  applicationsAvailable: Boolean(status.applications),
  requestCode: email => post("/verification/request", { email }),
  verifyCode: (email, code) => post("/verification/confirm", { email, code }),
  submitApplication: (token, application) => post("/applications", { token, application }),
});

const unavailableService = {
  available: false,
  applicationsAvailable: false,
  requestCode: async () => ({ status: "unavailable" }),
  verifyCode: async () => ({ status: "unavailable" }),
  submitApplication: async () => ({ status: "unavailable" }),
};

/**
 * The service for this page. `preview` is honoured only by the development
 * server; production builds drop the preview module entirely.
 */
export async function getJoinService({ preview = false, status = {} } = {}) {
  if (process.env.NODE_ENV === "development" && preview) {
    return (await import("./preview-service.js")).previewService;
  }
  return status.verification ? httpService(status) : unavailableService;
}

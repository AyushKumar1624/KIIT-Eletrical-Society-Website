// Client-facing contract. Only HTTP DTOs cross this boundary; database,
// password and cookie handling stay in the server-only modules.
export const UNAVAILABLE_MESSAGE = "Administrator authentication is currently unavailable. Please try again later.";

export function validateCredentials({ email = "", password = "" } = {}, recovery = false) {
  const errors = {};
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!recovery && (typeof password !== "string" || !password || password.length > 128)) errors.password = "Enter your password (up to 128 characters).";
  return errors;
}

const allowed = {
  signIn: ["authenticated", "rejected", "unavailable"],
  getSession: ["authenticated", "unauthenticated", "unavailable"],
  logout: ["unauthenticated", "unavailable"],
  recoverPassword: ["recovery-requested", "rejected", "unavailable"],
  resetPassword: ["unauthenticated", "rejected", "unavailable", "invalid"],
};

export function createAdminAuthService(adapter = null) {
  async function invoke(method, payload) {
    if (typeof adapter?.[method] !== "function") return { status: "unavailable" };
    try {
      const result = await adapter[method](payload);
      if (!allowed[method].includes(result?.status)) return { status: "unavailable" };
      if (result.status === "authenticated" && (!result.session?.user?.id || !result.session?.user?.email)) return { status: "unavailable" };
      return result;
    } catch {
      // Never render raw backend errors, credentials, or transport details.
      return { status: "unavailable" };
    }
  }
  return Object.freeze({
    async signIn(credentials) {
      const errors = validateCredentials(credentials);
      if (Object.keys(errors).length) return { status: "invalid", errors };
      return invoke("signIn", { email: credentials.email.trim(), password: credentials.password });
    },
    getSession: () => invoke("getSession"),
    resetPassword: (token, password) => invoke("resetPassword", { token, password }),
    logout: () => invoke("logout"),
    async recoverPassword(email) {
      const errors = validateCredentials({ email }, true);
      if (Object.keys(errors).length) return { status: "invalid", errors };
      return invoke("recoverPassword", { email: email.trim() });
    },
  });
}

export function createAdminHttpAdapter(fetcher = fetch) {
  async function call(path, body) {
    const response = await fetcher(`/api/admin/auth/${path}`, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store", headers: body === undefined ? {} : { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return response.json();
  }
  return { signIn: body => call("sign-in", body), getSession: () => call("session"), logout: () => call("logout", {}), recoverPassword: body => call("recovery", body), resetPassword: body => call("reset", body) };
}
export const adminAuth = createAdminAuthService(createAdminHttpAdapter());

// Frontend contract only. Connect a server-backed adapter here when ready.
// Session UI is not authorization: every future admin endpoint must enforce
// administrator permissions on the server. No credentials or sessions persist here.
export const UNAVAILABLE_MESSAGE = "Administrator authentication is not connected yet. Sign-in is currently unavailable. Please try again once the service is enabled.";

export function validateCredentials({ email = "", password = "" } = {}, recovery = false) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!recovery && !password) errors.password = "Enter your password.";
  return errors;
}

const allowed = {
  signIn: ["authenticated", "rejected", "unavailable"],
  getSession: ["authenticated", "unauthenticated", "unavailable"],
  logout: ["unauthenticated", "unavailable"],
  recoverPassword: ["recovery-requested", "rejected", "unavailable"],
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
    logout: () => invoke("logout"),
    async recoverPassword(email) {
      const errors = validateCredentials({ email }, true);
      if (Object.keys(errors).length) return { status: "invalid", errors };
      return invoke("recoverPassword", { email: email.trim() });
    },
  });
}

// Deliberately no adapter, fetch endpoint, mock password, or storage fallback.
export const adminAuth = createAdminAuthService();

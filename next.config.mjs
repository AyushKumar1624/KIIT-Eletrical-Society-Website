import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// The member portal (app/portal/**/*.demo.js) is kept for future development
// but is not publicly reachable. Every /portal address serves *.prod.js
// ("not available", noindex) unless a developer sets NEXT_PUBLIC_PORTAL_DEMO=true.
export default function config() {
  const portalDemo = process.env.NEXT_PUBLIC_PORTAL_DEMO === "true";
  return {
    turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
    pageExtensions: portalDemo ? ["demo.js", "js", "jsx"] : ["prod.js", "js", "jsx"],
  };
}

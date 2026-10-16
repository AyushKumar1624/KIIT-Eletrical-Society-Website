// Local preview only. Production hosts serve the generated out/ directory directly.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { port: { type: "string", short: "p", default: "3000" } } });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Use a port between 1 and 65535.");
const root = fileURLToPath(new URL("../out/", import.meta.url));
await stat(resolve(root, "index.html"));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const path = resolve(root, `.${pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep) && path !== resolve(root)) {
      response.writeHead(400).end(); return;
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }).end(); return;
    }
    let file;
    for (const candidate of [path, `${path}.html`, resolve(path, "index.html")]) {
      try { if ((await stat(candidate)).isFile()) { file = candidate; break; } }
      catch (error) { if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error; }
    }
    const status = file ? 200 : 404;
    file ||= resolve(root, "404.html");
    const body = await readFile(file);
    response.writeHead(status, { "Content-Type": types[extname(file)] || "application/octet-stream", "Content-Length": body.length, "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    response.writeHead(error instanceof URIError || error instanceof TypeError ? 400 : 500).end();
  }
});
server.listen(port, "0.0.0.0", () => console.log(`Static preview: http://localhost:${port}`));

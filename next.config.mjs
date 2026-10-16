import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;

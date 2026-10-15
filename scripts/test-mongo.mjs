import { spawn } from "node:child_process";
const child = spawn(process.execPath, ["--conditions=react-server", "--test", "tests/mongo-backend.test.mjs"], { stdio: "inherit", env: { ...process.env, KES_MONGO_TESTS: "1" } });
child.on("exit", code => { process.exitCode = code ?? 1; });

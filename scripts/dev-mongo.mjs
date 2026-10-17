import { MongoMemoryServer } from "mongodb-memory-server";

console.info("[dev-mongo] Starting in-memory MongoDB development server on port 27017...");

const mongod = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: "kes_dev",
    ip: "127.0.0.1",
  },
});

console.info("[dev-mongo] MongoDB is ready!");
console.info(`[dev-mongo] URI: ${mongod.getUri()}`);
console.info("[dev-mongo] Database: kes_dev");
console.info("[dev-mongo] Ready to accept connections. Keep this process running while developing.");

// Keep process running
process.stdin.resume();

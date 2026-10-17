// Recruitment-cycle management (operator use, private terminal).
//
//   npm run recruitment:cycle -- status
//   npm run recruitment:cycle -- open  --id 2026-27 [--name "Recruitment 2026–27"] [--opens 2026-10-20T09:00:00+05:30] [--closes 2026-11-05T23:59:00+05:30]
//   npm run recruitment:cycle -- close [--id 2026-27]

import { getDatabase, closeDatabase, COLLECTIONS } from "../../lib/backend/mongo.mjs";
import { isCycleOpen } from "../../lib/join/server/applications.mjs";

const [action = "status", ...rest] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rest.length; i += 2) if (rest[i]?.startsWith("--")) args[rest[i].slice(2)] = rest[i + 1];
const date = (value, label) => {
  if (value === undefined) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid --${label} date`);
  return d;
};

try {
  const { db } = await getDatabase();
  const cycles = db.collection(COLLECTIONS.cycles);
  if (action === "open") {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(args.id || "")) throw new Error("Pass --id (letters, digits, - or _), e.g. --id 2026-27");
    const opensAt = date(args.opens, "opens"), closesAt = date(args.closes, "closes");
    if (opensAt && closesAt && closesAt <= opensAt) throw new Error("--closes must be after --opens");
    await cycles.updateMany({ current: true, _id: { $ne: args.id } }, { $set: { current: false, open: false, updatedAt: new Date() } });
    await cycles.updateOne({ _id: args.id }, { $set: { name: args.name || `Recruitment ${args.id}`, open: true, current: true, opensAt, closesAt, updatedAt: new Date() } }, { upsert: true });
  } else if (action === "close") {
    const filter = args.id ? { _id: args.id } : { current: true };
    const r = await cycles.updateOne(filter, { $set: { open: false, updatedAt: new Date() } });
    if (!r.matchedCount) throw new Error("No matching cycle");
  } else if (action !== "status") {
    throw new Error("Use: status | open --id <id> [--opens <date>] [--closes <date>] | close [--id <id>]");
  }
  const current = await cycles.findOne({ current: true });
  console.info(current
    ? `Current cycle ${current._id} (${current.name}): ${current.open ? "open" : "closed"}${current.opensAt ? `, opens ${current.opensAt.toISOString()}` : ""}${current.closesAt ? `, closes ${current.closesAt.toISOString()}` : ""}. Accepting applications now: ${isCycleOpen(current) ? "yes" : "no"}.`
    : "No current recruitment cycle: /join does not accept applications.");
} catch (error) {
  console.error(error?.message?.startsWith("Pass") || error?.message?.startsWith("Use") || error?.message?.startsWith("Invalid") || error?.message?.startsWith("No matching") || error?.message?.startsWith("--") ? error.message : "Recruitment cycle update failed.");
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

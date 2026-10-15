import "server-only";
import { createMongoCounter } from "../../backend/counters.mjs";
function verdict(value, id, hash, maxAttempts, now) {
  if (!value || value.id !== id || value.consumed || value.expiresAt <= now) return { status: "expired" };
  if (value.attempts >= maxAttempts) return { status: "locked" };
  if (value.hash === hash) return { status: "verified" };
  const attemptsLeft = maxAttempts - value.attempts - 1;
  return attemptsLeft ? { status: "invalid", attemptsLeft } : { status: "locked" };
}
// Each memory mutation completes synchronously; production cannot select it.
export function createMemoryStore(now = () => Date.now()) {
  const map = new Map();
  const live = key => { const e = map.get(key); if (!e || e.exp <= now()) { map.delete(key); return null; } return e; };
  return {
    async get(key) { return structuredClone(live(key)?.value ?? null); },
    async incr(key, ttl) { const e = live(key); if (e) return ++e.value; map.set(key, { value: 1, exp: now() + ttl * 1000 }); return 1; },
    async reserve(key, value, ttl, cooldown) {
      const current = live(key)?.value; const wait = current ? Math.ceil((current.sentAt + cooldown * 1000 - now()) / 1000) : 0;
      if (wait > 0) return { ok: false, retryAfter: wait };
      map.set(key, { value: { ...value, attempts: 0, consumed: false }, exp: now() + ttl * 1000 }); return { ok: true };
    },
    async confirm(key, id, hash, maxAttempts, t) {
      const value = live(key)?.value; const result = verdict(value, id, hash, maxAttempts, t);
      if (value && value.id === id && !value.consumed && value.expiresAt > t && value.attempts < maxAttempts) { value.attempts++; if (result.status === "verified") value.consumed = true; }
      return result;
    },
    async deleteIfId(key, id) { if (live(key)?.value.id === id) map.delete(key); },
  };
}
export function createMongoStore({ challenges, limits }, now = () => Date.now()) {
  const incr = createMongoCounter(limits);
  return {
    async get(key) { return (await challenges.findOne({ _id: key, expiresAt: { $gt: new Date(now()) } }))?.value || null; },
    incr: (key, ttl) => incr(key, ttl, now()),
    async reserve(key, value, ttl, cooldown) {
      const t = now();
      try {
        await challenges.findOneAndUpdate({ _id: key, $or: [{ "value.sentAt": { $lte: t - cooldown * 1000 } }, { "value.sentAt": { $exists: false } }] }, { $set: { value: { ...value, attempts: 0, consumed: false }, expiresAt: new Date(t + ttl * 1000) } }, { upsert: true, includeResultMetadata: false });
        return { ok: true };
      } catch (error) {
        if (error.code !== 11000) throw error;
        const current = await challenges.findOne({ _id: key });
        return { ok: false, retryAfter: Math.max(1, Math.ceil(((current?.value.sentAt || t) + cooldown * 1000 - t) / 1000)) };
      }
    },
    async confirm(key, id, hash, maxAttempts, t) {
      const previous = await challenges.findOneAndUpdate({ _id: key, "value.id": id, "value.consumed": false, "value.expiresAt": { $gt: t }, "value.attempts": { $lt: maxAttempts } }, [{ $set: { "value.attempts": { $add: ["$value.attempts", 1] }, "value.consumed": { $eq: ["$value.hash", { $literal: hash }] } } }], { returnDocument: "before", includeResultMetadata: false });
      if (previous) return verdict(previous.value, id, hash, maxAttempts, t);
      // A failed compare-and-swap must never infer a fresh success from a read.
      const current = (await challenges.findOne({ _id: key }))?.value;
      return current?.id === id && !current.consumed && current.expiresAt > t && current.attempts >= maxAttempts ? { status: "locked" } : { status: "expired" };
    },
    async deleteIfId(key, id) { await challenges.deleteOne({ _id: key, "value.id": id }); },
  };
}
export function createUpstashStore({ url, token }, fetcher = fetch) {
  async function command(...args) {
    const res = await fetcher(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(args), cache: "no-store", signal: AbortSignal.timeout(5000) });
    const body = await res.json(); if (!res.ok || body.error || !("result" in body)) throw new Error("Shared verification store unavailable"); return body.result;
  }
  const evalOne = (script, key, ...args) => command("EVAL", script, "1", key, ...args.map(String));
  return {
    async get(key) { const value = await command("GET", key); return value == null ? null : JSON.parse(value); },
    async incr(key, ttl) { return Number(await evalOne("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n", key, ttl)); },
    async reserve(key, value, ttl, cooldown) {
      const result = await evalOne("local s=redis.call('GET',KEYS[1]); if s then local c=cjson.decode(s); local wait=c.sentAt+tonumber(ARGV[3])*1000-tonumber(ARGV[4]); if wait>0 then return math.ceil(wait/1000); end; end; redis.call('SET',KEYS[1],ARGV[1],'EX',ARGV[2]); return 0", key, JSON.stringify({ ...value, attempts: 0, consumed: false }), ttl, cooldown, value.sentAt);
      return Number(result) ? { ok: false, retryAfter: Number(result) } : { ok: true };
    },
    async confirm(key, id, hash, maxAttempts, now) {
      const result = await evalOne("local s=redis.call('GET',KEYS[1]); if not s then return cjson.encode({status='expired'}); end; local c=cjson.decode(s); if c.id~=ARGV[1] or c.consumed or c.expiresAt<=tonumber(ARGV[4]) then return cjson.encode({status='expired'}); end; if c.attempts>=tonumber(ARGV[3]) then return cjson.encode({status='locked'}); end; c.attempts=c.attempts+1; local r; if c.hash==ARGV[2] then c.consumed=true; r={status='verified'}; elseif c.attempts>=tonumber(ARGV[3]) then r={status='locked'}; else r={status='invalid',attemptsLeft=tonumber(ARGV[3])-c.attempts}; end; redis.call('SET',KEYS[1],cjson.encode(c),'KEEPTTL'); return cjson.encode(r)", key, id, hash, maxAttempts, now);
      return JSON.parse(result);
    },
    async deleteIfId(key, id) { await evalOne("local s=redis.call('GET',KEYS[1]); if s and cjson.decode(s).id==ARGV[1] then return redis.call('DEL',KEYS[1]); end; return 0", key, id); },
  };
}

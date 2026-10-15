// Short-lived storage for verification challenges and rate-limit counters.
// Interface: get(key) → value|null, set(key, value, ttlSeconds), del(key),
// incr(key, ttlSeconds) → number (atomic; the TTL starts with the first increment).
//
// Memory works for a single long-running server (`next start`, development).
// Serverless or multi-instance hosting MUST use a shared store: set
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.

export function createMemoryStore(now = () => Date.now()) {
  const map = new Map();
  const live = key => {
    const entry = map.get(key);
    if (!entry) return null;
    if (entry.exp <= now()) { map.delete(key); return null; }
    return entry;
  };
  return {
    async get(key) { return live(key)?.value ?? null; },
    async set(key, value, ttl) { map.set(key, { value, exp: now() + ttl * 1000 }); },
    async del(key) { map.delete(key); },
    async incr(key, ttl) {
      const entry = live(key);
      if (entry) return ++entry.value;
      map.set(key, { value: 1, exp: now() + ttl * 1000 });
      return 1;
    },
  };
}

// Upstash Redis REST API: POST the command as a JSON array.
export function createUpstashStore({ url, token }) {
  const command = async (...args) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Verification store responded ${res.status}`);
    return (await res.json()).result;
  };
  return {
    async get(key) { const v = await command("GET", key); return v == null ? null : JSON.parse(v); },
    async set(key, value, ttl) { await command("SET", key, JSON.stringify(value), "EX", String(ttl)); },
    async del(key) { await command("DEL", key); },
    async incr(key, ttl) {
      const n = await command("INCR", key);
      if (n === 1) await command("EXPIRE", key, String(ttl));
      return n;
    },
  };
}

import "server-only";
export function createMongoCounter(collection) {
  return async (key, ttlSeconds, now = Date.now()) => {
    const update = [{ $set: {
      count: { $add: [{ $cond: [{ $gt: ["$expiresAt", new Date(now)] }, { $ifNull: ["$count", 0] }, 0] }, 1] },
      expiresAt: { $cond: [{ $gt: ["$expiresAt", new Date(now)] }, "$expiresAt", new Date(now + ttlSeconds * 1000)] },
    } }];
    try { return (await collection.findOneAndUpdate({ _id: key }, update, { upsert: true, returnDocument: "after", includeResultMetadata: false })).count; }
    catch (error) { if (error.code !== 11000) throw error; return (await collection.findOneAndUpdate({ _id: key }, update, { returnDocument: "after", includeResultMetadata: false })).count; }
  };
}

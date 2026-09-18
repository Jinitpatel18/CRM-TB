import { redis } from '../config/redis.js';

/**
 * Returns true if allowed, false if limit hit.
 * @param {string} key
 * @param {number} max
 * @param {number} windowSec
 */
export async function allow(key, max, windowSec = 1) {
  const now = Date.now();
  const zkey = `rl:${key}`;
  const pipeline = redis.multi();
  pipeline.zremrangebyscore(zkey, 0, now - windowSec * 1000);
  pipeline.zadd(zkey, now, `${now}-${Math.random()}`);
  pipeline.zcard(zkey);
  pipeline.expire(zkey, windowSec);
  const results = await pipeline.exec();
  const count = results[2][1];
  return count <= max;
}
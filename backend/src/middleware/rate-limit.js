const { ApiError } = require("../utils/api-error");

function clientIp(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function createRateLimiter(options) {
  const windowMs = options.windowMs;
  const max = options.max;
  const buckets = new Map();
  const keyPrefix = options.keyPrefix || "rate";
  const cleanupIntervalMs = options.cleanupIntervalMs || windowMs;
  let lastCleanupAt = 0;

  function cleanupExpiredBuckets(now) {
    if (now - lastCleanupAt < cleanupIntervalMs) {
      return;
    }

    lastCleanupAt = now;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }

  return function rateLimiter(req, res, next) {
    const now = Date.now();

    cleanupExpiredBuckets(now);

    const identity = options.keyGenerator ? options.keyGenerator(req) : clientIp(req);
    const key = keyPrefix + ":" + identity;
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.set("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      next(new ApiError(429, options.message || "Too many requests. Please try again later."));
      return;
    }

    next();
  };
}

module.exports = {
  clientIp,
  createRateLimiter
};

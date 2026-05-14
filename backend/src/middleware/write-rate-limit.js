const { getConfig } = require("../config/env");
const { createRateLimiter, clientIp } = require("./rate-limit");

const config = getConfig();

const writeLimiter = createRateLimiter({
  keyPrefix: "write",
  windowMs: 60 * 1000,
  max: config.writeRateLimitMax,
  message: "Too many write requests. Please slow down and try again.",
  keyGenerator: (req) => req.user ? "user:" + req.user.id : "ip:" + clientIp(req)
});

module.exports = {
  writeLimiter
};

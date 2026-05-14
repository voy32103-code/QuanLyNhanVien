const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter } = require("../../src/middleware/rate-limit");

function responseMock() {
  const headers = {};
  return {
    headers,
    set(name, value) {
      headers[name] = value;
    }
  };
}

function runLimiter(limiter, req) {
  return new Promise((resolve) => {
    limiter(req, responseMock(), (error) => {
      resolve(error || null);
    });
  });
}

test("rate limiter allows requests up to max and then returns 429", async () => {
  const limiter = createRateLimiter({
    keyPrefix: "unit",
    windowMs: 60 * 1000,
    max: 2,
    keyGenerator: () => "same-user"
  });
  const req = { ip: "127.0.0.1", socket: {} };

  assert.equal(await runLimiter(limiter, req), null);
  assert.equal(await runLimiter(limiter, req), null);

  const error = await runLimiter(limiter, req);
  assert.equal(error.statusCode, 429);
});

test("rate limiter isolates identities", async () => {
  const limiter = createRateLimiter({
    keyPrefix: "unit-identities",
    windowMs: 60 * 1000,
    max: 1,
    keyGenerator: (req) => req.user
  });

  assert.equal(await runLimiter(limiter, { user: "a", socket: {} }), null);
  assert.equal(await runLimiter(limiter, { user: "b", socket: {} }), null);

  const error = await runLimiter(limiter, { user: "a", socket: {} });
  assert.equal(error.statusCode, 429);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createSessionToken,
  hashPassword,
  hashToken,
  verifyPassword
} = require("../../src/utils/passwords");

test("hashPassword creates verifiable non-plain password hashes", async () => {
  const password = "CorrectHorseBatteryStaple123!";
  const result = await hashPassword(password);

  assert.equal(typeof result.hash, "string");
  assert.equal(typeof result.salt, "string");
  assert.notEqual(result.hash, password);
  assert.equal(await verifyPassword(password, result.salt, result.hash), true);
  assert.equal(await verifyPassword("wrong-password", result.salt, result.hash), false);
});

test("session tokens are random and hashed deterministically", () => {
  const first = createSessionToken();
  const second = createSessionToken();

  assert.equal(first.length, 64);
  assert.equal(second.length, 64);
  assert.notEqual(first, second);
  assert.equal(hashToken(first), hashToken(first));
  assert.notEqual(hashToken(first), first);
});

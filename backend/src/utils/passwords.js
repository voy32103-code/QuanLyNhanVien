const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, KEY_LENGTH);

  return {
    hash: hash.toString("hex"),
    salt
  };
}

async function verifyPassword(password, salt, expectedHash) {
  const hash = await scrypt(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHash, "hex");

  if (expected.length !== hash.length) {
    return false;
  }

  return crypto.timingSafeEqual(hash, expected);
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  createSessionToken,
  hashPassword,
  hashToken,
  verifyPassword
};

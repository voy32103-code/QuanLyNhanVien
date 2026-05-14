const dotenv = require("dotenv");

dotenv.config();

function getRequired(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Add it to .env before running the backend.`);
  }

  return value;
}

function getConfig() {
  const databaseUrl = getRequired("DATABASE_URL");

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3000),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    databaseUrl,
    dbSsl: databaseUrl.includes("sslmode=require"),
    sessionHours: Number(process.env.SESSION_HOURS || 8),
    adminEmail: process.env.ADMIN_EMAIL || "",
    adminPassword: process.env.ADMIN_PASSWORD || "",
    adminName: process.env.ADMIN_NAME || "System Admin",
    loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 8),
    writeRateLimitMax: Number(process.env.WRITE_RATE_LIMIT_MAX || 120)
  };
}

module.exports = {
  getConfig
};

const express = require("express");
const authRepository = require("../repositories/auth-repository");
const { getConfig } = require("../config/env");
const { requireAuth, SESSION_COOKIE_NAME } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");
const { createRateLimiter, clientIp } = require("../middleware/rate-limit");
const { ApiError } = require("../utils/api-error");

const config = getConfig();
const router = express.Router();

function sessionCookieOptions(expiresAt) {
  const maxAge = Math.max(0, new Date(expiresAt).getTime() - Date.now());

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/",
    maxAge
  };
}

const loginLimiter = createRateLimiter({
  keyPrefix: "login",
  windowMs: 15 * 60 * 1000,
  max: config.loginRateLimitMax,
  message: "Too many login attempts. Please try again later.",
  keyGenerator: (req) => clientIp(req) + ":" + String(req.body.email || "").toLowerCase()
});

router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new ApiError(422, "Email and password are required.", [
      { field: "email", message: "Email is required." },
      { field: "password", message: "Password is required." }
    ]);
  }

  const session = await authRepository.login(email, password);

  if (!session) {
    throw new ApiError(401, "Email or password is incorrect.");
  }

  res.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions(session.expiresAt));
  res.json({ data: session });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: { user: req.user } });
}));

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  await authRepository.revokeSession(req.authToken);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/"
  });
  res.json({ data: { ok: true } });
}));

module.exports = router;

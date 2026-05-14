const authRepository = require("../repositories/auth-repository");
const { ApiError } = require("../utils/api-error");

const SESSION_COOKIE_NAME = "quanlynv_session";

function bearerToken(req) {
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  return match ? match[1] : "";
}

function cookieToken(req) {
  const header = req.get("cookie") || "";
  const cookies = header.split(";").reduce((items, item) => {
    const index = item.indexOf("=");

    if (index > -1) {
      const name = item.slice(0, index).trim();
      const value = item.slice(index + 1).trim();
      try {
        items[name] = decodeURIComponent(value);
      } catch (error) {
        items[name] = value;
      }
    }

    return items;
  }, {});

  return cookies[SESSION_COOKIE_NAME] || "";
}

function requestToken(req) {
  return bearerToken(req) || cookieToken(req);
}

async function requireAuth(req, res, next) {
  try {
    const token = requestToken(req);
    const user = await authRepository.getUserByToken(token);

    if (!user) {
      throw new ApiError(401, "Authentication token is required.");
    }

    req.authToken = token;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireRoles(roles) {
  return function roleMiddleware(req, res, next) {
    const userRoles = req.user ? req.user.roles : [];
    const allowed = userRoles.some((role) => roles.includes(role));

    if (!allowed) {
      next(new ApiError(403, "You do not have permission to perform this action."));
      return;
    }

    next();
  };
}

module.exports = {
  bearerToken,
  cookieToken,
  requireAuth,
  requireRoles,
  requestToken,
  SESSION_COOKIE_NAME
};

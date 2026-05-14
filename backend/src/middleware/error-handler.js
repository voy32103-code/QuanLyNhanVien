const { ApiError } = require("../utils/api-error");

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message;
  let details = error.details || [];

  if (error.code === "23505") {
    statusCode = 409;
    message = "Duplicate value violates a unique constraint.";
    details = [{ message: error.detail || "Duplicate value." }];
  }

  if (error.code === "23503" || error.code === "23514") {
    statusCode = 400;
    message = "Request violates database constraints.";
    details = [{ message: error.detail || error.message }];
  }

  const payload = {
    error: {
      message: statusCode === 500 ? "Internal server error" : message,
      statusCode
    }
  };

  if (details.length) {
    payload.error.details = details;
  }

  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    payload.error.debug = error.message;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  errorHandler,
  notFound
};

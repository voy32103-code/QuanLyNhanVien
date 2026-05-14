const path = require("path");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { getConfig } = require("./config/env");
const { pool } = require("./db/pool");
const { errorHandler, notFound } = require("./middleware/error-handler");
const authRoutes = require("./routes/auth-routes");
const auditRoutes = require("./routes/audit-routes");
const healthRoutes = require("./routes/health-routes");
const departmentRoutes = require("./routes/department-routes");
const employeeRoutes = require("./routes/employee-routes");
const serviceRoutes = require("./routes/service-routes");
const reportRoutes = require("./routes/report-routes");

const config = getConfig();
const app = express();
const projectRoot = path.resolve(__dirname, "..", "..");

function cspConnectSrc() {
  const values = ["'self'"];

  if (config.corsOrigin && config.corsOrigin !== "*") {
    values.push(config.corsOrigin);
  }

  return values;
}

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: cspConnectSrc(),
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(cors({
  origin: config.corsOrigin === "*" ? true : config.corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

app.use("/api/auth", authRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reports", reportRoutes);

app.use("/assets", express.static(path.join(projectRoot, "assets")));
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = app;

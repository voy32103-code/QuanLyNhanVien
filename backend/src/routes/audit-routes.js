const express = require("express");
const auditRepository = require("../repositories/audit-repository");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");

const router = express.Router();

router.get("/", requireAuth, requireRoles(["admin", "hr_manager"]), asyncHandler(async (req, res) => {
  const logs = await auditRepository.listAuditLogs(req.query);
  res.json({ data: logs });
}));

module.exports = router;

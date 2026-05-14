const express = require("express");
const reportRepository = require("../repositories/report-repository");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");
const { canViewCompensation } = require("../utils/access");

const router = express.Router();

router.get("/summary", requireAuth, asyncHandler(async (req, res) => {
  const summary = await reportRepository.getSummary({
    includeCompensation: canViewCompensation(req.user)
  });
  res.json({ data: summary });
}));

router.get("/departments", requireAuth, asyncHandler(async (req, res) => {
  const report = await reportRepository.getDepartmentReport({
    includeCompensation: canViewCompensation(req.user)
  });
  res.json({ data: report });
}));

router.get("/services", requireAuth, asyncHandler(async (req, res) => {
  const report = await reportRepository.getServiceReport();
  res.json({ data: report });
}));

module.exports = router;

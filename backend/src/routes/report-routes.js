const express = require("express");
const reportService = require("../services/report-service");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");

const router = express.Router();

router.get("/summary", requireAuth, asyncHandler(async (req, res) => {
  const summary = await reportService.getSummary(req.user);
  res.json({ data: summary });
}));

router.get("/departments", requireAuth, asyncHandler(async (req, res) => {
  const report = await reportService.getDepartmentReport(req.user);
  res.json({ data: report });
}));

router.get("/services", requireAuth, asyncHandler(async (req, res) => {
  const report = await reportService.getServiceReport();
  res.json({ data: report });
}));

module.exports = router;

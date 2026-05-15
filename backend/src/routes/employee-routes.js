const express = require("express");
const employeeService = require("../services/employee-service");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");
const { writeLimiter } = require("../middleware/write-rate-limit");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const employees = await employeeService.listEmployees(req.user, req.query);
  res.json({ data: employees });
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployee(req.user, req.params.id);
  res.json({ data: employee });
}));

const manageEmployees = [requireAuth, requireRoles(["admin", "hr_manager"]), writeLimiter];

router.post("/", manageEmployees, asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.user, req.body);
  res.status(201).json({ data: employee });
}));

router.put("/:id", manageEmployees, asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.user, req.params.id, req.body);
  res.json({ data: employee });
}));

router.patch("/:id/restore", manageEmployees, asyncHandler(async (req, res) => {
  const employee = await employeeService.restoreEmployee(req.user, req.params.id);
  res.json({ data: employee });
}));

router.delete("/:id", manageEmployees, asyncHandler(async (req, res) => {
  const result = await employeeService.deleteEmployee(req.user, req.params.id);
  res.json({ data: result });
}));

module.exports = router;

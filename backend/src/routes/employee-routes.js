const express = require("express");
const employeeRepository = require("../repositories/employee-repository");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");
const { writeLimiter } = require("../middleware/write-rate-limit");
const { ApiError } = require("../utils/api-error");
const { canViewCompensation } = require("../utils/access");
const { validateEmployeePayload } = require("../utils/validators");

const router = express.Router();

function validate(payload) {
  const errors = validateEmployeePayload(payload);

  if (errors.length) {
    throw new ApiError(422, "Employee payload is invalid.", errors);
  }
}

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const employees = await employeeRepository.listEmployees(req.query, {
    includeCompensation: canViewCompensation(req.user)
  });
  res.json({ data: employees });
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const employee = await employeeRepository.getEmployeeById(req.params.id, {
    includeCompensation: canViewCompensation(req.user)
  });
  res.json({ data: employee });
}));

const manageEmployees = [requireAuth, requireRoles(["admin", "hr_manager"]), writeLimiter];

router.post("/", manageEmployees, asyncHandler(async (req, res) => {
  validate(req.body);
  const employee = await employeeRepository.createEmployee({
    ...req.body,
    actorUserId: req.user.id
  });
  res.status(201).json({ data: employee });
}));

router.put("/:id", manageEmployees, asyncHandler(async (req, res) => {
  validate(req.body);
  const employee = await employeeRepository.updateEmployee(req.params.id, {
    ...req.body,
    actorUserId: req.user.id
  });
  res.json({ data: employee });
}));

router.patch("/:id/restore", manageEmployees, asyncHandler(async (req, res) => {
  const employee = await employeeRepository.restoreEmployee(req.params.id, req.user.id);
  res.json({ data: employee });
}));

router.delete("/:id", manageEmployees, asyncHandler(async (req, res) => {
  const result = await employeeRepository.deleteEmployee(req.params.id, req.user.id);
  res.json({ data: result });
}));

module.exports = router;

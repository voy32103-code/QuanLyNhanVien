const express = require("express");
const departmentRepository = require("../repositories/department-repository");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");
const { writeLimiter } = require("../middleware/write-rate-limit");
const { ApiError } = require("../utils/api-error");
const { validateDepartmentPayload } = require("../utils/validators");

const router = express.Router();
const manageCatalog = [requireAuth, requireRoles(["admin", "hr_manager"]), writeLimiter];

function validate(payload) {
  const errors = validateDepartmentPayload(payload);

  if (errors.length) {
    throw new ApiError(422, "Department payload is invalid.", errors);
  }
}

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const departments = await departmentRepository.listDepartments();
  res.json({ data: departments });
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentRepository.getDepartmentById(req.params.id);
  res.json({ data: department });
}));

router.post("/", manageCatalog, asyncHandler(async (req, res) => {
  validate(req.body);
  const department = await departmentRepository.createDepartment({
    ...req.body,
    actorUserId: req.user.id
  });
  res.status(201).json({ data: department });
}));

router.put("/:id", manageCatalog, asyncHandler(async (req, res) => {
  validate(req.body);
  const department = await departmentRepository.updateDepartment(req.params.id, {
    ...req.body,
    actorUserId: req.user.id
  });
  res.json({ data: department });
}));

router.delete("/:id", manageCatalog, asyncHandler(async (req, res) => {
  const result = await departmentRepository.deleteDepartment(req.params.id, req.user.id);
  res.json({ data: result });
}));

module.exports = router;

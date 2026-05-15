const express = require("express");
const departmentService = require("../services/department-service");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");
const { writeLimiter } = require("../middleware/write-rate-limit");

const router = express.Router();
const manageCatalog = [requireAuth, requireRoles(["admin", "hr_manager"]), writeLimiter];

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const departments = await departmentService.listDepartments();
  res.json({ data: departments });
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartment(req.params.id);
  res.json({ data: department });
}));

router.post("/", manageCatalog, asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.user, req.body);
  res.status(201).json({ data: department });
}));

router.put("/:id", manageCatalog, asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.user, req.params.id, req.body);
  res.json({ data: department });
}));

router.delete("/:id", manageCatalog, asyncHandler(async (req, res) => {
  const result = await departmentService.deleteDepartment(req.user, req.params.id);
  res.json({ data: result });
}));

module.exports = router;

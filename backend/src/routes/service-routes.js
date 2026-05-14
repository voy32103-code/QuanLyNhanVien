const express = require("express");
const serviceRepository = require("../repositories/service-repository");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");
const { writeLimiter } = require("../middleware/write-rate-limit");
const { ApiError } = require("../utils/api-error");
const { canReadAllServiceRequests } = require("../utils/access");
const { validateServiceCategoryPayload, validateServiceRequestPayload } = require("../utils/validators");

const router = express.Router();
const manageCatalog = [requireAuth, requireRoles(["admin", "hr_manager"]), writeLimiter];
const createRequests = [requireAuth, requireRoles(["admin", "hr_manager", "manager", "employee"]), writeLimiter];
const handleRequests = [requireAuth, requireRoles(["admin", "hr_manager", "manager"]), writeLimiter];
const deleteRequests = [requireAuth, requireRoles(["admin", "hr_manager"]), writeLimiter];

function requestReadScope(user) {
  if (canReadAllServiceRequests(user)) {
    return {};
  }

  return {
    requesterId: user.employeeId || ""
  };
}

function scopedCreatePayload(payload, user) {
  if (canReadAllServiceRequests(user)) {
    return payload;
  }

  if (!user.employeeId) {
    throw new ApiError(403, "Your user account is not linked to an employee profile.");
  }

  if (payload.requesterId && payload.requesterId !== user.employeeId) {
    throw new ApiError(403, "Employees can only create service requests for their own profile.");
  }

  return {
    ...payload,
    requesterId: user.employeeId
  };
}

function validate(payload) {
  const errors = validateServiceRequestPayload(payload);

  if (errors.length) {
    throw new ApiError(422, "Service request payload is invalid.", errors);
  }
}

function validateCategory(payload) {
  const errors = validateServiceCategoryPayload(payload);

  if (errors.length) {
    throw new ApiError(422, "Service category payload is invalid.", errors);
  }
}

router.get("/categories", requireAuth, asyncHandler(async (req, res) => {
  const categories = await serviceRepository.listServiceCategories();
  res.json({ data: categories });
}));

router.get("/categories/:id", requireAuth, asyncHandler(async (req, res) => {
  const category = await serviceRepository.getServiceCategoryById(req.params.id);
  res.json({ data: category });
}));

router.post("/categories", manageCatalog, asyncHandler(async (req, res) => {
  validateCategory(req.body);
  const category = await serviceRepository.createServiceCategory({
    ...req.body,
    actorUserId: req.user.id
  });
  res.status(201).json({ data: category });
}));

router.put("/categories/:id", manageCatalog, asyncHandler(async (req, res) => {
  validateCategory(req.body);
  const category = await serviceRepository.updateServiceCategory(req.params.id, {
    ...req.body,
    actorUserId: req.user.id
  });
  res.json({ data: category });
}));

router.delete("/categories/:id", manageCatalog, asyncHandler(async (req, res) => {
  const result = await serviceRepository.deleteServiceCategory(req.params.id, req.user.id);
  res.json({ data: result });
}));

router.get("/requests", requireAuth, asyncHandler(async (req, res) => {
  const requests = await serviceRepository.listServiceRequests(req.query, requestReadScope(req.user));
  res.json({ data: requests });
}));

router.get("/requests/:id", requireAuth, asyncHandler(async (req, res) => {
  const request = await serviceRepository.getServiceRequestById(req.params.id, requestReadScope(req.user));
  res.json({ data: request });
}));

router.post("/requests", createRequests, asyncHandler(async (req, res) => {
  const payload = scopedCreatePayload(req.body, req.user);

  validate(payload);
  const request = await serviceRepository.createServiceRequest({
    ...payload,
    actorUserId: req.user.id
  });
  res.status(201).json({ data: request });
}));

router.put("/requests/:id", handleRequests, asyncHandler(async (req, res) => {
  validate(req.body);
  const request = await serviceRepository.updateServiceRequest(req.params.id, {
    ...req.body,
    actorUserId: req.user.id
  });
  res.json({ data: request });
}));

router.patch("/requests/:id/advance", handleRequests, asyncHandler(async (req, res) => {
  const request = await serviceRepository.advanceServiceRequest(req.params.id, req.user.id);
  res.json({ data: request });
}));

router.delete("/requests/:id", deleteRequests, asyncHandler(async (req, res) => {
  const result = await serviceRepository.deleteServiceRequest(req.params.id, req.user.id);
  res.json({ data: result });
}));

module.exports = router;

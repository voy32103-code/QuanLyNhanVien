const express = require("express");
const serviceCategoryService = require("../services/service-category-service");
const serviceRequestService = require("../services/service-request-service");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/async-handler");
const { writeLimiter } = require("../middleware/write-rate-limit");

const router = express.Router();
const manageCatalog = [requireAuth, requireRoles(["admin", "hr_manager"]), writeLimiter];
const createRequests = [requireAuth, requireRoles(["admin", "hr_manager", "manager", "employee"]), writeLimiter];
const handleRequests = [requireAuth, requireRoles(["admin", "hr_manager", "manager"]), writeLimiter];
const deleteRequests = [requireAuth, requireRoles(["admin", "hr_manager"]), writeLimiter];

router.get("/categories", requireAuth, asyncHandler(async (req, res) => {
  const categories = await serviceCategoryService.listServiceCategories();
  res.json({ data: categories });
}));

router.get("/categories/:id", requireAuth, asyncHandler(async (req, res) => {
  const category = await serviceCategoryService.getServiceCategory(req.params.id);
  res.json({ data: category });
}));

router.post("/categories", manageCatalog, asyncHandler(async (req, res) => {
  const category = await serviceCategoryService.createServiceCategory(req.user, req.body);
  res.status(201).json({ data: category });
}));

router.put("/categories/:id", manageCatalog, asyncHandler(async (req, res) => {
  const category = await serviceCategoryService.updateServiceCategory(req.user, req.params.id, req.body);
  res.json({ data: category });
}));

router.delete("/categories/:id", manageCatalog, asyncHandler(async (req, res) => {
  const result = await serviceCategoryService.deleteServiceCategory(req.user, req.params.id);
  res.json({ data: result });
}));

router.get("/requests", requireAuth, asyncHandler(async (req, res) => {
  const requests = await serviceRequestService.listServiceRequests(req.user, req.query);
  res.json({ data: requests });
}));

router.post("/requests", createRequests, asyncHandler(async (req, res) => {
  const request = await serviceRequestService.createServiceRequest(req.user, req.body);
  res.status(201).json({ data: request });
}));

router.get("/requests/:id/timeline", requireAuth, asyncHandler(async (req, res) => {
  const timeline = await serviceRequestService.listServiceRequestTimeline(req.user, req.params.id);
  res.json({ data: timeline });
}));

router.post("/requests/:id/comments", createRequests, asyncHandler(async (req, res) => {
  const comment = await serviceRequestService.addServiceRequestComment(req.user, req.params.id, req.body);
  res.status(201).json({ data: comment });
}));

router.patch("/requests/:id/assign", handleRequests, asyncHandler(async (req, res) => {
  const request = await serviceRequestService.assignServiceRequest(req.user, req.params.id, req.body);
  res.json({ data: request });
}));

router.patch("/requests/:id/status", handleRequests, asyncHandler(async (req, res) => {
  const request = await serviceRequestService.changeServiceRequestStatus(req.user, req.params.id, req.body.status);
  res.json({ data: request });
}));

router.patch("/requests/:id/close", handleRequests, asyncHandler(async (req, res) => {
  const request = await serviceRequestService.closeServiceRequest(req.user, req.params.id);
  res.json({ data: request });
}));

router.patch("/requests/:id/reopen", handleRequests, asyncHandler(async (req, res) => {
  const request = await serviceRequestService.reopenServiceRequest(req.user, req.params.id);
  res.json({ data: request });
}));

router.get("/requests/:id", requireAuth, asyncHandler(async (req, res) => {
  const request = await serviceRequestService.getServiceRequest(req.user, req.params.id);
  res.json({ data: request });
}));

router.put("/requests/:id", handleRequests, asyncHandler(async (req, res) => {
  const request = await serviceRequestService.updateServiceRequest(req.user, req.params.id, req.body);
  res.json({ data: request });
}));

router.patch("/requests/:id/advance", handleRequests, asyncHandler(async (req, res) => {
  const request = await serviceRequestService.advanceServiceRequest(req.user, req.params.id);
  res.json({ data: request });
}));

router.delete("/requests/:id", deleteRequests, asyncHandler(async (req, res) => {
  const result = await serviceRequestService.deleteServiceRequest(req.user, req.params.id);
  res.json({ data: result });
}));

module.exports = router;

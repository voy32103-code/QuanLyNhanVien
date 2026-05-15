const serviceRepository = require("../repositories/service-repository");
const { ApiError } = require("../utils/api-error");
const { canReadAllServiceRequests } = require("../utils/access");
const { validateServiceRequestPayload } = require("../utils/validators");
const {
  assertTransition,
  calculateDueDate,
  isClosedStatus,
  nextAdvanceStatus
} = require("./service-request-rules");

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

async function normalizePayload(payload) {
  if (!payload.category) {
    return payload;
  }

  const category = await serviceRepository.getServiceCategoryByName(payload.category);
  const dueDate = calculateDueDate(payload.createdAt, category.slaHours, payload.priority) || payload.dueDate;

  return {
    ...payload,
    owner: payload.owner || category.owner,
    dueDate
  };
}

async function listServiceRequests(user, filters) {
  return serviceRepository.listServiceRequests(filters, requestReadScope(user));
}

async function getServiceRequest(user, id) {
  return serviceRepository.getServiceRequestById(id, requestReadScope(user));
}

async function createServiceRequest(user, payload) {
  const scoped = scopedCreatePayload(payload, user);
  const normalized = await normalizePayload({
    ...scoped,
    status: scoped.status || "open"
  });

  if (normalized.status !== "open") {
    throw new ApiError(422, "New service requests must start open.", [
      { field: "status", message: "New service requests must start with open status." }
    ]);
  }

  validate(normalized);
  return serviceRepository.createServiceRequest({
    ...normalized,
    actorUserId: user.id
  });
}

async function updateServiceRequest(user, id, payload) {
  const before = await serviceRepository.getServiceRequestById(id);
  const normalized = await normalizePayload(payload);

  validate(normalized);
  assertTransition(before.status, normalized.status);

  return serviceRepository.updateServiceRequest(id, {
    ...normalized,
    actorUserId: user.id
  });
}

async function advanceServiceRequest(user, id) {
  const before = await serviceRepository.getServiceRequestById(id);
  const nextStatus = nextAdvanceStatus(before.status);

  if (nextStatus === before.status) {
    return before;
  }

  assertTransition(before.status, nextStatus);
  return serviceRepository.changeServiceRequestStatus(id, nextStatus, user.id);
}

async function changeServiceRequestStatus(user, id, status) {
  const before = await serviceRepository.getServiceRequestById(id);

  assertTransition(before.status, status);
  return serviceRepository.changeServiceRequestStatus(id, status, user.id);
}

async function assignServiceRequest(user, id, payload) {
  if (!payload.assignedUserId) {
    throw new ApiError(422, "Assignment payload is invalid.", [
      { field: "assignedUserId", message: "Assigned user is required." }
    ]);
  }

  return serviceRepository.assignServiceRequest(id, Number(payload.assignedUserId), user.id);
}

async function closeServiceRequest(user, id) {
  const before = await serviceRepository.getServiceRequestById(id);

  assertTransition(before.status, "closed");
  return serviceRepository.changeServiceRequestStatus(id, "closed", user.id, "closed");
}

async function reopenServiceRequest(user, id) {
  const before = await serviceRepository.getServiceRequestById(id);

  if (!isClosedStatus(before.status)) {
    throw new ApiError(422, "Only resolved or closed service requests can be reopened.", [
      { field: "status", message: "Request must be resolved or closed before it can be reopened." }
    ]);
  }

  return serviceRepository.changeServiceRequestStatus(id, "inProgress", user.id, "reopened");
}

async function addServiceRequestComment(user, id, payload) {
  const body = String(payload.body || "").trim();
  const isInternal = Boolean(payload.isInternal);

  await getServiceRequest(user, id);

  if (!body || body.length < 2) {
    throw new ApiError(422, "Comment payload is invalid.", [
      { field: "body", message: "Comment body must be at least 2 characters." }
    ]);
  }

  if (isInternal && !canReadAllServiceRequests(user)) {
    throw new ApiError(403, "Only service handlers can add internal comments.");
  }

  return serviceRepository.addServiceRequestComment(id, {
    actorUserId: user.id,
    body,
    isInternal
  });
}

async function listServiceRequestTimeline(user, id) {
  await getServiceRequest(user, id);
  return serviceRepository.listServiceRequestTimeline(id, {
    includeInternal: canReadAllServiceRequests(user)
  });
}

async function deleteServiceRequest(user, id) {
  return serviceRepository.deleteServiceRequest(id, user.id);
}

module.exports = {
  addServiceRequestComment,
  advanceServiceRequest,
  assignServiceRequest,
  changeServiceRequestStatus,
  closeServiceRequest,
  createServiceRequest,
  deleteServiceRequest,
  getServiceRequest,
  listServiceRequestTimeline,
  listServiceRequests,
  reopenServiceRequest,
  updateServiceRequest
};

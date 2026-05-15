const { ApiError } = require("../utils/api-error");
const { parseDateInput } = require("../utils/date");

const SERVICE_REQUEST_TRANSITIONS = {
  open: ["triage", "inProgress"],
  triage: ["inProgress", "waiting"],
  inProgress: ["waiting", "resolved"],
  waiting: ["inProgress", "resolved"],
  resolved: ["closed", "inProgress"],
  closed: []
};

const ADVANCE_STATUS = {
  open: "inProgress",
  triage: "inProgress",
  inProgress: "waiting",
  waiting: "resolved",
  resolved: "closed"
};

const PRIORITY_MULTIPLIER = {
  urgent: 0.5,
  high: 0.75,
  normal: 1
};

const CLOSED_STATUSES = ["resolved", "closed"];

function canTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) {
    return true;
  }

  return (SERVICE_REQUEST_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

function assertTransition(fromStatus, toStatus) {
  if (canTransition(fromStatus, toStatus)) {
    return;
  }

  throw new ApiError(422, "Service request status transition is invalid.", [
    {
      field: "status",
      message: `Cannot move from ${fromStatus} to ${toStatus}.`
    }
  ]);
}

function nextAdvanceStatus(status) {
  return ADVANCE_STATUS[status] || status;
}

function isClosedStatus(status) {
  return CLOSED_STATUSES.includes(status);
}

function toLocalDateOnly(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateDueDate(createdAt, slaHours, priority) {
  const created = parseDateInput(createdAt);
  const hours = Number(slaHours);
  const multiplier = PRIORITY_MULTIPLIER[priority] || PRIORITY_MULTIPLIER.normal;

  if (Number.isNaN(created.getTime()) || !Number.isFinite(hours) || hours < 1) {
    return null;
  }

  const dueAt = new Date(created.getTime() + (hours * multiplier * 60 * 60 * 1000));
  return toLocalDateOnly(dueAt);
}

module.exports = {
  calculateDueDate,
  canTransition,
  assertTransition,
  isClosedStatus,
  nextAdvanceStatus,
  PRIORITY_MULTIPLIER,
  SERVICE_REQUEST_TRANSITIONS
};

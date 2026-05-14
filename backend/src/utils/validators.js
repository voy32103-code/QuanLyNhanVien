const { parseDateInput } = require("./date");

const employeeStatuses = ["active", "probation", "leave"];
const serviceStatuses = ["open", "inProgress", "waiting", "resolved"];
const servicePriorities = ["urgent", "high", "normal"];
const colorPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

function validateDepartmentPayload(payload) {
  const errors = [];

  if (!payload.name || String(payload.name).trim().length < 2) {
    errors.push({ field: "name", message: "Department name must be at least 2 characters." });
  }

  if (!payload.owner || String(payload.owner).trim().length < 2) {
    errors.push({ field: "owner", message: "Department owner must be at least 2 characters." });
  }

  if (!payload.color || !colorPattern.test(String(payload.color))) {
    errors.push({ field: "color", message: "Department color must be a valid hex color." });
  }

  if (!payload.description || String(payload.description).trim().length < 6) {
    errors.push({ field: "description", message: "Department description must be at least 6 characters." });
  }

  return errors;
}

function validateServiceCategoryPayload(payload) {
  const errors = [];

  if (!payload.name || String(payload.name).trim().length < 2) {
    errors.push({ field: "name", message: "Service category name must be at least 2 characters." });
  }

  if (!payload.owner || String(payload.owner).trim().length < 2) {
    errors.push({ field: "owner", message: "Service category owner must be at least 2 characters." });
  }

  if (!Number.isFinite(Number(payload.slaHours)) || Number(payload.slaHours) < 1) {
    errors.push({ field: "slaHours", message: "SLA hours must be at least 1." });
  }

  if (!payload.color || !colorPattern.test(String(payload.color))) {
    errors.push({ field: "color", message: "Service category color must be a valid hex color." });
  }

  return errors;
}

function validateEmployeePayload(payload) {
  const errors = [];
  const startDate = parseDateInput(payload.startDate);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (!payload.name || String(payload.name).trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email || ""))) {
    errors.push({ field: "email", message: "Email is invalid." });
  }

  if (String(payload.phone || "").replace(/\D/g, "").length < 9) {
    errors.push({ field: "phone", message: "Phone must have at least 9 digits." });
  }

  if (!payload.department) {
    errors.push({ field: "department", message: "Department is required." });
  }

  if (!payload.role || String(payload.role).trim().length < 2) {
    errors.push({ field: "role", message: "Role must be at least 2 characters." });
  }

  if (!Number.isFinite(Number(payload.salary)) || Number(payload.salary) < 1000000) {
    errors.push({ field: "salary", message: "Salary must be at least 1000000." });
  }

  if (!payload.startDate || Number.isNaN(startDate.getTime())) {
    errors.push({ field: "startDate", message: "Start date is invalid." });
  } else if (startDate > today) {
    errors.push({ field: "startDate", message: "Start date cannot be in the future." });
  }

  if (!employeeStatuses.includes(payload.status)) {
    errors.push({ field: "status", message: "Employee status is invalid." });
  }

  if (!Number.isFinite(Number(payload.performance)) || Number(payload.performance) < 40 || Number(payload.performance) > 100) {
    errors.push({ field: "performance", message: "Performance must be between 40 and 100." });
  }

  return errors;
}

function validateServiceRequestPayload(payload) {
  const errors = [];
  const createdAt = parseDateInput(payload.createdAt);
  const dueDate = parseDateInput(payload.dueDate);

  if (!payload.title || String(payload.title).trim().length < 4) {
    errors.push({ field: "title", message: "Title must be at least 4 characters." });
  }

  if (!payload.requesterId) {
    errors.push({ field: "requesterId", message: "Requester is required." });
  }

  if (!payload.category) {
    errors.push({ field: "category", message: "Service category is required." });
  }

  if (!payload.owner || String(payload.owner).trim().length < 2) {
    errors.push({ field: "owner", message: "Owner must be at least 2 characters." });
  }

  if (!servicePriorities.includes(payload.priority)) {
    errors.push({ field: "priority", message: "Priority is invalid." });
  }

  if (!serviceStatuses.includes(payload.status)) {
    errors.push({ field: "status", message: "Request status is invalid." });
  }

  if (!payload.createdAt || Number.isNaN(createdAt.getTime())) {
    errors.push({ field: "createdAt", message: "Created date is invalid." });
  }

  if (!payload.dueDate || Number.isNaN(dueDate.getTime())) {
    errors.push({ field: "dueDate", message: "Due date is invalid." });
  } else if (!Number.isNaN(createdAt.getTime()) && dueDate < createdAt) {
    errors.push({ field: "dueDate", message: "Due date cannot be before created date." });
  }

  if (!payload.description || String(payload.description).trim().length < 8) {
    errors.push({ field: "description", message: "Description must be at least 8 characters." });
  }

  return errors;
}

module.exports = {
  validateDepartmentPayload,
  validateEmployeePayload,
  validateServiceCategoryPayload,
  validateServiceRequestPayload
};

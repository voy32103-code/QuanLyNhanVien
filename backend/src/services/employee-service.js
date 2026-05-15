const employeeRepository = require("../repositories/employee-repository");
const { ApiError } = require("../utils/api-error");
const { canViewCompensation } = require("../utils/access");
const { validateEmployeePayload } = require("../utils/validators");

function validate(payload) {
  const errors = validateEmployeePayload(payload);

  if (errors.length) {
    throw new ApiError(422, "Employee payload is invalid.", errors);
  }
}

async function listEmployees(user, filters) {
  return employeeRepository.listEmployees(filters, {
    includeCompensation: canViewCompensation(user)
  });
}

async function getEmployee(user, id) {
  return employeeRepository.getEmployeeById(id, {
    includeCompensation: canViewCompensation(user)
  });
}

async function createEmployee(user, payload) {
  validate(payload);
  return employeeRepository.createEmployee({
    ...payload,
    actorUserId: user.id
  });
}

async function updateEmployee(user, id, payload) {
  validate(payload);
  return employeeRepository.updateEmployee(id, {
    ...payload,
    actorUserId: user.id
  });
}

async function restoreEmployee(user, id) {
  return employeeRepository.restoreEmployee(id, user.id);
}

async function deleteEmployee(user, id) {
  return employeeRepository.deleteEmployee(id, user.id);
}

module.exports = {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  restoreEmployee,
  updateEmployee
};

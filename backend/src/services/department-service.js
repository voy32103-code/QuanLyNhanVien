const departmentRepository = require("../repositories/department-repository");
const { ApiError } = require("../utils/api-error");
const { validateDepartmentPayload } = require("../utils/validators");

function validate(payload) {
  const errors = validateDepartmentPayload(payload);

  if (errors.length) {
    throw new ApiError(422, "Department payload is invalid.", errors);
  }
}

async function listDepartments() {
  return departmentRepository.listDepartments();
}

async function getDepartment(id) {
  return departmentRepository.getDepartmentById(id);
}

async function createDepartment(user, payload) {
  validate(payload);
  return departmentRepository.createDepartment({
    ...payload,
    actorUserId: user.id
  });
}

async function updateDepartment(user, id, payload) {
  validate(payload);
  return departmentRepository.updateDepartment(id, {
    ...payload,
    actorUserId: user.id
  });
}

async function deleteDepartment(user, id) {
  return departmentRepository.deleteDepartment(id, user.id);
}

module.exports = {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment
};

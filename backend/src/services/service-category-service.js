const serviceRepository = require("../repositories/service-repository");
const { ApiError } = require("../utils/api-error");
const { validateServiceCategoryPayload } = require("../utils/validators");

function validate(payload) {
  const errors = validateServiceCategoryPayload(payload);

  if (errors.length) {
    throw new ApiError(422, "Service category payload is invalid.", errors);
  }
}

async function listServiceCategories() {
  return serviceRepository.listServiceCategories();
}

async function getServiceCategory(id) {
  return serviceRepository.getServiceCategoryById(id);
}

async function createServiceCategory(user, payload) {
  validate(payload);
  return serviceRepository.createServiceCategory({
    ...payload,
    actorUserId: user.id
  });
}

async function updateServiceCategory(user, id, payload) {
  validate(payload);
  return serviceRepository.updateServiceCategory(id, {
    ...payload,
    actorUserId: user.id
  });
}

async function deleteServiceCategory(user, id) {
  return serviceRepository.deleteServiceCategory(id, user.id);
}

module.exports = {
  createServiceCategory,
  deleteServiceCategory,
  getServiceCategory,
  listServiceCategories,
  updateServiceCategory
};

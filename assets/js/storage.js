(function () {
  "use strict";

  var api = window.HR_API;

  async function loadInitialData() {
    var results = await Promise.all([
      api.listDepartments(),
      api.listEmployees(),
      api.listServiceCategories(),
      api.listServiceRequests(),
      api.getSummary()
    ]);

    return {
      departments: results[0] || [],
      employees: results[1] || [],
      serviceCategories: results[2] || [],
      serviceRequests: results[3] || [],
      summary: results[4] || null
    };
  }

  window.HR_STORE = {
    usesLegacyTokenStorage: api.usesLegacyTokenStorage,
    setAuthToken: api.setAuthToken,
    login: api.login,
    logout: api.logout,
    me: api.me,
    loadInitialData: loadInitialData,
    loadEmployees: api.listEmployees,
    loadServiceRequests: api.listServiceRequests,
    createDepartment: api.createDepartment,
    updateDepartment: api.updateDepartment,
    deleteDepartment: api.deleteDepartment,
    createEmployee: api.createEmployee,
    updateEmployee: api.updateEmployee,
    deleteEmployee: api.deleteEmployee,
    restoreEmployee: api.restoreEmployee,
    createServiceCategory: api.createServiceCategory,
    updateServiceCategory: api.updateServiceCategory,
    deleteServiceCategory: api.deleteServiceCategory,
    createServiceRequest: api.createServiceRequest,
    updateServiceRequest: api.updateServiceRequest,
    advanceServiceRequest: api.advanceServiceRequest,
    deleteServiceRequest: api.deleteServiceRequest
  };
}());

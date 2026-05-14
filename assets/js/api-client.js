(function () {
  "use strict";

  var DEFAULT_FILE_BASE_URL = "http://localhost:3000";

  function getBaseUrl() {
    var configured = window.HR_API_BASE_URL || "";

    if (!configured && window.location.protocol === "file:") {
      configured = DEFAULT_FILE_BASE_URL;
    }

    return configured.replace(/\/$/, "");
  }

  function usesLegacyTokenStorage() {
    return window.HR_USE_LEGACY_TOKEN_STORAGE === true || window.location.protocol === "file:";
  }

  function buildUrl(path, params) {
    var url = getBaseUrl() + path;
    var query = new URLSearchParams();

    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });

    return query.toString() ? url + "?" + query.toString() : url;
  }

  function getAuthHeaders() {
    if (!usesLegacyTokenStorage()) {
      return {};
    }

    var token = window.HR_AUTH_TOKEN || sessionStorage.getItem("quanlynv.authToken") || "";
    return token ? { Authorization: "Bearer " + token } : {};
  }

  async function parseResponse(response) {
    var payload = null;

    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      var errorPayload = payload && payload.error ? payload.error : {};
      var message = errorPayload.message || "Khong the ket noi API.";
      var error = new Error(message);

      error.statusCode = errorPayload.statusCode || response.status;
      error.details = errorPayload.details || [];
      throw error;
    }

    return payload ? payload.data : null;
  }

  async function request(path, options) {
    var settings = options || {};
    var headers = Object.assign(
      {},
      getAuthHeaders(),
      settings.body ? { "Content-Type": "application/json" } : {},
      settings.headers || {}
    );

    return parseResponse(await fetch(buildUrl(path, settings.params), {
      method: settings.method || "GET",
      headers: headers,
      credentials: "include",
      body: settings.body ? JSON.stringify(settings.body) : undefined
    }));
  }

  window.HR_API = {
    usesLegacyTokenStorage: usesLegacyTokenStorage,
    setAuthToken: function (token) {
      if (usesLegacyTokenStorage() && token) {
        window.HR_AUTH_TOKEN = token;
        sessionStorage.setItem("quanlynv.authToken", token);
      } else {
        window.HR_AUTH_TOKEN = "";
        sessionStorage.removeItem("quanlynv.authToken");
      }
    },
    login: function (credentials) {
      return request("/api/auth/login", { method: "POST", body: credentials });
    },
    logout: function () {
      return request("/api/auth/logout", { method: "POST" });
    },
    me: function () {
      return request("/api/auth/me");
    },
    listDepartments: function () {
      return request("/api/departments");
    },
    createDepartment: function (department) {
      return request("/api/departments", { method: "POST", body: department });
    },
    updateDepartment: function (id, department) {
      return request("/api/departments/" + encodeURIComponent(id), { method: "PUT", body: department });
    },
    deleteDepartment: function (id) {
      return request("/api/departments/" + encodeURIComponent(id), { method: "DELETE" });
    },
    listEmployees: function (filters) {
      return request("/api/employees", { params: filters });
    },
    createEmployee: function (employee) {
      return request("/api/employees", { method: "POST", body: employee });
    },
    updateEmployee: function (id, employee) {
      return request("/api/employees/" + encodeURIComponent(id), { method: "PUT", body: employee });
    },
    deleteEmployee: function (id) {
      return request("/api/employees/" + encodeURIComponent(id), { method: "DELETE" });
    },
    restoreEmployee: function (id) {
      return request("/api/employees/" + encodeURIComponent(id) + "/restore", { method: "PATCH" });
    },
    listServiceCategories: function () {
      return request("/api/services/categories");
    },
    createServiceCategory: function (category) {
      return request("/api/services/categories", { method: "POST", body: category });
    },
    updateServiceCategory: function (id, category) {
      return request("/api/services/categories/" + encodeURIComponent(id), { method: "PUT", body: category });
    },
    deleteServiceCategory: function (id) {
      return request("/api/services/categories/" + encodeURIComponent(id), { method: "DELETE" });
    },
    listServiceRequests: function (filters) {
      return request("/api/services/requests", { params: filters });
    },
    createServiceRequest: function (serviceRequest) {
      return request("/api/services/requests", { method: "POST", body: serviceRequest });
    },
    updateServiceRequest: function (id, serviceRequest) {
      return request("/api/services/requests/" + encodeURIComponent(id), { method: "PUT", body: serviceRequest });
    },
    advanceServiceRequest: function (id) {
      return request("/api/services/requests/" + encodeURIComponent(id) + "/advance", { method: "PATCH" });
    },
    deleteServiceRequest: function (id) {
      return request("/api/services/requests/" + encodeURIComponent(id), { method: "DELETE" });
    },
    getSummary: function () {
      return request("/api/reports/summary");
    }
  };
}());

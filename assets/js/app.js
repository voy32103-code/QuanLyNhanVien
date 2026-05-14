(function () {
  "use strict";

  var helpers = window.HR_HELPERS;
  var analytics = window.HR_ANALYTICS;
  var validators = window.HR_VALIDATORS;
  var departments = [];
  var serviceCategories = [];
  var state = {
    employees: [],
    serviceRequests: [],
    authUser: null,
    isLoading: true,
    apiError: null,
    query: "",
    department: "all",
    status: "all",
    sortBy: "name",
    serviceCategory: "all",
    serviceStatus: "all",
    servicePriority: "all",
    lastDeleted: null,
    undoTimer: null
  };

  var elements = {};

  async function boot() {
    elements = {
      navLinks: document.querySelectorAll("[data-view-link]"),
      views: document.querySelectorAll(".view"),
      globalSearch: document.getElementById("globalSearch"),
      authUserLabel: document.getElementById("authUserLabel"),
      loginDialog: document.getElementById("loginDialog"),
      loginForm: document.getElementById("loginForm"),
      loginFormAlert: document.getElementById("loginFormAlert"),
      departmentFilter: document.getElementById("departmentFilter"),
      statusFilter: document.getElementById("statusFilter"),
      sortBy: document.getElementById("sortBy"),
      metricsGrid: document.getElementById("metricsGrid"),
      departmentChart: document.getElementById("departmentChart"),
      timelineList: document.getElementById("timelineList"),
      employeeTable: document.getElementById("employeeTable"),
      tableSummary: document.getElementById("tableSummary"),
      departmentCards: document.getElementById("departmentCards"),
      payrollReport: document.getElementById("payrollReport"),
      talentReport: document.getElementById("talentReport"),
      serviceReport: document.getElementById("serviceReport"),
      servicePulse: document.getElementById("servicePulse"),
      serviceMetricsGrid: document.getElementById("serviceMetricsGrid"),
      serviceCategoryFilter: document.getElementById("serviceCategoryFilter"),
      serviceStatusFilter: document.getElementById("serviceStatusFilter"),
      servicePriorityFilter: document.getElementById("servicePriorityFilter"),
      serviceTable: document.getElementById("serviceTable"),
      serviceCategoryChart: document.getElementById("serviceCategoryChart"),
      departmentAdminTable: document.getElementById("departmentAdminTable"),
      serviceCategoryAdminTable: document.getElementById("serviceCategoryAdminTable"),
      dialog: document.getElementById("employeeDialog"),
      form: document.getElementById("employeeForm"),
      formAlert: document.getElementById("formAlert"),
      dialogTitle: document.getElementById("dialogTitle"),
      performanceOutput: document.getElementById("performanceOutput"),
      departmentDialog: document.getElementById("departmentDialog"),
      departmentForm: document.getElementById("departmentForm"),
      departmentFormAlert: document.getElementById("departmentFormAlert"),
      departmentDialogTitle: document.getElementById("departmentDialogTitle"),
      categoryDialog: document.getElementById("categoryDialog"),
      categoryForm: document.getElementById("categoryForm"),
      categoryFormAlert: document.getElementById("categoryFormAlert"),
      categoryDialogTitle: document.getElementById("categoryDialogTitle"),
      requestDialog: document.getElementById("requestDialog"),
      requestForm: document.getElementById("requestForm"),
      requestFormAlert: document.getElementById("requestFormAlert"),
      requestDialogTitle: document.getElementById("requestDialogTitle"),
      drawer: document.getElementById("detailDrawer"),
      drawerName: document.getElementById("drawerName"),
      drawerContent: document.getElementById("drawerContent"),
      toast: document.getElementById("toast")
    };

    bindEvents();
    setActiveView(location.hash.replace("#", "") || "overview");
    renderLoadingState("Đang tải dữ liệu từ backend...");
    await initializeAuth();
    if (state.authUser) {
      await loadBackendData();
    } else {
      renderSignedOutState();
    }
  }

  function bindEvents() {
    elements.navLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var view = link.dataset.viewLink;
        history.replaceState(null, "", "#" + view);
        setActiveView(view);
      });
    });

    elements.globalSearch.addEventListener("input", function (event) {
      state.query = event.target.value;
      renderEmployees();
      renderServices();
      renderMetrics();
    });

    elements.departmentFilter.addEventListener("change", function (event) {
      state.department = event.target.value;
      renderEmployees();
      renderMetrics();
    });

    elements.statusFilter.addEventListener("change", function (event) {
      state.status = event.target.value;
      renderEmployees();
      renderMetrics();
    });

    elements.sortBy.addEventListener("change", function (event) {
      state.sortBy = event.target.value;
      renderEmployees();
    });

    document.querySelectorAll("[data-open-dialog]").forEach(function (button) {
      button.addEventListener("click", function () {
        openEmployeeDialog();
      });
    });

    document.querySelectorAll("[data-open-request-dialog]").forEach(function (button) {
      button.addEventListener("click", function () {
        openRequestDialog();
      });
    });

    document.querySelectorAll("[data-open-department-dialog]").forEach(function (button) {
      button.addEventListener("click", function () {
        openDepartmentDialog();
      });
    });

    document.querySelectorAll("[data-open-category-dialog]").forEach(function (button) {
      button.addEventListener("click", function () {
        openCategoryDialog();
      });
    });

    document.querySelectorAll("[data-open-login]").forEach(function (button) {
      button.addEventListener("click", openLoginDialog);
    });

    document.querySelectorAll("[data-logout]").forEach(function (button) {
      button.addEventListener("click", logout);
    });

    document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
      button.addEventListener("click", closeEmployeeDialog);
    });

    document.querySelectorAll("[data-close-request-dialog]").forEach(function (button) {
      button.addEventListener("click", closeRequestDialog);
    });

    document.querySelectorAll("[data-close-department-dialog]").forEach(function (button) {
      button.addEventListener("click", closeDepartmentDialog);
    });

    document.querySelectorAll("[data-close-category-dialog]").forEach(function (button) {
      button.addEventListener("click", closeCategoryDialog);
    });

    document.querySelectorAll("[data-close-login]").forEach(function (button) {
      button.addEventListener("click", closeLoginDialog);
    });

    document.querySelector("[data-close-drawer]").addEventListener("click", closeDrawer);
    document.querySelector("[data-reset-data]").addEventListener("click", resetData);
    document.querySelector("[data-export-csv]").addEventListener("click", exportCsv);
    document.querySelector("[data-export-service-csv]").addEventListener("click", exportServiceCsv);

    document.getElementById("employeePerformance").addEventListener("input", function (event) {
      elements.performanceOutput.textContent = event.target.value;
    });

    elements.form.addEventListener("submit", saveEmployee);
    elements.form.addEventListener("input", function (event) {
      clearFieldError(event.target);
    });
    elements.form.addEventListener("change", function (event) {
      clearFieldError(event.target);
    });

    elements.requestForm.addEventListener("submit", saveServiceRequest);
    elements.requestForm.addEventListener("input", function (event) {
      clearRequestFieldError(event.target);
    });
    elements.requestForm.addEventListener("change", function (event) {
      clearRequestFieldError(event.target);
      if (event.target.id === "requestCategory" || event.target.id === "requestCreatedAt") {
        fillServiceOwnerFromCategory(document.getElementById("requestCategory").value);
      }
    });

    elements.departmentForm.addEventListener("submit", saveDepartment);
    elements.departmentForm.addEventListener("input", function (event) {
      clearCatalogFieldError(event.target, elements.departmentFormAlert);
    });

    elements.categoryForm.addEventListener("submit", saveServiceCategory);
    elements.categoryForm.addEventListener("input", function (event) {
      clearCatalogFieldError(event.target, elements.categoryFormAlert);
    });

    elements.loginForm.addEventListener("submit", login);
    elements.loginForm.addEventListener("input", function () {
      elements.loginFormAlert.hidden = true;
      elements.loginFormAlert.textContent = "";
    });

    elements.serviceCategoryFilter.addEventListener("change", function (event) {
      state.serviceCategory = event.target.value;
      renderServices();
    });

    elements.serviceStatusFilter.addEventListener("change", function (event) {
      state.serviceStatus = event.target.value;
      renderServices();
    });

    elements.servicePriorityFilter.addEventListener("change", function (event) {
      state.servicePriority = event.target.value;
      renderServices();
    });

    elements.employeeTable.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }

      var id = button.dataset.id;
      if (button.dataset.action === "view") {
        openDrawer(id);
      }
      if (button.dataset.action === "edit") {
        openEmployeeDialog(id);
      }
      if (button.dataset.action === "delete") {
        deleteEmployee(id);
      }
    });

    elements.serviceTable.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-request-action]");
      if (!button) {
        return;
      }

      var id = button.dataset.id;
      if (button.dataset.requestAction === "edit") {
        openRequestDialog(id);
      }
      if (button.dataset.requestAction === "advance") {
        advanceServiceRequest(id);
      }
      if (button.dataset.requestAction === "delete") {
        deleteServiceRequest(id);
      }
    });

    elements.departmentAdminTable.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-department-action]");
      if (!button) {
        return;
      }

      if (button.dataset.departmentAction === "edit") {
        openDepartmentDialog(button.dataset.id);
      }
      if (button.dataset.departmentAction === "delete") {
        deleteDepartment(button.dataset.id);
      }
    });

    elements.serviceCategoryAdminTable.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-category-action]");
      if (!button) {
        return;
      }

      if (button.dataset.categoryAction === "edit") {
        openCategoryDialog(button.dataset.id);
      }
      if (button.dataset.categoryAction === "delete") {
        deleteServiceCategory(button.dataset.id);
      }
    });

    window.addEventListener("hashchange", function () {
      setActiveView(location.hash.replace("#", "") || "overview");
    });

    document.addEventListener("keydown", handleShortcuts);
  }

  async function initializeAuth() {
    if (window.HR_STORE.usesLegacyTokenStorage() && !sessionStorage.getItem("quanlynv.authToken")) {
      applyAuthState();
      return;
    }

    try {
      var session = await window.HR_STORE.me();
      state.authUser = session.user;
    } catch (error) {
      window.HR_STORE.setAuthToken("");
      state.authUser = null;
    }

    applyAuthState();
  }

  function userHasRole(roles) {
    var userRoles = state.authUser ? state.authUser.roles : [];
    return userRoles.some(function (role) {
      return roles.indexOf(role) >= 0;
    });
  }

  function can(permission) {
    if (permission === "manageEmployees" || permission === "manageCatalog" || permission === "deleteServiceRequest") {
      return userHasRole(["admin", "hr_manager"]);
    }
    if (permission === "handleServiceRequest") {
      return userHasRole(["admin", "hr_manager", "manager"]);
    }
    if (permission === "createServiceRequest") {
      return userHasRole(["admin", "hr_manager", "manager", "employee"]);
    }
    return Boolean(state.authUser);
  }

  function canChooseRequester() {
    return userHasRole(["admin", "hr_manager", "manager"]);
  }

  function canViewCompensation() {
    return userHasRole(["admin", "hr_manager"]);
  }

  function compensationText(value) {
    if (!canViewCompensation() || value == null) {
      return "\u1ea8n theo quy\u1ec1n";
    }

    return helpers.formatCurrency(value);
  }

  function selectableRequesters() {
    if (!state.authUser || canChooseRequester()) {
      return state.employees;
    }

    if (!state.authUser.employeeId) {
      return [];
    }

    return state.employees.filter(function (employee) {
      return employee.id === state.authUser.employeeId;
    });
  }

  function clearProtectedData() {
    departments = [];
    serviceCategories = [];
    state.employees = [];
    state.serviceRequests = [];
    state.lastDeleted = null;
    window.clearTimeout(state.undoTimer);
    populateDepartmentOptions();
    populateServiceOptions();
  }

  function renderSignedOutState() {
    state.isLoading = false;
    state.apiError = null;
    clearProtectedData();
    setControlsDisabled(false);
    applyAuthState();
    renderLoadingState("\u0110\u0103ng nh\u1eadp \u0111\u1ec3 t\u1ea3i d\u1eef li\u1ec7u.");
  }

  function applyAuthState() {
    var label = state.authUser
      ? state.authUser.name + " · " + state.authUser.roles.join(", ")
      : "Chưa đăng nhập";

    elements.authUserLabel.textContent = label;
    document.querySelectorAll("[data-open-login]").forEach(function (button) {
      button.hidden = Boolean(state.authUser);
    });
    document.querySelectorAll("[data-logout]").forEach(function (button) {
      button.hidden = !state.authUser;
    });
    document.querySelectorAll("[data-permission]").forEach(function (item) {
      item.hidden = !can(item.dataset.permission);
    });
  }

  async function loadBackendData() {
    state.isLoading = true;
    state.apiError = null;
    setControlsDisabled(true);
    renderLoadingState("Đang tải dữ liệu từ backend...");

    try {
      var data = await window.HR_STORE.loadInitialData();

      departments = data.departments;
      serviceCategories = data.serviceCategories;
      state.employees = data.employees;
      state.serviceRequests = data.serviceRequests;
      state.isLoading = false;
      state.apiError = null;
      state.lastDeleted = null;
      window.clearTimeout(state.undoTimer);

      populateDepartmentOptions();
      populateServiceOptions();
      setControlsDisabled(false);
      applyAuthState();
      render();
    } catch (error) {
      departments = [];
      serviceCategories = [];
      state.employees = [];
      state.serviceRequests = [];
      state.isLoading = false;
      state.apiError = error;
      populateDepartmentOptions();
      populateServiceOptions();
      setControlsDisabled(false);
      applyAuthState();
      renderErrorState(error);
      showToast(apiErrorMessage(error));
    }
  }

  function setControlsDisabled(disabled) {
    [
      elements.globalSearch,
      elements.departmentFilter,
      elements.statusFilter,
      elements.sortBy,
      elements.serviceCategoryFilter,
      elements.serviceStatusFilter,
      elements.servicePriorityFilter
    ].forEach(function (control) {
      if (control) {
        control.disabled = disabled || Boolean(state.apiError);
      }
    });

    document.querySelectorAll("[data-open-dialog], [data-open-request-dialog], [data-open-department-dialog], [data-open-category-dialog], [data-export-csv], [data-export-service-csv]").forEach(function (button) {
      button.disabled = disabled || Boolean(state.apiError);
    });
  }

  function apiErrorMessage(error) {
    if (!error) {
      return "Không thể tải dữ liệu.";
    }
    if (error.statusCode === 429) {
      return "API đang giới hạn tốc độ yêu cầu. Vui lòng thử lại sau.";
    }
    return error.message || "Không thể kết nối backend API.";
  }

  function tableRowState(message) {
    return "<tr><td colspan=\"6\" class=\"empty-state\">" + helpers.escapeHtml(message) + "</td></tr>";
  }

  function panelState(message) {
    return "<article class=\"report-item\"><strong>" + helpers.escapeHtml(message) + "</strong></article>";
  }

  function renderLoadingState(message) {
    var cards = ["Nhân viên", "Hiệu suất", "Quỹ lương", "Service desk"].map(function (label) {
      return "<article class=\"metric-card\"><span>" + helpers.escapeHtml(label) + "</span><strong>...</strong><p>" + helpers.escapeHtml(message) + "</p></article>";
    });

    elements.metricsGrid.innerHTML = cards.join("");
    elements.serviceMetricsGrid.innerHTML = cards.join("");
    elements.tableSummary.textContent = message;
    elements.employeeTable.innerHTML = tableRowState(message);
    elements.departmentAdminTable.innerHTML = "<tr><td colspan=\"4\" class=\"empty-state\">" + helpers.escapeHtml(message) + "</td></tr>";
    document.getElementById("serviceTableTitle").textContent = message;
    elements.serviceTable.innerHTML = tableRowState(message);
    elements.serviceCategoryAdminTable.innerHTML = "<tr><td colspan=\"5\" class=\"empty-state\">" + helpers.escapeHtml(message) + "</td></tr>";
    elements.departmentChart.innerHTML = panelState(message);
    elements.serviceCategoryChart.innerHTML = panelState(message);
    elements.servicePulse.innerHTML = panelState(message);
    elements.departmentCards.innerHTML = panelState(message);
    elements.payrollReport.innerHTML = panelState(message);
    elements.talentReport.innerHTML = panelState(message);
    elements.serviceReport.innerHTML = panelState(message);
  }

  function renderErrorState(error) {
    var message = apiErrorMessage(error);

    renderLoadingState(message);
    elements.tableSummary.textContent = "Lỗi API";
    document.getElementById("serviceTableTitle").textContent = "Lỗi API";
  }

  function populateDepartmentOptions() {
    var departmentOptions = ["<option value=\"all\">Tất cả</option>"].concat(
      departments.map(function (department) {
        return "<option value=\"" + helpers.escapeHtml(department.name) + "\">" +
          helpers.escapeHtml(department.name) +
          "</option>";
      })
    );
    var employeeOptions = departments.length
      ? departments.map(function (department) {
        return "<option value=\"" + helpers.escapeHtml(department.name) + "\">" +
          helpers.escapeHtml(department.name) +
          "</option>";
      })
      : ["<option value=\"\">Chưa có phòng ban</option>"];

    elements.departmentFilter.innerHTML = departmentOptions.join("");
    document.getElementById("employeeDepartment").innerHTML = employeeOptions.join("");
  }

  function populateServiceOptions() {
    var categoryOptions = ["<option value=\"all\">Tất cả</option>"].concat(
      serviceCategories.map(function (category) {
        return "<option value=\"" + helpers.escapeHtml(category.name) + "\">" +
          helpers.escapeHtml(category.name) +
          "</option>";
      })
    );
    var requestCategoryOptions = serviceCategories.length
      ? serviceCategories.map(function (category) {
        return "<option value=\"" + helpers.escapeHtml(category.name) + "\">" +
          helpers.escapeHtml(category.name) +
          "</option>";
      })
      : ["<option value=\"\">Chưa có nhóm dịch vụ</option>"];
    var requesters = selectableRequesters();
    var requesterOptions = requesters.length
      ? requesters.map(function (employee) {
        return "<option value=\"" + helpers.escapeHtml(employee.id) + "\">" +
          helpers.escapeHtml(employee.name + " - " + employee.department) +
          "</option>";
      })
      : ["<option value=\"\">Chưa có nhân viên</option>"];

    elements.serviceCategoryFilter.innerHTML = categoryOptions.join("");
    document.getElementById("requestCategory").innerHTML = requestCategoryOptions.join("");
    document.getElementById("requesterId").innerHTML = requesterOptions.join("");
  }

  function setActiveView(viewName) {
    var target = document.getElementById(viewName) ? viewName : "overview";
    elements.views.forEach(function (view) {
      view.classList.toggle("is-active", view.id === target);
    });
    elements.navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.viewLink === target);
    });
  }

  function render() {
    renderMetrics();
    renderDepartmentChart();
    renderTimeline();
    renderServicePulse();
    renderEmployees();
    renderDepartments();
    renderCatalogAdmin();
    renderReports();
    renderServices();
  }

  function renderMetrics() {
    var filtered = filterEmployees();
    var totals = analytics.summary(state.employees, filtered.length, departments);

    var cards = [
      {
        label: "Tổng nhân viên",
        value: totals.total,
        note: totals.filtered + " hồ sơ khớp bộ lọc",
        trend: "Cập nhật theo thời gian thực"
      },
      {
        label: "Đang làm",
        value: totals.active,
        note: "Bao gồm nhân sự chính thức",
        trend: totals.activeRate + "% lực lượng"
      },
      {
        label: "Hiệu suất TB",
        value: totals.avgPerformance + "%",
        note: "Từ điểm đánh giá nội bộ",
        trend: totals.avgPerformance >= 85 ? "Ổn định" : "Cần theo dõi"
      },
      {
        label: "Quỹ lương",
        value: compensationText(totals.payroll),
        note: "Ước tính mỗi tháng",
        trend: totals.departmentCount + " phòng ban"
      }
    ];

    elements.metricsGrid.innerHTML = cards.map(function (card) {
      return "<article class=\"metric-card\">" +
        "<span>" + helpers.escapeHtml(card.label) + "</span>" +
        "<strong>" + helpers.escapeHtml(card.value) + "</strong>" +
        "<p>" + helpers.escapeHtml(card.note) + "</p>" +
        "<div class=\"metric-trend\">" + helpers.escapeHtml(card.trend) + "</div>" +
        "</article>";
    }).join("");
  }

  function renderDepartmentChart() {
    var summaries = analytics.departmentSummaries(departments, state.employees);
    var maxCount = Math.max.apply(null, summaries.map(function (summary) {
      return summary.count;
    }).concat([1]));

    if (!summaries.length) {
      elements.departmentChart.innerHTML = panelState("Chưa có phòng ban trong database.");
      return;
    }

    elements.departmentChart.innerHTML = summaries.map(function (summary) {
      var department = summary.department;
      var percent = Math.max(8, Math.round((summary.count / maxCount) * 100));

      return "<article class=\"chart-item\">" +
        "<div class=\"chart-line\">" +
        "<strong>" + helpers.escapeHtml(department.name) + "</strong>" +
        "<span>" + summary.count + " nhân viên · " + summary.avgPerformance + "%</span>" +
        "</div>" +
        "<div class=\"bar\"><span style=\"width:" + percent + "%; background:" + department.color + "\"></span></div>" +
        "</article>";
    }).join("");
  }

  function renderTimeline() {
    elements.timelineList.innerHTML = window.HR_DATA.tasks.map(function (task) {
      return "<article class=\"timeline-item\">" +
        "<time>" + helpers.escapeHtml(task.date) + "</time>" +
        "<div><strong>" + helpers.escapeHtml(task.title) + "</strong>" +
        "<p>" + helpers.escapeHtml(task.description) + "</p></div>" +
        "</article>";
    }).join("");
  }

  function renderServicePulse() {
    var queue = analytics.urgentQueue(state.serviceRequests, 4);

    if (!queue.length) {
      elements.servicePulse.innerHTML = "<article class=\"report-item\"><strong>Không có yêu cầu mở.</strong><p>Service desk đang ổn định.</p></article>";
      return;
    }

    elements.servicePulse.innerHTML = queue.map(function (request) {
      return "<article class=\"report-item\">" +
        "<div class=\"report-line\"><strong>" + helpers.escapeHtml(request.title) + "</strong>" +
        priorityMarkup(request.priority) + "</div>" +
        "<p>" + helpers.escapeHtml(request.category) + " · " + slaText(request) + "</p>" +
        "</article>";
    }).join("");
  }

  function renderServices() {
    renderServiceMetrics();
    renderServiceTable();
    renderServiceCategoryChart();
  }

  function renderServiceMetrics() {
    var totals = analytics.serviceSummary(state.serviceRequests);
    var cards = [
      {
        label: "Yêu cầu mở",
        value: totals.open,
        note: totals.urgentOpen + " yêu cầu khẩn cấp",
        trend: totals.open ? "Cần xử lý" : "Không còn backlog"
      },
      {
        label: "SLA đúng hạn",
        value: totals.slaRate + "%",
        note: totals.overdue + " yêu cầu quá hạn",
        trend: totals.slaRate >= 90 ? "Đạt mục tiêu" : "Cần ưu tiên"
      },
      {
        label: "Đã hoàn tất",
        value: totals.resolved,
        note: "Ticket đã đóng",
        trend: totals.total + " yêu cầu tổng cộng"
      },
      {
        label: "Rủi ro dịch vụ",
        value: totals.overdue,
        note: "Ticket mở quá hạn SLA",
        trend: totals.overdue ? "Cần gỡ nghẽn" : "Không quá hạn"
      }
    ];

    elements.serviceMetricsGrid.innerHTML = cards.map(function (card) {
      return "<article class=\"metric-card\">" +
        "<span>" + helpers.escapeHtml(card.label) + "</span>" +
        "<strong>" + helpers.escapeHtml(card.value) + "</strong>" +
        "<p>" + helpers.escapeHtml(card.note) + "</p>" +
        "<div class=\"metric-trend\">" + helpers.escapeHtml(card.trend) + "</div>" +
        "</article>";
    }).join("");
  }

  function renderServiceTable() {
    var requests = filterServiceRequests();
    var title = document.getElementById("serviceTableTitle");

    title.textContent = "Hiển thị " + requests.length + " / " + state.serviceRequests.length + " yêu cầu";

    if (!requests.length) {
      elements.serviceTable.innerHTML = tableRowState(state.serviceRequests.length
        ? "Không có yêu cầu phù hợp."
        : "Chưa có yêu cầu dịch vụ trong PostgreSQL.");
      return;
    }

    elements.serviceTable.innerHTML = requests.map(function (request) {
      var actions = [];

      if (can("handleServiceRequest")) {
        actions.push("<button class=\"button button-secondary\" type=\"button\" data-request-action=\"advance\" data-id=\"" + request.id + "\">Chuyển</button>");
        actions.push("<button class=\"button button-secondary\" type=\"button\" data-request-action=\"edit\" data-id=\"" + request.id + "\">Sửa</button>");
      }
      if (can("deleteServiceRequest")) {
        actions.push("<button class=\"button button-danger\" type=\"button\" data-request-action=\"delete\" data-id=\"" + request.id + "\">Xóa</button>");
      }
      if (!actions.length) {
        actions.push("<span class=\"sla-meta\">Chỉ xem</span>");
      }

      return "<tr>" +
        "<td><div class=\"request-cell\"><strong>" + helpers.escapeHtml(request.title) + "</strong>" +
        "<span>" + helpers.escapeHtml(request.description) + "</span></div></td>" +
        "<td>" + helpers.escapeHtml(employeeNameById(request.requesterId)) + "</td>" +
        "<td>" + helpers.escapeHtml(request.category) + "<br><span class=\"sla-meta\">" + helpers.escapeHtml(request.owner) + "</span></td>" +
        "<td>" + slaMarkup(request) + "</td>" +
        "<td>" + requestStatusMarkup(request.status) + "<br>" + priorityMarkup(request.priority) + "</td>" +
        "<td><div class=\"row-actions\">" +
        actions.join("") +
        "</div></td>" +
        "</tr>";
    }).join("");
  }

  function renderServiceCategoryChart() {
    var summaries = analytics.serviceByCategory(serviceCategories, state.serviceRequests);

    if (!summaries.length) {
      elements.serviceCategoryChart.innerHTML = panelState("Chưa có nhóm dịch vụ trong database.");
      return;
    }

    elements.serviceCategoryChart.innerHTML = summaries.map(function (summary) {
      return "<article class=\"chart-item\">" +
        "<div class=\"chart-line\"><strong>" + helpers.escapeHtml(summary.category.name) + "</strong>" +
        "<span>" + summary.open + " mở · SLA " + summary.slaRate + "%</span></div>" +
        "<div class=\"bar\"><span style=\"width:" + Math.max(6, summary.slaRate) + "%; background:" + serviceColor(summary.slaRate) + "\"></span></div>" +
        "</article>";
    }).join("");
  }

  function renderEmployees() {
    var employees = filterEmployees();
    elements.tableSummary.textContent = "Hiển thị " + employees.length + " / " + state.employees.length + " nhân viên";

    if (!employees.length) {
      elements.employeeTable.innerHTML = tableRowState(state.employees.length
        ? "Không có nhân viên phù hợp."
        : "Chưa có nhân viên trong PostgreSQL.");
      return;
    }

    elements.employeeTable.innerHTML = employees.map(function (employee) {
      var actions = [
        "<button class=\"button button-secondary\" type=\"button\" data-action=\"view\" data-id=\"" + employee.id + "\">Xem</button>"
      ];

      if (can("manageEmployees")) {
        actions.push("<button class=\"button button-secondary\" type=\"button\" data-action=\"edit\" data-id=\"" + employee.id + "\">Sửa</button>");
        actions.push("<button class=\"button button-danger\" type=\"button\" data-action=\"delete\" data-id=\"" + employee.id + "\">Xóa</button>");
      }

      return "<tr>" +
        "<td>" +
        "<div class=\"employee-cell\">" +
        "<span class=\"avatar\" style=\"background:" + helpers.escapeHtml(employee.color) + "\">" + helpers.escapeHtml(helpers.initials(employee.name)) + "</span>" +
        "<span class=\"employee-meta\"><strong>" + helpers.escapeHtml(employee.name) + "</strong><span>" + helpers.escapeHtml(employee.email) + "</span></span>" +
        "</div>" +
        "</td>" +
        "<td>" + helpers.escapeHtml(employee.department) + "</td>" +
        "<td>" + helpers.escapeHtml(employee.role) + "</td>" +
        "<td>" + performanceMarkup(employee.performance) + "</td>" +
        "<td>" + statusMarkup(employee.status) + "</td>" +
        "<td>" +
        "<div class=\"row-actions\">" +
        actions.join("") +
        "</div>" +
        "</td>" +
        "</tr>";
    }).join("");
  }

  function renderDepartments() {
    var summaries = analytics.departmentSummaries(departments, state.employees);

    if (!summaries.length) {
      elements.departmentCards.innerHTML = panelState("Chưa có phòng ban. Hãy khởi tạo danh mục nền trước.");
      return;
    }

    elements.departmentCards.innerHTML = summaries.map(function (summary) {
      var department = summary.department;

      return "<article class=\"department-card\">" +
        "<header><div><p class=\"eyebrow\">Trưởng bộ phận</p><h3>" + helpers.escapeHtml(department.name) + "</h3></div>" +
        "<span class=\"avatar\" style=\"background:" + helpers.escapeHtml(department.color) + "\">" + helpers.escapeHtml(helpers.initials(department.name)) + "</span></header>" +
        "<p>" + helpers.escapeHtml(department.description) + "</p>" +
        "<p><strong>" + helpers.escapeHtml(department.owner) + "</strong></p>" +
        "<div class=\"department-stats\">" +
        "<span><strong>" + summary.count + "</strong>Nhân viên</span>" +
        "<span><strong>" + summary.avgPerformance + "%</strong>Hiệu suất</span>" +
        "<span><strong>" + helpers.formatCurrency(summary.payroll) + "</strong>Quỹ lương</span>" +
        "</div>" +
        "</article>";
    }).join("");
  }

  function renderCatalogAdmin() {
    if (!departments.length) {
      elements.departmentAdminTable.innerHTML = "<tr><td colspan=\"4\" class=\"empty-state\">Chưa có phòng ban.</td></tr>";
    } else if (!can("manageCatalog")) {
      elements.departmentAdminTable.innerHTML = "<tr><td colspan=\"4\" class=\"empty-state\">Đăng nhập bằng admin hoặc HR để quản lý phòng ban.</td></tr>";
    } else {
      elements.departmentAdminTable.innerHTML = departments.map(function (department) {
        return "<tr>" +
          "<td><div class=\"catalog-cell\"><span class=\"color-swatch\" style=\"background:" + helpers.escapeHtml(department.color) + "\"></span>" +
          "<div><strong>" + helpers.escapeHtml(department.name) + "</strong><br><span class=\"sla-meta\">" + helpers.escapeHtml(department.description) + "</span></div></div></td>" +
          "<td>" + helpers.escapeHtml(department.owner) + "</td>" +
          "<td>" + Number(department.employeeCount || 0) + "</td>" +
          "<td><div class=\"row-actions\">" +
          "<button class=\"button button-secondary\" type=\"button\" data-department-action=\"edit\" data-id=\"" + department.id + "\">Sửa</button>" +
          "<button class=\"button button-danger\" type=\"button\" data-department-action=\"delete\" data-id=\"" + department.id + "\">Xóa</button>" +
          "</div></td>" +
          "</tr>";
      }).join("");
    }

    if (!serviceCategories.length) {
      elements.serviceCategoryAdminTable.innerHTML = "<tr><td colspan=\"5\" class=\"empty-state\">Chưa có nhóm dịch vụ.</td></tr>";
      return;
    }

    if (!can("manageCatalog")) {
      elements.serviceCategoryAdminTable.innerHTML = "<tr><td colspan=\"5\" class=\"empty-state\">Đăng nhập bằng admin hoặc HR để quản lý nhóm dịch vụ.</td></tr>";
      return;
    }

    elements.serviceCategoryAdminTable.innerHTML = serviceCategories.map(function (category) {
      return "<tr>" +
        "<td><div class=\"catalog-cell\"><span class=\"color-swatch\" style=\"background:" + helpers.escapeHtml(category.color || "#0f766e") + "\"></span>" +
        "<strong>" + helpers.escapeHtml(category.name) + "</strong></div></td>" +
        "<td>" + helpers.escapeHtml(category.owner) + "</td>" +
        "<td>" + Number(category.slaHours || 0) + " giờ</td>" +
        "<td>" + Number(category.requestCount || 0) + "</td>" +
        "<td><div class=\"row-actions\">" +
        "<button class=\"button button-secondary\" type=\"button\" data-category-action=\"edit\" data-id=\"" + category.id + "\">Sửa</button>" +
        "<button class=\"button button-danger\" type=\"button\" data-category-action=\"delete\" data-id=\"" + category.id + "\">Xóa</button>" +
        "</div></td>" +
        "</tr>";
    }).join("");
  }

  function renderReports() {
    var summaries = analytics.departmentSummaries(departments, state.employees);

    if (!summaries.length) {
      elements.payrollReport.innerHTML = panelState("Chưa có dữ liệu phòng ban.");
      elements.talentReport.innerHTML = panelState("Chưa có dữ liệu nhân viên.");
    }

    if (summaries.length) {
      elements.payrollReport.innerHTML = summaries.map(function (summary) {
        var department = summary.department;
        return "<article class=\"report-item\">" +
          "<div class=\"report-line\"><strong>" + helpers.escapeHtml(department.name) + "</strong><span>" + helpers.formatCurrency(summary.payroll) + "</span></div>" +
          "<p>" + summary.count + " nhân viên, " + summary.active + " đang làm.</p>" +
          "</article>";
      }).join("");
    }

    if (state.employees.length) {
      elements.talentReport.innerHTML = analytics.topPerformers(state.employees, 4)
        .map(function (employee) {
          return "<article class=\"report-item\">" +
            "<div class=\"report-line\"><strong>" + helpers.escapeHtml(employee.name) + "</strong><span>" + employee.performance + "%</span></div>" +
            "<p>" + helpers.escapeHtml(employee.department) + " · " + helpers.escapeHtml(employee.role) + "</p>" +
            "</article>";
        }).join("");
    } else {
      elements.talentReport.innerHTML = panelState("Chưa có dữ liệu nhân viên.");
    }

    if (!serviceCategories.length) {
      elements.serviceReport.innerHTML = panelState("Chưa có nhóm dịch vụ.");
      return;
    }

    elements.serviceReport.innerHTML = analytics.serviceByCategory(serviceCategories, state.serviceRequests)
      .map(function (summary) {
        return "<article class=\"report-item\">" +
          "<div class=\"report-line\"><strong>" + helpers.escapeHtml(summary.category.name) + "</strong><span>" + summary.slaRate + "% SLA</span></div>" +
          "<p>" + summary.open + " yêu cầu mở, " + summary.overdue + " quá hạn.</p>" +
          "</article>";
      }).join("");
  }

  function filterEmployees() {
    var query = helpers.normalize(state.query);
    return state.employees
      .filter(function (employee) {
        var haystack = helpers.normalize([
          employee.name,
          employee.email,
          employee.phone,
          employee.department,
          employee.role
        ].join(" "));

        var matchesQuery = !query || haystack.indexOf(query) >= 0;
        var matchesDepartment = state.department === "all" || employee.department === state.department;
        var matchesStatus = state.status === "all" || employee.status === state.status;
        return matchesQuery && matchesDepartment && matchesStatus;
      })
      .sort(sortEmployees);
  }

  function filterServiceRequests() {
    var query = helpers.normalize(state.query);

    return state.serviceRequests
      .filter(function (request) {
        var haystack = helpers.normalize([
          request.id,
          request.title,
          request.description,
          request.category,
          request.owner,
          employeeNameById(request.requesterId)
        ].join(" "));
        var matchesQuery = !query || haystack.indexOf(query) >= 0;
        var matchesCategory = state.serviceCategory === "all" || request.category === state.serviceCategory;
        var matchesStatus = state.serviceStatus === "all" || request.status === state.serviceStatus;
        var matchesPriority = state.servicePriority === "all" || request.priority === state.servicePriority;
        return matchesQuery && matchesCategory && matchesStatus && matchesPriority;
      })
      .sort(sortServiceRequests);
  }

  function sortEmployees(a, b) {
    if (state.sortBy === "performance") {
      return b.performance - a.performance;
    }
    if (state.sortBy === "startDate") {
      return helpers.parseDateInput(b.startDate) - helpers.parseDateInput(a.startDate);
    }
    return String(a[state.sortBy] || "").localeCompare(String(b[state.sortBy] || ""), "vi");
  }

  function sortServiceRequests(a, b) {
    var weight = {
      urgent: 3,
      high: 2,
      normal: 1
    };
    var aResolved = a.status === "resolved";
    var bResolved = b.status === "resolved";

    if (analytics.isRequestOverdue(a) !== analytics.isRequestOverdue(b)) {
      return analytics.isRequestOverdue(a) ? -1 : 1;
    }
    if (aResolved !== bResolved) {
      return aResolved ? 1 : -1;
    }
    if (weight[b.priority] !== weight[a.priority]) {
      return weight[b.priority] - weight[a.priority];
    }
    return helpers.parseDateInput(a.dueDate) - helpers.parseDateInput(b.dueDate);
  }

  function performanceMarkup(value) {
    var safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    return "<div class=\"progress\" aria-label=\"Hiệu suất " + safeValue + "%\">" +
      "<strong>" + safeValue + "%</strong>" +
      "<div class=\"progress-track\"><span class=\"progress-fill\" style=\"width:" + safeValue + "%\"></span></div>" +
      "</div>";
  }

  function statusMarkup(status) {
    return "<span class=\"status-pill status-" + helpers.escapeHtml(status) + "\">" +
      helpers.escapeHtml(helpers.statusLabel(status)) +
      "</span>";
  }

  function requestStatusMarkup(status) {
    return "<span class=\"status-pill status-" + helpers.escapeHtml(status) + "\">" +
      helpers.escapeHtml(helpers.requestStatusLabel(status)) +
      "</span>";
  }

  function priorityMarkup(priority) {
    return "<span class=\"status-pill priority-" + helpers.escapeHtml(priority) + "\">" +
      helpers.escapeHtml(helpers.priorityLabel(priority)) +
      "</span>";
  }

  function slaMarkup(request) {
    var overdue = analytics.isRequestOverdue(request);
    var className = overdue ? "sla-meta sla-overdue" : "sla-meta";
    return "<div><strong>" + helpers.escapeHtml(helpers.formatDate(request.dueDate)) + "</strong>" +
      "<div class=\"" + className + "\">" + slaText(request) + "</div></div>";
  }

  function slaText(request) {
    return analytics.isRequestOverdue(request) ? "Quá hạn SLA" : "Trong hạn SLA";
  }

  function serviceColor(slaRate) {
    if (slaRate >= 90) {
      return "var(--success)";
    }
    if (slaRate >= 70) {
      return "var(--amber)";
    }
    return "var(--rose)";
  }

  function employeeNameById(id) {
    var employee = state.employees.find(function (item) {
      return item.id === id;
    });
    return employee ? employee.name : "Không rõ";
  }

  function categoryByName(name) {
    return serviceCategories.find(function (category) {
      return category.name === name;
    }) || serviceCategories[0];
  }

  function fillServiceOwnerFromCategory(categoryName) {
    var category = categoryByName(categoryName);
    var createdAt = helpers.parseDateInput(document.getElementById("requestCreatedAt").value);

    if (!category) {
      document.getElementById("requestOwner").value = "";
      return;
    }

    document.getElementById("requestOwner").value = category.owner;
    if (!document.getElementById("requestId").value && !Number.isNaN(createdAt.getTime())) {
      document.getElementById("requestDueDate").value = toInputDate(addDays(createdAt, Math.ceil(category.slaHours / 24)));
    }
  }

  function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function toInputDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function openLoginDialog() {
    elements.loginForm.reset();
    elements.loginFormAlert.hidden = true;
    elements.loginFormAlert.textContent = "";

    if (typeof elements.loginDialog.showModal === "function") {
      elements.loginDialog.showModal();
    } else {
      elements.loginDialog.setAttribute("open", "");
    }
  }

  function closeLoginDialog() {
    if (elements.loginDialog.open) {
      elements.loginDialog.close();
    } else {
      elements.loginDialog.removeAttribute("open");
    }
  }

  async function login(event) {
    event.preventDefault();
    var formData = new FormData(elements.loginForm);

    setFormBusy(elements.loginForm, true);

    try {
      var session = await window.HR_STORE.login({
        email: String(formData.get("email")).trim(),
        password: String(formData.get("password"))
      });

      window.HR_STORE.setAuthToken(session.token);
      state.authUser = session.user;
      closeLoginDialog();
      applyAuthState();
      await loadBackendData();
      showToast("Đã đăng nhập.");
    } catch (error) {
      elements.loginFormAlert.textContent = error.statusCode === 429
        ? "Đăng nhập quá nhiều lần. Vui lòng thử lại sau."
        : "Email hoặc mật khẩu không đúng.";
      elements.loginFormAlert.hidden = false;
      showToast(elements.loginFormAlert.textContent);
    } finally {
      setFormBusy(elements.loginForm, false);
    }
  }

  async function logout() {
    try {
      if (state.authUser) {
        await window.HR_STORE.logout();
      }
    } catch (error) {
      // Local logout still clears an expired or revoked token.
    } finally {
      window.HR_STORE.setAuthToken("");
      state.authUser = null;
      renderSignedOutState();
      showToast("Đã đăng xuất.");
    }
  }

  function openEmployeeDialog(id) {
    var employee = state.employees.find(function (item) {
      return item.id === id;
    });

    if (!can("manageEmployees")) {
      showToast("Bạn cần đăng nhập bằng admin hoặc HR để quản lý nhân viên.");
      return;
    }

    if (!employee && !departments.length) {
      showToast("Chưa có phòng ban trong database. Hãy khởi tạo danh mục nền trước.");
      return;
    }

    elements.form.reset();
    clearFormErrors();
    document.getElementById("employeeId").value = employee ? employee.id : "";
    elements.dialogTitle.textContent = employee ? "Cập nhật nhân viên" : "Thêm nhân viên";
    document.getElementById("employeePerformance").value = employee ? employee.performance : 80;
    elements.performanceOutput.textContent = employee ? employee.performance : 80;

    if (employee) {
      document.getElementById("employeeName").value = employee.name;
      document.getElementById("employeeEmail").value = employee.email;
      document.getElementById("employeePhone").value = employee.phone;
      document.getElementById("employeeDepartment").value = employee.department;
      document.getElementById("employeeRole").value = employee.role;
      document.getElementById("employeeSalary").value = employee.salary;
      document.getElementById("employeeStartDate").value = employee.startDate;
      document.getElementById("employeeStatus").value = employee.status;
    } else {
      document.getElementById("employeeStartDate").valueAsDate = new Date();
      document.getElementById("employeeDepartment").value = departments[0] ? departments[0].name : "";
    }

    if (typeof elements.dialog.showModal === "function") {
      elements.dialog.showModal();
    } else {
      elements.dialog.setAttribute("open", "");
    }
  }

  function closeEmployeeDialog() {
    if (elements.dialog.open) {
      elements.dialog.close();
    } else {
      elements.dialog.removeAttribute("open");
    }
  }

  function openRequestDialog(id) {
    var request = state.serviceRequests.find(function (item) {
      return item.id === id;
    });
    var today = new Date();

    if (request && !can("handleServiceRequest")) {
      showToast("Bạn không có quyền xử lý yêu cầu này.");
      return;
    }

    if (!request && !can("createServiceRequest")) {
      showToast("Bạn cần đăng nhập để tạo yêu cầu dịch vụ.");
      return;
    }

    if (!request && (!state.employees.length || !serviceCategories.length)) {
      showToast("Cần có nhân viên và nhóm dịch vụ trước khi tạo yêu cầu.");
      return;
    }

    elements.requestForm.reset();
    clearRequestFormErrors();
    document.getElementById("requestId").value = request ? request.id : "";
    elements.requestDialogTitle.textContent = request ? "Cập nhật yêu cầu" : "Tạo yêu cầu";

    if (request) {
      document.getElementById("requestTitle").value = request.title;
      document.getElementById("requesterId").value = request.requesterId;
      document.getElementById("requestCategory").value = request.category;
      document.getElementById("requestOwner").value = request.owner;
      document.getElementById("requestPriority").value = request.priority;
      document.getElementById("requestStatus").value = request.status;
      document.getElementById("requestCreatedAt").value = request.createdAt;
      document.getElementById("requestDueDate").value = request.dueDate;
      document.getElementById("requestDescription").value = request.description;
    } else {
      var requesters = selectableRequesters();
      document.getElementById("requesterId").value = requesters[0] ? requesters[0].id : "";
      document.getElementById("requestCategory").value = serviceCategories[0] ? serviceCategories[0].name : "";
      document.getElementById("requestCreatedAt").value = toInputDate(today);
      document.getElementById("requestStatus").value = "open";
      document.getElementById("requestPriority").value = "normal";
      if (serviceCategories[0]) {
        fillServiceOwnerFromCategory(serviceCategories[0].name);
      }
    }

    if (typeof elements.requestDialog.showModal === "function") {
      elements.requestDialog.showModal();
    } else {
      elements.requestDialog.setAttribute("open", "");
    }
  }

  function closeRequestDialog() {
    if (elements.requestDialog.open) {
      elements.requestDialog.close();
    } else {
      elements.requestDialog.removeAttribute("open");
    }
  }

  function openDepartmentDialog(id) {
    var department = departments.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!can("manageCatalog")) {
      showToast("Bạn cần đăng nhập bằng admin hoặc HR để quản lý danh mục.");
      return;
    }

    elements.departmentForm.reset();
    clearCatalogFormErrors(elements.departmentForm, elements.departmentFormAlert);
    document.getElementById("departmentId").value = department ? department.id : "";
    elements.departmentDialogTitle.textContent = department ? "Cập nhật phòng ban" : "Thêm phòng ban";
    document.getElementById("departmentColor").value = department ? department.color : "#0f766e";

    if (department) {
      document.getElementById("departmentName").value = department.name;
      document.getElementById("departmentOwner").value = department.owner;
      document.getElementById("departmentDescription").value = department.description;
    }

    if (typeof elements.departmentDialog.showModal === "function") {
      elements.departmentDialog.showModal();
    } else {
      elements.departmentDialog.setAttribute("open", "");
    }
  }

  function closeDepartmentDialog() {
    if (elements.departmentDialog.open) {
      elements.departmentDialog.close();
    } else {
      elements.departmentDialog.removeAttribute("open");
    }
  }

  function openCategoryDialog(id) {
    var category = serviceCategories.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!can("manageCatalog")) {
      showToast("Bạn cần đăng nhập bằng admin hoặc HR để quản lý danh mục.");
      return;
    }

    elements.categoryForm.reset();
    clearCatalogFormErrors(elements.categoryForm, elements.categoryFormAlert);
    document.getElementById("categoryId").value = category ? category.id : "";
    elements.categoryDialogTitle.textContent = category ? "Cập nhật nhóm dịch vụ" : "Thêm nhóm dịch vụ";
    document.getElementById("categoryColor").value = category ? category.color || "#0f766e" : "#0f766e";
    document.getElementById("categorySlaHours").value = category ? category.slaHours : 24;

    if (category) {
      document.getElementById("categoryName").value = category.name;
      document.getElementById("categoryOwner").value = category.owner;
    }

    if (typeof elements.categoryDialog.showModal === "function") {
      elements.categoryDialog.showModal();
    } else {
      elements.categoryDialog.setAttribute("open", "");
    }
  }

  function closeCategoryDialog() {
    if (elements.categoryDialog.open) {
      elements.categoryDialog.close();
    } else {
      elements.categoryDialog.removeAttribute("open");
    }
  }

  function clearFormErrors() {
    elements.form.querySelectorAll("input, select").forEach(function (field) {
      field.setCustomValidity("");
      field.removeAttribute("aria-invalid");
    });
    elements.formAlert.hidden = true;
    elements.formAlert.textContent = "";
  }

  function clearFieldError(field) {
    if (!field || typeof field.setCustomValidity !== "function") {
      return;
    }
    field.setCustomValidity("");
    field.removeAttribute("aria-invalid");
    elements.formAlert.hidden = true;
  }

  function applyFormErrors(errors) {
    errors.forEach(function (error) {
      var field = document.getElementById(error.field);
      if (!field) {
        return;
      }
      field.setCustomValidity(error.message);
      field.setAttribute("aria-invalid", "true");
    });

    elements.formAlert.textContent = errors[0].message;
    elements.formAlert.hidden = false;
    elements.form.reportValidity();
    showToast(errors[0].message);
  }

  function clearRequestFormErrors() {
    elements.requestForm.querySelectorAll("input, select").forEach(function (field) {
      field.setCustomValidity("");
      field.removeAttribute("aria-invalid");
    });
    elements.requestFormAlert.hidden = true;
    elements.requestFormAlert.textContent = "";
  }

  function clearRequestFieldError(field) {
    if (!field || typeof field.setCustomValidity !== "function") {
      return;
    }
    field.setCustomValidity("");
    field.removeAttribute("aria-invalid");
    elements.requestFormAlert.hidden = true;
  }

  function applyRequestFormErrors(errors) {
    errors.forEach(function (error) {
      var field = document.getElementById(error.field);
      if (!field) {
        return;
      }
      field.setCustomValidity(error.message);
      field.setAttribute("aria-invalid", "true");
    });

    elements.requestFormAlert.textContent = errors[0].message;
    elements.requestFormAlert.hidden = false;
    elements.requestForm.reportValidity();
    showToast(errors[0].message);
  }

  function clearCatalogFormErrors(form, alertElement) {
    form.querySelectorAll("input, select").forEach(function (field) {
      field.setCustomValidity("");
      field.removeAttribute("aria-invalid");
    });
    alertElement.hidden = true;
    alertElement.textContent = "";
  }

  function clearCatalogFieldError(field, alertElement) {
    if (!field || typeof field.setCustomValidity !== "function") {
      return;
    }
    field.setCustomValidity("");
    field.removeAttribute("aria-invalid");
    alertElement.hidden = true;
  }

  function applyCatalogFormErrors(errors, form, alertElement) {
    errors.forEach(function (error) {
      var field = document.getElementById(error.field);
      if (!field) {
        return;
      }
      field.setCustomValidity(error.message);
      field.setAttribute("aria-invalid", "true");
    });

    alertElement.textContent = errors[0].message;
    alertElement.hidden = false;
    form.reportValidity();
    showToast(errors[0].message);
  }

  function mapApiErrors(error, fieldMap) {
    var details = error && error.details && error.details.length
      ? error.details
      : [{ message: apiErrorMessage(error) }];

    return details.map(function (detail) {
      return {
        field: fieldMap[detail.field] || detail.field || "",
        message: detail.message || apiErrorMessage(error)
      };
    });
  }

  function applyApiErrors(error, fieldMap, applyErrors, alertElement) {
    var errors = mapApiErrors(error, fieldMap);
    var hasFieldError = errors.some(function (item) {
      return Boolean(item.field && document.getElementById(item.field));
    });

    if (hasFieldError) {
      applyErrors(errors);
      return;
    }

    alertElement.textContent = errors[0].message;
    alertElement.hidden = false;
    showToast(errors[0].message);
  }

  function setFormBusy(form, isBusy) {
    form.querySelectorAll("button, input, select").forEach(function (field) {
      field.disabled = isBusy;
    });
  }

  async function saveDepartment(event) {
    event.preventDefault();
    var formData = new FormData(elements.departmentForm);
    var id = formData.get("id");
    var fieldMap = {
      name: "departmentName",
      owner: "departmentOwner",
      color: "departmentColor",
      description: "departmentDescription"
    };
    var department = {
      name: String(formData.get("name")).trim(),
      owner: String(formData.get("owner")).trim(),
      color: formData.get("color"),
      description: String(formData.get("description")).trim()
    };
    var errors = validators.validateDepartment(department);

    if (errors.length) {
      applyCatalogFormErrors(errors, elements.departmentForm, elements.departmentFormAlert);
      return;
    }

    setFormBusy(elements.departmentForm, true);

    try {
      if (id) {
        await window.HR_STORE.updateDepartment(id, department);
        showToast("Đã cập nhật phòng ban.");
      } else {
        await window.HR_STORE.createDepartment(department);
        showToast("Đã thêm phòng ban.");
      }
      closeDepartmentDialog();
      await loadBackendData();
    } catch (error) {
      setFormBusy(elements.departmentForm, false);
      applyApiErrors(error, fieldMap, function (items) {
        applyCatalogFormErrors(items, elements.departmentForm, elements.departmentFormAlert);
      }, elements.departmentFormAlert);
    } finally {
      setFormBusy(elements.departmentForm, false);
    }
  }

  async function saveServiceCategory(event) {
    event.preventDefault();
    var formData = new FormData(elements.categoryForm);
    var id = formData.get("id");
    var fieldMap = {
      name: "categoryName",
      owner: "categoryOwner",
      slaHours: "categorySlaHours",
      color: "categoryColor"
    };
    var category = {
      name: String(formData.get("name")).trim(),
      owner: String(formData.get("owner")).trim(),
      slaHours: Number(formData.get("slaHours")),
      color: formData.get("color")
    };
    var errors = validators.validateServiceCategory(category);

    if (errors.length) {
      applyCatalogFormErrors(errors, elements.categoryForm, elements.categoryFormAlert);
      return;
    }

    setFormBusy(elements.categoryForm, true);

    try {
      if (id) {
        await window.HR_STORE.updateServiceCategory(id, category);
        showToast("Đã cập nhật nhóm dịch vụ.");
      } else {
        await window.HR_STORE.createServiceCategory(category);
        showToast("Đã thêm nhóm dịch vụ.");
      }
      closeCategoryDialog();
      await loadBackendData();
    } catch (error) {
      setFormBusy(elements.categoryForm, false);
      applyApiErrors(error, fieldMap, function (items) {
        applyCatalogFormErrors(items, elements.categoryForm, elements.categoryFormAlert);
      }, elements.categoryFormAlert);
    } finally {
      setFormBusy(elements.categoryForm, false);
    }
  }

  async function saveEmployee(event) {
    event.preventDefault();
    var formData = new FormData(elements.form);
    var id = formData.get("id");
    var department = departments.find(function (item) {
      return item.name === formData.get("department");
    });
    var employeeFieldMap = {
      name: "employeeName",
      email: "employeeEmail",
      phone: "employeePhone",
      department: "employeeDepartment",
      role: "employeeRole",
      salary: "employeeSalary",
      startDate: "employeeStartDate",
      status: "employeeStatus",
      performance: "employeePerformance"
    };

    var employee = {
      id: id || undefined,
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      phone: String(formData.get("phone")).trim(),
      department: formData.get("department"),
      role: String(formData.get("role")).trim(),
      salary: Number(formData.get("salary")),
      startDate: formData.get("startDate"),
      status: formData.get("status"),
      performance: Number(formData.get("performance")),
      color: department ? department.color : ""
    };
    var errors = validators.validateEmployee(employee, state.employees, departments);

    if (errors.length) {
      applyFormErrors(errors);
      return;
    }

    var index = state.employees.findIndex(function (item) {
      return item.id === id;
    });

    setFormBusy(elements.form, true);

    try {
      var savedEmployee = id
        ? await window.HR_STORE.updateEmployee(id, employee)
        : await window.HR_STORE.createEmployee(employee);

      if (index >= 0) {
        state.employees.splice(index, 1, savedEmployee);
        showToast("Đã cập nhật hồ sơ nhân viên.");
      } else {
        state.employees.unshift(savedEmployee);
        showToast("Đã thêm nhân viên mới.");
      }

      persistAndRender(false);
      closeEmployeeDialog();
    } catch (error) {
      setFormBusy(elements.form, false);
      applyApiErrors(error, employeeFieldMap, applyFormErrors, elements.formAlert);
    } finally {
      setFormBusy(elements.form, false);
    }
  }

  async function saveServiceRequest(event) {
    event.preventDefault();
    var formData = new FormData(elements.requestForm);
    var id = formData.get("id");
    var category = serviceCategories.find(function (item) {
      return item.name === formData.get("category");
    });
    var requestFieldMap = {
      title: "requestTitle",
      requesterId: "requesterId",
      category: "requestCategory",
      owner: "requestOwner",
      priority: "requestPriority",
      status: "requestStatus",
      createdAt: "requestCreatedAt",
      dueDate: "requestDueDate",
      description: "requestDescription"
    };
    var request = {
      id: id || undefined,
      title: String(formData.get("title")).trim(),
      requesterId: formData.get("requesterId"),
      category: formData.get("category"),
      owner: String(formData.get("owner")).trim() || (category ? category.owner : ""),
      priority: formData.get("priority"),
      status: formData.get("status"),
      createdAt: formData.get("createdAt"),
      dueDate: formData.get("dueDate"),
      description: String(formData.get("description")).trim()
    };
    var errors = validators.validateServiceRequest(request, state.employees, serviceCategories);
    var index = state.serviceRequests.findIndex(function (item) {
      return item.id === id;
    });

    if (errors.length) {
      applyRequestFormErrors(errors);
      return;
    }

    setFormBusy(elements.requestForm, true);

    try {
      var savedRequest = id
        ? await window.HR_STORE.updateServiceRequest(id, request)
        : await window.HR_STORE.createServiceRequest(request);

      if (index >= 0) {
        state.serviceRequests.splice(index, 1, savedRequest);
        showToast("Đã cập nhật yêu cầu dịch vụ.");
      } else {
        state.serviceRequests.unshift(savedRequest);
        showToast("Đã tạo yêu cầu dịch vụ mới.");
      }

      persistServiceAndRender(false);
      closeRequestDialog();
    } catch (error) {
      setFormBusy(elements.requestForm, false);
      applyApiErrors(error, requestFieldMap, applyRequestFormErrors, elements.requestFormAlert);
    } finally {
      setFormBusy(elements.requestForm, false);
    }
  }

  async function deleteDepartment(id) {
    var department = departments.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!department) {
      return;
    }

    if (!window.confirm("Xóa phòng ban " + department.name + "?")) {
      return;
    }

    try {
      await window.HR_STORE.deleteDepartment(id);
      showToast("Đã xóa phòng ban.");
      await loadBackendData();
    } catch (error) {
      if (error.statusCode === 409) {
        showToast("Không thể xóa phòng ban đang có nhân viên.");
        return;
      }
      showToast(apiErrorMessage(error));
    }
  }

  async function deleteServiceCategory(id) {
    var category = serviceCategories.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!category) {
      return;
    }

    if (!window.confirm("Xóa nhóm dịch vụ " + category.name + "?")) {
      return;
    }

    try {
      await window.HR_STORE.deleteServiceCategory(id);
      showToast("Đã xóa nhóm dịch vụ.");
      await loadBackendData();
    } catch (error) {
      if (error.statusCode === 409) {
        showToast("Không thể xóa nhóm dịch vụ đang có ticket.");
        return;
      }
      showToast(apiErrorMessage(error));
    }
  }

  async function deleteEmployee(id) {
    var index = state.employees.findIndex(function (item) {
      return item.id === id;
    });
    if (index < 0) {
      return;
    }

    var employee = state.employees[index];

    try {
      await window.HR_STORE.deleteEmployee(id);
      state.lastDeleted = {
        employee: employee,
        index: index
      };
      window.clearTimeout(state.undoTimer);
      state.employees.splice(index, 1);
      persistAndRender(false);
      closeDrawer();
      showToast("Đã xóa hồ sơ của " + employee.name + ".", {
        actionLabel: "Hoàn tác",
        action: undoDelete,
        duration: 6500
      });
      state.undoTimer = window.setTimeout(function () {
        state.lastDeleted = null;
      }, 6500);
    } catch (error) {
      showToast(apiErrorMessage(error));
    }
  }

  async function undoDelete() {
    if (!state.lastDeleted) {
      return;
    }

    if (validators.validateEmployee(state.lastDeleted.employee, state.employees, departments).length) {
      state.lastDeleted = null;
      window.clearTimeout(state.undoTimer);
      showToast("Không thể hoàn tác vì dữ liệu đã thay đổi.");
      return;
    }

    try {
      var restoredEmployee = await window.HR_STORE.restoreEmployee(state.lastDeleted.employee.id);
      var targetIndex = Math.min(state.lastDeleted.index, state.employees.length);
      state.employees.splice(targetIndex, 0, restoredEmployee);
      state.lastDeleted = null;
      window.clearTimeout(state.undoTimer);
      persistAndRender(false);
      showToast("Đã hoàn tác thao tác xóa.");
    } catch (error) {
      state.lastDeleted = null;
      window.clearTimeout(state.undoTimer);
      showToast(apiErrorMessage(error));
    }
  }

  async function advanceServiceRequest(id) {
    var index = state.serviceRequests.findIndex(function (item) {
      return item.id === id;
    });

    if (index < 0) {
      return;
    }

    try {
      var request = await window.HR_STORE.advanceServiceRequest(id);
      state.serviceRequests.splice(index, 1, request);
      persistServiceAndRender(false);
      showToast("Đã chuyển trạng thái sang " + helpers.requestStatusLabel(request.status) + ".");
    } catch (error) {
      showToast(apiErrorMessage(error));
    }
  }

  async function deleteServiceRequest(id) {
    var request = state.serviceRequests.find(function (item) {
      return item.id === id;
    });

    if (!request) {
      return;
    }

    if (!window.confirm("Xóa yêu cầu " + request.id + "?")) {
      return;
    }

    try {
      await window.HR_STORE.deleteServiceRequest(id);
      state.serviceRequests = state.serviceRequests.filter(function (item) {
        return item.id !== id;
      });
      persistServiceAndRender(false);
      showToast("Đã xóa yêu cầu dịch vụ.");
    } catch (error) {
      showToast(apiErrorMessage(error));
    }
  }

  function openDrawer(id) {
    var employee = state.employees.find(function (item) {
      return item.id === id;
    });
    if (!employee) {
      return;
    }

    elements.drawerName.textContent = employee.name;
    elements.drawerContent.innerHTML =
      "<div class=\"drawer-profile\">" +
      "<span class=\"avatar\" style=\"background:" + helpers.escapeHtml(employee.color) + "\">" + helpers.escapeHtml(helpers.initials(employee.name)) + "</span>" +
      "<div><strong>" + helpers.escapeHtml(employee.role) + "</strong><p>" + helpers.escapeHtml(employee.department) + "</p></div>" +
      "</div>" +
      "<div class=\"drawer-list\">" +
      drawerItem("Email", employee.email) +
      drawerItem("Điện thoại", employee.phone) +
      drawerItem("Ngày vào làm", helpers.formatDate(employee.startDate)) +
      drawerItem("Lương tháng", helpers.formatCurrency(employee.salary)) +
      drawerItem("Trạng thái", helpers.statusLabel(employee.status)) +
      drawerItem("Hiệu suất", employee.performance + "%") +
      "</div>";

    elements.drawer.classList.add("is-open");
    elements.drawer.setAttribute("aria-hidden", "false");
  }

  function drawerItem(label, value) {
    return "<div class=\"drawer-item\"><span>" + helpers.escapeHtml(label) + "</span><strong>" + helpers.escapeHtml(value) + "</strong></div>";
  }

  function closeDrawer() {
    elements.drawer.classList.remove("is-open");
    elements.drawer.setAttribute("aria-hidden", "true");
  }

  async function resetData() {
    await loadBackendData();
    closeDrawer();
    if (!state.apiError) {
      showToast("Đã tải lại dữ liệu từ backend.");
    }
  }

  function persistAndRender() {
    populateServiceOptions();
    render();
  }

  function persistServiceAndRender() {
    renderServicePulse();
    renderServices();
    renderReports();
  }

  function exportCsv() {
    var employees = filterEmployees();

    if (!employees.length) {
      showToast("Không có nhân viên phù hợp để xuất CSV.");
      return;
    }

    var rows = [
      ["ID", "Ho ten", "Email", "Dien thoai", "Phong ban", "Chuc vu", "Luong", "Ngay vao", "Trang thai", "Hieu suat"]
    ].concat(employees.map(function (employee) {
      return [
        employee.id,
        employee.name,
        employee.email,
        employee.phone,
        employee.department,
        employee.role,
        employee.salary,
        employee.startDate,
        helpers.statusLabel(employee.status),
        employee.performance
      ];
    }));

    var csv = rows.map(function (row) {
      return row.map(csvCell).join(",");
    }).join("\n");

    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "danh-sach-nhan-vien-da-loc.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Đã xuất " + employees.length + " hồ sơ CSV.");
  }

  function exportServiceCsv() {
    var requests = filterServiceRequests();

    if (!requests.length) {
      showToast("Không có yêu cầu phù hợp để xuất CSV.");
      return;
    }

    var rows = [
      ["ID", "Tieu de", "Nguoi gui", "Nhom dich vu", "Phu trach", "Uu tien", "Trang thai", "Ngay tao", "Han xu ly", "SLA"]
    ].concat(requests.map(function (request) {
      return [
        request.id,
        request.title,
        employeeNameById(request.requesterId),
        request.category,
        request.owner,
        helpers.priorityLabel(request.priority),
        helpers.requestStatusLabel(request.status),
        request.createdAt,
        request.dueDate,
        slaText(request)
      ];
    }));

    var csv = rows.map(function (row) {
      return row.map(csvCell).join(",");
    }).join("\n");
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "yeu-cau-dich-vu-da-loc.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Đã xuất " + requests.length + " yêu cầu CSV.");
  }

  function csvCell(value) {
    return "\"" + String(value == null ? "" : value).replace(/"/g, "\"\"") + "\"";
  }

  function handleShortcuts(event) {
    if (event.key === "Escape") {
      closeDrawer();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && state.lastDeleted) {
      event.preventDefault();
      undoDelete();
    }
  }

  function showToast(message, options) {
    var actionButton;
    var text = document.createElement("span");
    var settings = options || {};

    elements.toast.innerHTML = "";
    text.textContent = message;
    elements.toast.appendChild(text);

    if (settings.actionLabel && typeof settings.action === "function") {
      actionButton = document.createElement("button");
      actionButton.type = "button";
      actionButton.textContent = settings.actionLabel;
      actionButton.addEventListener("click", settings.action);
      elements.toast.appendChild(actionButton);
    }

    elements.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      elements.toast.classList.remove("is-visible");
    }, settings.duration || 2600);
  }

  document.addEventListener("DOMContentLoaded", boot);
}());

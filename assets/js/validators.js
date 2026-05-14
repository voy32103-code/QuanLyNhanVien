(function () {
  "use strict";

  var helpers = window.HR_HELPERS;
  var allowedStatuses = ["active", "probation", "leave"];
  var allowedRequestStatuses = ["open", "inProgress", "waiting", "resolved"];
  var allowedPriorities = ["urgent", "high", "normal"];
  var colorPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

  function phoneKey(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function isDuplicate(employees, id, predicate) {
    return employees.some(function (employee) {
      return employee.id !== id && predicate(employee);
    });
  }

  function validateEmployee(employee, employees, departments) {
    var errors = [];
    var email = helpers.normalize(employee.email);
    var phone = phoneKey(employee.phone);
    var departmentExists = departments.some(function (department) {
      return department.name === employee.department;
    });
    var startDate = helpers.parseDateInput(employee.startDate);
    var today = new Date();

    today.setHours(0, 0, 0, 0);

    if (!employee.name || employee.name.length < 2) {
      errors.push({ field: "employeeName", message: "Họ và tên cần ít nhất 2 ký tự." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      errors.push({ field: "employeeEmail", message: "Email chưa đúng định dạng." });
    } else if (isDuplicate(employees, employee.id, function (item) {
      return helpers.normalize(item.email) === email;
    })) {
      errors.push({ field: "employeeEmail", message: "Email này đã thuộc về nhân viên khác." });
    }

    if (phone.length < 9) {
      errors.push({ field: "employeePhone", message: "Số điện thoại cần tối thiểu 9 chữ số." });
    } else if (isDuplicate(employees, employee.id, function (item) {
      return phoneKey(item.phone) === phone;
    })) {
      errors.push({ field: "employeePhone", message: "Số điện thoại này đã thuộc về nhân viên khác." });
    }

    if (!departmentExists) {
      errors.push({ field: "employeeDepartment", message: "Phòng ban không hợp lệ." });
    }

    if (!employee.role || employee.role.length < 2) {
      errors.push({ field: "employeeRole", message: "Chức vụ cần ít nhất 2 ký tự." });
    }

    if (!Number.isFinite(employee.salary) || employee.salary < 1000000) {
      errors.push({ field: "employeeSalary", message: "Lương tháng cần từ 1.000.000đ trở lên." });
    }

    if (!employee.startDate || Number.isNaN(startDate.getTime())) {
      errors.push({ field: "employeeStartDate", message: "Ngày vào làm không hợp lệ." });
    } else if (startDate > today) {
      errors.push({ field: "employeeStartDate", message: "Ngày vào làm không được ở tương lai." });
    }

    if (allowedStatuses.indexOf(employee.status) === -1) {
      errors.push({ field: "employeeStatus", message: "Trạng thái nhân viên không hợp lệ." });
    }

    if (!Number.isFinite(employee.performance) || employee.performance < 40 || employee.performance > 100) {
      errors.push({ field: "employeePerformance", message: "Hiệu suất cần nằm trong khoảng 40% đến 100%." });
    }

    return errors;
  }

  function validateServiceRequest(request, employees, categories) {
    var errors = [];
    var requesterExists = employees.some(function (employee) {
      return employee.id === request.requesterId;
    });
    var categoryExists = categories.some(function (category) {
      return category.name === request.category;
    });
    var createdAt = helpers.parseDateInput(request.createdAt);
    var dueDate = helpers.parseDateInput(request.dueDate);

    if (!request.title || request.title.length < 4) {
      errors.push({ field: "requestTitle", message: "Tiêu đề yêu cầu cần ít nhất 4 ký tự." });
    }

    if (!requesterExists) {
      errors.push({ field: "requesterId", message: "Người yêu cầu không hợp lệ." });
    }

    if (!categoryExists) {
      errors.push({ field: "requestCategory", message: "Nhóm dịch vụ không hợp lệ." });
    }

    if (allowedPriorities.indexOf(request.priority) === -1) {
      errors.push({ field: "requestPriority", message: "Mức ưu tiên không hợp lệ." });
    }

    if (allowedRequestStatuses.indexOf(request.status) === -1) {
      errors.push({ field: "requestStatus", message: "Trạng thái yêu cầu không hợp lệ." });
    }

    if (!request.owner || request.owner.length < 2) {
      errors.push({ field: "requestOwner", message: "Cần có bộ phận hoặc người phụ trách." });
    }

    if (!request.createdAt || Number.isNaN(createdAt.getTime())) {
      errors.push({ field: "requestCreatedAt", message: "Ngày tạo yêu cầu không hợp lệ." });
    }

    if (!request.dueDate || Number.isNaN(dueDate.getTime())) {
      errors.push({ field: "requestDueDate", message: "Hạn xử lý không hợp lệ." });
    } else if (!Number.isNaN(createdAt.getTime()) && dueDate < createdAt) {
      errors.push({ field: "requestDueDate", message: "Hạn xử lý không được trước ngày tạo." });
    }

    if (!request.description || request.description.length < 8) {
      errors.push({ field: "requestDescription", message: "Mô tả yêu cầu cần ít nhất 8 ký tự." });
    }

    return errors;
  }

  function validateDepartment(department) {
    var errors = [];

    if (!department.name || department.name.length < 2) {
      errors.push({ field: "departmentName", message: "Tên phòng ban cần ít nhất 2 ký tự." });
    }

    if (!department.owner || department.owner.length < 2) {
      errors.push({ field: "departmentOwner", message: "Người phụ trách cần ít nhất 2 ký tự." });
    }

    if (!department.color || !colorPattern.test(department.color)) {
      errors.push({ field: "departmentColor", message: "Màu hiển thị không hợp lệ." });
    }

    if (!department.description || department.description.length < 6) {
      errors.push({ field: "departmentDescription", message: "Mô tả phòng ban cần ít nhất 6 ký tự." });
    }

    return errors;
  }

  function validateServiceCategory(category) {
    var errors = [];

    if (!category.name || category.name.length < 2) {
      errors.push({ field: "categoryName", message: "Tên nhóm dịch vụ cần ít nhất 2 ký tự." });
    }

    if (!category.owner || category.owner.length < 2) {
      errors.push({ field: "categoryOwner", message: "Người phụ trách cần ít nhất 2 ký tự." });
    }

    if (!Number.isFinite(category.slaHours) || category.slaHours < 1) {
      errors.push({ field: "categorySlaHours", message: "SLA mặc định cần từ 1 giờ trở lên." });
    }

    if (!category.color || !colorPattern.test(category.color)) {
      errors.push({ field: "categoryColor", message: "Màu hiển thị không hợp lệ." });
    }

    return errors;
  }

  window.HR_VALIDATORS = {
    phoneKey: phoneKey,
    validateDepartment: validateDepartment,
    validateEmployee: validateEmployee,
    validateServiceCategory: validateServiceCategory,
    validateServiceRequest: validateServiceRequest
  };
}());

(function () {
  "use strict";

  var currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  });

  var dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  function formatCurrency(value) {
    if (value == null) {
      return "\u1ea8n theo quy\u1ec1n";
    }

    return currencyFormatter.format(Number(value) || 0);
  }

  function parseDateInput(value) {
    if (!value) {
      return new Date("");
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      var parts = value.split("-").map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(value);
  }

  function formatDate(value) {
    var date = parseDateInput(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return dateFormatter.format(date);
  }

  function initials(name) {
    return String(name || "")
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function nextId(employees) {
    var max = employees.reduce(function (current, employee) {
      var number = Number(String(employee.id || "").replace(/\D/g, ""));
      return Math.max(current, number || 0);
    }, 0);
    return "NV" + String(max + 1).padStart(3, "0");
  }

  function nextRequestId(requests) {
    var max = requests.reduce(function (current, request) {
      var number = Number(String(request.id || "").replace(/\D/g, ""));
      return Math.max(current, number || 0);
    }, 0);
    return "YC" + String(max + 1).padStart(3, "0");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function average(values) {
    if (!values.length) {
      return 0;
    }
    return Math.round(values.reduce(function (sum, value) {
      return sum + Number(value || 0);
    }, 0) / values.length);
  }

  function statusLabel(status) {
    var labels = {
      active: "Đang làm",
      probation: "Thử việc",
      leave: "Nghỉ phép"
    };
    return labels[status] || "Không rõ";
  }

  function requestStatusLabel(status) {
    var labels = {
      open: "Mới",
      inProgress: "Đang xử lý",
      waiting: "Chờ phản hồi",
      resolved: "Đã xong"
    };
    return labels[status] || "Không rõ";
  }

  function priorityLabel(priority) {
    var labels = {
      urgent: "Khẩn cấp",
      high: "Cao",
      normal: "Bình thường"
    };
    return labels[priority] || "Không rõ";
  }

  window.HR_HELPERS = {
    average: average,
    escapeHtml: escapeHtml,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    initials: initials,
    nextId: nextId,
    nextRequestId: nextRequestId,
    parseDateInput: parseDateInput,
    priorityLabel: priorityLabel,
    requestStatusLabel: requestStatusLabel,
    normalize: normalize,
    statusLabel: statusLabel
  };
}());

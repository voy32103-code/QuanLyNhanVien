(function () {
  "use strict";

  var helpers = window.HR_HELPERS;

  function payroll(employees) {
    if (employees.some(function (employee) {
      return employee.compensationRedacted;
    })) {
      return null;
    }

    return employees.reduce(function (sum, employee) {
      return sum + Number(employee.salary || 0);
    }, 0);
  }

  function employeesByDepartment(employees, departmentName) {
    return employees.filter(function (employee) {
      return employee.department === departmentName;
    });
  }

  function summary(employees, filteredCount, departments) {
    var active = employees.filter(function (employee) {
      return employee.status === "active";
    }).length;
    var avgPerformance = helpers.average(employees.map(function (employee) {
      return employee.performance;
    }));

    return {
      total: employees.length,
      filtered: filteredCount,
      active: active,
      activeRate: Math.round((active / Math.max(employees.length, 1)) * 100),
      avgPerformance: avgPerformance,
      payroll: payroll(employees),
      departmentCount: departments.length
    };
  }

  function departmentSummaries(departments, employees) {
    return departments.map(function (department) {
      var team = employeesByDepartment(employees, department.name);
      return {
        department: department,
        employees: team,
        count: team.length,
        active: team.filter(function (employee) {
          return employee.status === "active";
        }).length,
        payroll: payroll(team),
        avgPerformance: helpers.average(team.map(function (employee) {
          return employee.performance;
        }))
      };
    });
  }

  function topPerformers(employees, limit) {
    return employees
      .slice()
      .sort(function (a, b) {
        return b.performance - a.performance;
      })
      .slice(0, limit);
  }

  function isRequestOpen(request) {
    return request.status !== "resolved" && request.status !== "closed";
  }

  function isRequestOverdue(request, today) {
    var dueDate = helpers.parseDateInput(request.dueDate);
    var current = today ? new Date(today) : new Date();

    current.setHours(0, 0, 0, 0);
    return isRequestOpen(request) && !Number.isNaN(dueDate.getTime()) && dueDate < current;
  }

  function serviceSummary(requests) {
    var open = requests.filter(isRequestOpen);
    var overdue = requests.filter(function (request) {
      return isRequestOverdue(request);
    });
    var resolved = requests.filter(function (request) {
      return request.status === "resolved" || request.status === "closed";
    });
    var urgentOpen = open.filter(function (request) {
      return request.priority === "urgent";
    });
    var slaRate = open.length ? Math.round(((open.length - overdue.length) / open.length) * 100) : 100;

    return {
      total: requests.length,
      open: open.length,
      overdue: overdue.length,
      urgentOpen: urgentOpen.length,
      resolved: resolved.length,
      slaRate: slaRate
    };
  }

  function serviceByCategory(categories, requests) {
    return categories.map(function (category) {
      var items = requests.filter(function (request) {
        return request.category === category.name;
      });
      var open = items.filter(isRequestOpen);
      var overdue = items.filter(function (request) {
        return isRequestOverdue(request);
      });

      return {
        category: category,
        total: items.length,
        open: open.length,
        overdue: overdue.length,
        slaRate: open.length ? Math.round(((open.length - overdue.length) / open.length) * 100) : 100
      };
    });
  }

  function urgentQueue(requests, limit) {
    var weight = {
      urgent: 3,
      high: 2,
      normal: 1
    };

    return requests
      .filter(isRequestOpen)
      .slice()
      .sort(function (a, b) {
        if (isRequestOverdue(a) !== isRequestOverdue(b)) {
          return isRequestOverdue(a) ? -1 : 1;
        }
        if (weight[b.priority] !== weight[a.priority]) {
          return weight[b.priority] - weight[a.priority];
        }
        return helpers.parseDateInput(a.dueDate) - helpers.parseDateInput(b.dueDate);
      })
      .slice(0, limit);
  }

  window.HR_ANALYTICS = {
    departmentSummaries: departmentSummaries,
    employeesByDepartment: employeesByDepartment,
    isRequestOpen: isRequestOpen,
    isRequestOverdue: isRequestOverdue,
    payroll: payroll,
    serviceByCategory: serviceByCategory,
    serviceSummary: serviceSummary,
    summary: summary,
    topPerformers: topPerformers,
    urgentQueue: urgentQueue
  };
}());

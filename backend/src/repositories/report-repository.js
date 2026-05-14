const { query } = require("../db/pool");

function compensationFields(value, options = {}) {
  if (!options.includeCompensation) {
    return {
      payroll: null,
      compensationRedacted: true
    };
  }

  return {
    payroll: Number(value),
    compensationRedacted: false
  };
}

async function getSummary(options = {}) {
  const employeeResult = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COALESCE(ROUND(AVG(performance)), 0)::int AS avg_performance,
      COALESCE(SUM(salary), 0)::bigint AS payroll
    FROM employees
    WHERE deleted_at IS NULL
  `);
  const serviceResult = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status <> 'resolved')::int AS open,
      COUNT(*) FILTER (WHERE status <> 'resolved' AND due_date < CURRENT_DATE)::int AS overdue,
      COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved
    FROM service_requests
    WHERE deleted_at IS NULL
  `);
  const employees = employeeResult.rows[0];
  const services = serviceResult.rows[0];
  const slaRate = services.open > 0
    ? Math.round(((services.open - services.overdue) / services.open) * 100)
    : 100;

  return {
    employees: {
      total: employees.total,
      active: employees.active,
      avgPerformance: employees.avg_performance,
      ...compensationFields(employees.payroll, options)
    },
    services: {
      total: services.total,
      open: services.open,
      overdue: services.overdue,
      resolved: services.resolved,
      slaRate
    }
  };
}

async function getDepartmentReport(options = {}) {
  const result = await query(`
    SELECT
      d.name,
      d.owner,
      d.color,
      COUNT(e.id)::int AS employees,
      COUNT(e.id) FILTER (WHERE e.status = 'active')::int AS active,
      COALESCE(ROUND(AVG(e.performance)), 0)::int AS avg_performance,
      COALESCE(SUM(e.salary), 0)::bigint AS payroll
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL
    WHERE d.deleted_at IS NULL
    GROUP BY d.id
    ORDER BY d.name
  `);

  return result.rows.map((row) => ({
    name: row.name,
    owner: row.owner,
    color: row.color,
    employees: row.employees,
    active: row.active,
    avgPerformance: row.avg_performance,
    ...compensationFields(row.payroll, options)
  }));
}

async function getServiceReport() {
  const result = await query(`
    SELECT
      sc.name,
      sc.owner,
      sc.sla_hours,
      sc.color,
      COUNT(sr.id)::int AS total,
      COUNT(sr.id) FILTER (WHERE sr.status <> 'resolved')::int AS open,
      COUNT(sr.id) FILTER (WHERE sr.status <> 'resolved' AND sr.due_date < CURRENT_DATE)::int AS overdue,
      COUNT(sr.id) FILTER (WHERE sr.status = 'resolved')::int AS resolved
    FROM service_categories sc
    LEFT JOIN service_requests sr ON sr.category_id = sc.id AND sr.deleted_at IS NULL
    WHERE sc.deleted_at IS NULL
    GROUP BY sc.id
    ORDER BY sc.name
  `);

  return result.rows.map((row) => ({
    name: row.name,
    owner: row.owner,
    slaHours: Number(row.sla_hours),
    color: row.color,
    total: row.total,
    open: row.open,
    overdue: row.overdue,
    resolved: row.resolved,
    slaRate: row.open > 0 ? Math.round(((row.open - row.overdue) / row.open) * 100) : 100
  }));
}

module.exports = {
  getDepartmentReport,
  getServiceReport,
  getSummary
};

const { query, withTransaction } = require("../db/pool");
const auditRepository = require("./audit-repository");
const { ApiError } = require("../utils/api-error");
const { toDateOnly } = require("../utils/date");
const { nextTextId } = require("../utils/ids");

const employeeSelect = `
  SELECT
    e.id,
    e.name,
    e.email,
    e.phone,
    d.name AS department,
    e.role,
    e.salary,
    e.start_date,
    e.status,
    e.performance,
    COALESCE(e.color, d.color) AS color,
    e.created_at,
    e.updated_at,
    e.deleted_at,
    e.deleted_by
  FROM employees e
  JOIN departments d ON d.id = e.department_id
`;

const sortMap = {
  name: "e.name ASC",
  department: "d.name ASC, e.name ASC",
  performance: "e.performance DESC",
  startDate: "e.start_date DESC"
};

function mapEmployee(row, options = {}) {
  const includeCompensation = Boolean(options.includeCompensation);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    role: row.role,
    salary: includeCompensation ? Number(row.salary) : null,
    compensationRedacted: !includeCompensation,
    startDate: toDateOnly(row.start_date),
    status: row.status,
    performance: Number(row.performance),
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by
  };
}

async function getDepartmentId(client, departmentName) {
  const result = await client.query("SELECT id, color FROM departments WHERE name = $1 AND deleted_at IS NULL", [departmentName]);
  const department = result.rows[0];

  if (!department) {
    throw new ApiError(400, "Department does not exist.", [{ field: "department", message: "Unknown department." }]);
  }

  return department;
}

async function linkUserByEmployeeEmail(client, employeeId, email) {
  await client.query(
    `
    UPDATE users
    SET employee_id = $1
    WHERE employee_id IS NULL
      AND LOWER(email) = LOWER($2)
    `,
    [employeeId, email]
  );
}

async function listEmployees(filters, options = {}) {
  const where = ["e.deleted_at IS NULL"];
  const params = [];
  const sort = sortMap[filters.sortBy] || sortMap.name;

  if (filters.search) {
    params.push(`%${String(filters.search).toLowerCase()}%`);
    where.push(`(
      LOWER(e.name) LIKE $${params.length}
      OR LOWER(e.email) LIKE $${params.length}
      OR LOWER(e.phone) LIKE $${params.length}
      OR LOWER(e.role) LIKE $${params.length}
      OR LOWER(d.name) LIKE $${params.length}
    )`);
  }

  if (filters.department && filters.department !== "all") {
    params.push(filters.department);
    where.push(`d.name = $${params.length}`);
  }

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    where.push(`e.status = $${params.length}`);
  }

  const sql = `
    ${employeeSelect}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${sort}
  `;
  const result = await query(sql, params);

  return result.rows.map((row) => mapEmployee(row, options));
}

async function getEmployeeById(id, options = {}) {
  const result = await query(`${employeeSelect} WHERE e.id = $1 AND e.deleted_at IS NULL`, [id]);

  if (!result.rows[0]) {
    throw new ApiError(404, "Employee not found.");
  }

  return mapEmployee(result.rows[0], options);
}

async function getEmployeeByIdWithClient(client, id, options = {}) {
  const result = await client.query(`${employeeSelect} WHERE e.id = $1 AND e.deleted_at IS NULL`, [id]);

  if (!result.rows[0]) {
    throw new ApiError(404, "Employee not found.");
  }

  return mapEmployee(result.rows[0], options);
}

async function createEmployee(payload) {
  return withTransaction(async (client) => {
    const department = await getDepartmentId(client, payload.department);
    const id = payload.id || await nextTextId(client, "employees", "NV");
    const result = await client.query(
      `
      INSERT INTO employees (
        id, name, email, phone, department_id, role, salary, start_date, status, performance, color
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
      `,
      [
        id,
        payload.name,
        payload.email,
        payload.phone,
        department.id,
        payload.role,
        Number(payload.salary),
        payload.startDate,
        payload.status,
        Number(payload.performance),
        payload.color || department.color
      ]
    );

    const employee = await getEmployeeByIdWithClient(client, result.rows[0].id, { includeCompensation: true });

    await linkUserByEmployeeEmail(client, employee.id, employee.email);

    await auditRepository.recordAudit(client, {
      actorUserId: payload.actorUserId,
      entityType: "employee",
      entityId: employee.id,
      action: "create",
      afterData: employee
    });

    return employee;
  });
}

async function updateEmployee(id, payload) {
  return withTransaction(async (client) => {
    const before = await getEmployeeByIdWithClient(client, id, { includeCompensation: true });
    const department = await getDepartmentId(client, payload.department);
    const result = await client.query(
      `
      UPDATE employees SET
        name = $1,
        email = $2,
        phone = $3,
        department_id = $4,
        role = $5,
        salary = $6,
        start_date = $7,
        status = $8,
        performance = $9,
        color = $10
      WHERE id = $11 AND deleted_at IS NULL
      RETURNING id
      `,
      [
        payload.name,
        payload.email,
        payload.phone,
        department.id,
        payload.role,
        Number(payload.salary),
        payload.startDate,
        payload.status,
        Number(payload.performance),
        payload.color || department.color,
        id
      ]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Employee not found.");
    }

    const employee = await getEmployeeByIdWithClient(client, id, { includeCompensation: true });

    await auditRepository.recordAudit(client, {
      actorUserId: payload.actorUserId,
      entityType: "employee",
      entityId: id,
      action: "update",
      beforeData: before,
      afterData: employee
    });

    return employee;
  });
}

async function deleteEmployee(id, actorUserId) {
  return withTransaction(async (client) => {
    const before = await getEmployeeByIdWithClient(client, id, { includeCompensation: true });
    const result = await client.query(
      `
      UPDATE employees
      SET deleted_at = now(), deleted_by = $2
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
      `,
      [id, actorUserId || null]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Employee not found.");
    }

    await auditRepository.recordAudit(client, {
      actorUserId,
      entityType: "employee",
      entityId: id,
      action: "delete",
      beforeData: before
    });

    return { id };
  });
}

async function restoreEmployee(id, actorUserId) {
  return withTransaction(async (client) => {
    const deletedResult = await client.query(`${employeeSelect} WHERE e.id = $1 AND e.deleted_at IS NOT NULL`, [id]);
    const before = deletedResult.rows[0] ? mapEmployee(deletedResult.rows[0], { includeCompensation: true }) : null;

    if (!before) {
      throw new ApiError(404, "Employee not found.");
    }

    await client.query(
      "UPDATE employees SET deleted_at = NULL, deleted_by = NULL WHERE id = $1",
      [id]
    );

    const employee = await getEmployeeByIdWithClient(client, id, { includeCompensation: true });

    await auditRepository.recordAudit(client, {
      actorUserId,
      entityType: "employee",
      entityId: id,
      action: "restore",
      beforeData: before,
      afterData: employee
    });

    return employee;
  });
}

module.exports = {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  restoreEmployee,
  updateEmployee
};

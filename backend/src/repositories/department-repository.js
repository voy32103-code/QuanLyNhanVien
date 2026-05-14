const { query, withTransaction } = require("../db/pool");
const auditRepository = require("./audit-repository");
const { ApiError } = require("../utils/api-error");

function mapDepartment(row) {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    color: row.color,
    description: row.description,
    employeeCount: Number(row.employee_count || 0),
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by
  };
}

const departmentSelect = `
  SELECT
    d.id,
    d.name,
    d.owner,
    d.color,
    d.description,
    d.deleted_at,
    d.deleted_by,
    COUNT(e.id) FILTER (WHERE e.deleted_at IS NULL)::int AS employee_count
  FROM departments d
  LEFT JOIN employees e ON e.department_id = d.id
`;

async function listDepartments() {
  const result = await query(
    `
    ${departmentSelect}
    WHERE d.deleted_at IS NULL
    GROUP BY d.id
    ORDER BY d.name
    `
  );

  return result.rows.map(mapDepartment);
}

async function getDepartmentById(id) {
  const result = await query(
    `
    ${departmentSelect}
    WHERE d.id = $1 AND d.deleted_at IS NULL
    GROUP BY d.id
    `,
    [id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Department not found.");
  }

  return mapDepartment(result.rows[0]);
}

async function getDepartmentByIdWithClient(client, id) {
  const result = await client.query(
    `
    ${departmentSelect}
    WHERE d.id = $1 AND d.deleted_at IS NULL
    GROUP BY d.id
    `,
    [id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Department not found.");
  }

  return mapDepartment(result.rows[0]);
}

async function createDepartment(payload) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `
      INSERT INTO departments (name, owner, color, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        String(payload.name).trim(),
        String(payload.owner).trim(),
        payload.color,
        String(payload.description).trim()
      ]
    );

    const department = await getDepartmentByIdWithClient(client, result.rows[0].id);

    await auditRepository.recordAudit(client, {
      actorUserId: payload.actorUserId,
      entityType: "department",
      entityId: department.id,
      action: "create",
      afterData: department
    });

    return department;
  });
}

async function updateDepartment(id, payload) {
  return withTransaction(async (client) => {
    const before = await getDepartmentByIdWithClient(client, id);
    const result = await client.query(
      `
      UPDATE departments SET
        name = $1,
        owner = $2,
        color = $3,
        description = $4
      WHERE id = $5 AND deleted_at IS NULL
      RETURNING id
      `,
      [
        String(payload.name).trim(),
        String(payload.owner).trim(),
        payload.color,
        String(payload.description).trim(),
        id
      ]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Department not found.");
    }

    const department = await getDepartmentByIdWithClient(client, id);

    await auditRepository.recordAudit(client, {
      actorUserId: payload.actorUserId,
      entityType: "department",
      entityId: id,
      action: "update",
      beforeData: before,
      afterData: department
    });

    return department;
  });
}

async function deleteDepartment(id, actorUserId) {
  return withTransaction(async (client) => {
    const before = await getDepartmentByIdWithClient(client, id);
    const usage = await client.query(
      "SELECT COUNT(*)::int AS total FROM employees WHERE department_id = $1 AND deleted_at IS NULL",
      [id]
    );

    if (usage.rows[0].total > 0) {
      throw new ApiError(409, "Cannot delete a department that is used by employees.", [
        { field: "department", message: "Move or delete employees in this department first." }
      ]);
    }

    const result = await client.query(
      "UPDATE departments SET deleted_at = now(), deleted_by = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [id, actorUserId || null]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Department not found.");
    }

    await auditRepository.recordAudit(client, {
      actorUserId,
      entityType: "department",
      entityId: id,
      action: "delete",
      beforeData: before
    });

    return { id: Number(id) };
  });
}

module.exports = {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  listDepartments,
  updateDepartment
};

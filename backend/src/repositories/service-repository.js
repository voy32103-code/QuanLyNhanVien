const { query, withTransaction } = require("../db/pool");
const auditRepository = require("./audit-repository");
const { ApiError } = require("../utils/api-error");
const { toDateOnly } = require("../utils/date");
const { nextTextId } = require("../utils/ids");

const requestSelect = `
  SELECT
    sr.id,
    sr.title,
    sr.requester_id,
    e.name AS requester_name,
    sc.name AS category,
    sr.owner,
    sr.priority,
    sr.status,
    sr.request_created_at,
    sr.due_date,
    sr.description,
    sr.created_at,
    sr.updated_at,
    sr.deleted_at,
    sr.deleted_by
  FROM service_requests sr
  JOIN employees e ON e.id = sr.requester_id
  JOIN service_categories sc ON sc.id = sr.category_id
`;

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    slaHours: Number(row.sla_hours),
    color: row.color,
    requestCount: Number(row.request_count || 0),
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by
  };
}

function mapRequest(row) {
  return {
    id: row.id,
    title: row.title,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    category: row.category,
    owner: row.owner,
    priority: row.priority,
    status: row.status,
    createdAt: toDateOnly(row.request_created_at),
    dueDate: toDateOnly(row.due_date),
    description: row.description,
    createdAtTimestamp: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by
  };
}

async function listServiceCategories() {
  const result = await query(
    `
    SELECT
      sc.id,
      sc.name,
      sc.owner,
      sc.sla_hours,
      sc.color,
      sc.deleted_at,
      sc.deleted_by,
      COUNT(sr.id) FILTER (WHERE sr.deleted_at IS NULL)::int AS request_count
    FROM service_categories sc
    LEFT JOIN service_requests sr ON sr.category_id = sc.id
    WHERE sc.deleted_at IS NULL
    GROUP BY sc.id
    ORDER BY sc.name
    `
  );

  return result.rows.map(mapCategory);
}

async function getServiceCategoryById(id) {
  const result = await query(
    `
    SELECT
      sc.id,
      sc.name,
      sc.owner,
      sc.sla_hours,
      sc.color,
      sc.deleted_at,
      sc.deleted_by,
      COUNT(sr.id) FILTER (WHERE sr.deleted_at IS NULL)::int AS request_count
    FROM service_categories sc
    LEFT JOIN service_requests sr ON sr.category_id = sc.id
    WHERE sc.id = $1 AND sc.deleted_at IS NULL
    GROUP BY sc.id
    `,
    [id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Service category not found.");
  }

  return mapCategory(result.rows[0]);
}

async function getServiceCategoryByIdWithClient(client, id) {
  const result = await client.query(
    `
    SELECT
      sc.id,
      sc.name,
      sc.owner,
      sc.sla_hours,
      sc.color,
      sc.deleted_at,
      sc.deleted_by,
      COUNT(sr.id) FILTER (WHERE sr.deleted_at IS NULL)::int AS request_count
    FROM service_categories sc
    LEFT JOIN service_requests sr ON sr.category_id = sc.id
    WHERE sc.id = $1 AND sc.deleted_at IS NULL
    GROUP BY sc.id
    `,
    [id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Service category not found.");
  }

  return mapCategory(result.rows[0]);
}

async function createServiceCategory(payload) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `
      INSERT INTO service_categories (name, owner, sla_hours, color)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        String(payload.name).trim(),
        String(payload.owner).trim(),
        Number(payload.slaHours),
        payload.color
      ]
    );

    const category = await getServiceCategoryByIdWithClient(client, result.rows[0].id);

    await auditRepository.recordAudit(client, {
      actorUserId: payload.actorUserId,
      entityType: "service_category",
      entityId: category.id,
      action: "create",
      afterData: category
    });

    return category;
  });
}

async function updateServiceCategory(id, payload) {
  return withTransaction(async (client) => {
    const before = await getServiceCategoryByIdWithClient(client, id);
    const result = await client.query(
      `
      UPDATE service_categories SET
        name = $1,
        owner = $2,
        sla_hours = $3,
        color = $4
      WHERE id = $5 AND deleted_at IS NULL
      RETURNING id
      `,
      [
        String(payload.name).trim(),
        String(payload.owner).trim(),
        Number(payload.slaHours),
        payload.color,
        id
      ]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Service category not found.");
    }

    const category = await getServiceCategoryByIdWithClient(client, id);

    await auditRepository.recordAudit(client, {
      actorUserId: payload.actorUserId,
      entityType: "service_category",
      entityId: id,
      action: "update",
      beforeData: before,
      afterData: category
    });

    return category;
  });
}

async function deleteServiceCategory(id, actorUserId) {
  return withTransaction(async (client) => {
    const before = await getServiceCategoryByIdWithClient(client, id);
    const usage = await client.query(
      "SELECT COUNT(*)::int AS total FROM service_requests WHERE category_id = $1 AND deleted_at IS NULL",
      [id]
    );

    if (usage.rows[0].total > 0) {
      throw new ApiError(409, "Cannot delete a service category that is used by requests.", [
        { field: "category", message: "Move or delete service requests in this category first." }
      ]);
    }

    const result = await client.query(
      "UPDATE service_categories SET deleted_at = now(), deleted_by = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [id, actorUserId || null]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Service category not found.");
    }

    await auditRepository.recordAudit(client, {
      actorUserId,
      entityType: "service_category",
      entityId: id,
      action: "delete",
      beforeData: before
    });

    return { id: Number(id) };
  });
}

async function getCategoryId(client, categoryName) {
  const result = await client.query("SELECT id, owner FROM service_categories WHERE name = $1 AND deleted_at IS NULL", [categoryName]);
  const category = result.rows[0];

  if (!category) {
    throw new ApiError(400, "Service category does not exist.", [{ field: "category", message: "Unknown service category." }]);
  }

  return category;
}

async function ensureRequesterExists(client, requesterId) {
  const result = await client.query("SELECT id FROM employees WHERE id = $1 AND deleted_at IS NULL", [requesterId]);

  if (!result.rows[0]) {
    throw new ApiError(400, "Requester does not exist.", [{ field: "requesterId", message: "Unknown requester." }]);
  }
}

async function listServiceRequests(filters, options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, "requesterId") && !options.requesterId) {
    return [];
  }

  const where = ["sr.deleted_at IS NULL"];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(options, "requesterId")) {
    params.push(options.requesterId);
    where.push(`sr.requester_id = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${String(filters.search).toLowerCase()}%`);
    where.push(`(
      LOWER(sr.id) LIKE $${params.length}
      OR LOWER(sr.title) LIKE $${params.length}
      OR LOWER(sr.description) LIKE $${params.length}
      OR LOWER(sr.owner) LIKE $${params.length}
      OR LOWER(e.name) LIKE $${params.length}
      OR LOWER(sc.name) LIKE $${params.length}
    )`);
  }

  if (filters.category && filters.category !== "all") {
    params.push(filters.category);
    where.push(`sc.name = $${params.length}`);
  }

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    where.push(`sr.status = $${params.length}`);
  }

  if (filters.priority && filters.priority !== "all") {
    params.push(filters.priority);
    where.push(`sr.priority = $${params.length}`);
  }

  const result = await query(
    `
    ${requestSelect}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY
      CASE WHEN sr.status = 'resolved' THEN 1 ELSE 0 END,
      CASE sr.priority WHEN 'urgent' THEN 3 WHEN 'high' THEN 2 ELSE 1 END DESC,
      sr.due_date ASC
    `,
    params
  );

  return result.rows.map(mapRequest);
}

async function getServiceRequestById(id, options = {}) {
  const where = ["sr.id = $1", "sr.deleted_at IS NULL"];
  const params = [id];

  if (Object.prototype.hasOwnProperty.call(options, "requesterId")) {
    if (!options.requesterId) {
      throw new ApiError(404, "Service request not found.");
    }

    params.push(options.requesterId);
    where.push(`sr.requester_id = $${params.length}`);
  }

  const result = await query(`${requestSelect} WHERE ${where.join(" AND ")}`, params);

  if (!result.rows[0]) {
    throw new ApiError(404, "Service request not found.");
  }

  return mapRequest(result.rows[0]);
}

async function getServiceRequestByIdWithClient(client, id) {
  const result = await client.query(`${requestSelect} WHERE sr.id = $1 AND sr.deleted_at IS NULL`, [id]);

  if (!result.rows[0]) {
    throw new ApiError(404, "Service request not found.");
  }

  return mapRequest(result.rows[0]);
}

async function createServiceRequest(payload) {
  return withTransaction(async (client) => {
    await ensureRequesterExists(client, payload.requesterId);
    const category = await getCategoryId(client, payload.category);
    const id = payload.id || await nextTextId(client, "service_requests", "YC");
    const result = await client.query(
      `
      INSERT INTO service_requests (
        id, title, requester_id, category_id, owner, priority, status, request_created_at, due_date, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
      `,
      [
        id,
        payload.title,
        payload.requesterId,
        category.id,
        payload.owner || category.owner,
        payload.priority,
        payload.status,
        payload.createdAt,
        payload.dueDate,
        payload.description
      ]
    );

    const request = await getServiceRequestByIdWithClient(client, result.rows[0].id);

    await auditRepository.recordAudit(client, {
      actorUserId: payload.actorUserId,
      entityType: "service_request",
      entityId: request.id,
      action: "create",
      afterData: request
    });

    return request;
  });
}

async function updateServiceRequest(id, payload) {
  return withTransaction(async (client) => {
    const before = await getServiceRequestByIdWithClient(client, id);
    await ensureRequesterExists(client, payload.requesterId);
    const category = await getCategoryId(client, payload.category);
    const result = await client.query(
      `
      UPDATE service_requests SET
        title = $1,
        requester_id = $2,
        category_id = $3,
        owner = $4,
        priority = $5,
        status = $6,
        request_created_at = $7,
        due_date = $8,
        description = $9
      WHERE id = $10 AND deleted_at IS NULL
      RETURNING id
      `,
      [
        payload.title,
        payload.requesterId,
        category.id,
        payload.owner || category.owner,
        payload.priority,
        payload.status,
        payload.createdAt,
        payload.dueDate,
        payload.description,
        id
      ]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Service request not found.");
    }

    const request = await getServiceRequestByIdWithClient(client, id);

    await auditRepository.recordAudit(client, {
      actorUserId: payload.actorUserId,
      entityType: "service_request",
      entityId: id,
      action: "update",
      beforeData: before,
      afterData: request
    });

    return request;
  });
}

async function advanceServiceRequest(id, actorUserId) {
  const flow = ["open", "inProgress", "waiting", "resolved"];

  return withTransaction(async (client) => {
    const before = await getServiceRequestByIdWithClient(client, id);
    const nextStatus = flow[Math.min(flow.indexOf(before.status) + 1, flow.length - 1)] || "open";

    await client.query(
      "UPDATE service_requests SET status = $1 WHERE id = $2 AND deleted_at IS NULL",
      [nextStatus, id]
    );

    const request = await getServiceRequestByIdWithClient(client, id);

    await auditRepository.recordAudit(client, {
      actorUserId,
      entityType: "service_request",
      entityId: id,
      action: "status_change",
      beforeData: before,
      afterData: request
    });

    return request;
  });
}

async function deleteServiceRequest(id, actorUserId) {
  return withTransaction(async (client) => {
    const before = await getServiceRequestByIdWithClient(client, id);
    const result = await client.query(
      "UPDATE service_requests SET deleted_at = now(), deleted_by = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [id, actorUserId || null]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Service request not found.");
    }

    await auditRepository.recordAudit(client, {
      actorUserId,
      entityType: "service_request",
      entityId: id,
      action: "delete",
      beforeData: before
    });

    return { id };
  });
}

module.exports = {
  advanceServiceRequest,
  createServiceCategory,
  createServiceRequest,
  deleteServiceCategory,
  deleteServiceRequest,
  getServiceRequestById,
  getServiceCategoryById,
  listServiceCategories,
  listServiceRequests,
  updateServiceCategory,
  updateServiceRequest
};

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
    sr.assigned_user_id,
    au.name AS assigned_user_name,
    au.email AS assigned_user_email,
    sr.priority,
    sr.status,
    sr.request_created_at,
    sr.due_date,
    sr.description,
    sr.resolved_at,
    sr.closed_at,
    sr.sla_paused_at,
    sr.sla_paused_seconds,
    sr.source,
    sr.last_activity_at,
    sr.created_at,
    sr.updated_at,
    sr.deleted_at,
    sr.deleted_by
  FROM service_requests sr
  JOIN employees e ON e.id = sr.requester_id
  JOIN service_categories sc ON sc.id = sr.category_id
  LEFT JOIN users au ON au.id = sr.assigned_user_id
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
    assignedUserId: row.assigned_user_id,
    assignedUserName: row.assigned_user_name,
    assignedUserEmail: row.assigned_user_email,
    priority: row.priority,
    status: row.status,
    createdAt: toDateOnly(row.request_created_at),
    dueDate: toDateOnly(row.due_date),
    description: row.description,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    slaPausedAt: row.sla_paused_at,
    slaPausedSeconds: Number(row.sla_paused_seconds || 0),
    source: row.source || "web",
    lastActivityAt: row.last_activity_at,
    createdAtTimestamp: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by
  };
}

function mapEvent(row) {
  return {
    id: Number(row.id),
    type: "event",
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    beforeData: row.before_data,
    afterData: row.after_data,
    createdAt: row.created_at
  };
}

function mapComment(row) {
  return {
    id: Number(row.id),
    type: "comment",
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    body: row.body,
    isInternal: row.is_internal,
    createdAt: row.created_at
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

async function getServiceCategoryByName(name) {
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
      0::int AS request_count
    FROM service_categories sc
    WHERE sc.name = $1 AND sc.deleted_at IS NULL
    `,
    [name]
  );

  if (!result.rows[0]) {
    throw new ApiError(400, "Service category does not exist.", [{ field: "category", message: "Unknown service category." }]);
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
  const result = await client.query(
    "SELECT id, name, owner, sla_hours FROM service_categories WHERE name = $1 AND deleted_at IS NULL",
    [categoryName]
  );
  const category = result.rows[0];

  if (!category) {
    throw new ApiError(400, "Service category does not exist.", [{ field: "category", message: "Unknown service category." }]);
  }

  return category;
}

async function ensureRequesterExists(client, requesterId) {
  const result = await client.query(
    "SELECT id, status FROM employees WHERE id = $1 AND deleted_at IS NULL",
    [requesterId]
  );
  const requester = result.rows[0];

  if (!requester) {
    throw new ApiError(400, "Requester does not exist.", [{ field: "requesterId", message: "Unknown requester." }]);
  }

  return requester;
}

async function ensureRequesterCanCreate(client, requesterId) {
  const requester = await ensureRequesterExists(client, requesterId);

  if (requester.status === "terminated") {
    throw new ApiError(409, "Cannot create service requests for a terminated employee.", [
      { field: "requesterId", message: "Requester is terminated." }
    ]);
  }

  return requester;
}

async function ensureAssignedUserExists(client, assignedUserId) {
  if (!assignedUserId) {
    return null;
  }

  const result = await client.query(
    "SELECT id, name, email FROM users WHERE id = $1 AND is_active = true",
    [assignedUserId]
  );

  if (!result.rows[0]) {
    throw new ApiError(400, "Assigned user does not exist or is inactive.", [
      { field: "assignedUserId", message: "Unknown assigned user." }
    ]);
  }

  return result.rows[0];
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
      CASE WHEN sr.status IN ('resolved', 'closed') THEN 1 ELSE 0 END,
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

async function recordRequestEvent(client, payload) {
  await client.query(
    `
    INSERT INTO service_request_events (request_id, actor_user_id, event_type, before_data, after_data)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      payload.requestId,
      payload.actorUserId || null,
      payload.eventType,
      payload.beforeData ? JSON.stringify(payload.beforeData) : null,
      payload.afterData ? JSON.stringify(payload.afterData) : null
    ]
  );
}

function statusTimestampSql(statusParam) {
  return `
    resolved_at = CASE
      WHEN ${statusParam} = 'resolved' THEN COALESCE(resolved_at, now())
      WHEN ${statusParam} IN ('open', 'triage', 'inProgress', 'waiting') THEN NULL
      ELSE resolved_at
    END,
    closed_at = CASE
      WHEN ${statusParam} = 'closed' THEN COALESCE(closed_at, now())
      WHEN ${statusParam} IN ('open', 'triage', 'inProgress', 'waiting', 'resolved') THEN NULL
      ELSE closed_at
    END,
    sla_paused_seconds = CASE
      WHEN sla_paused_at IS NOT NULL AND ${statusParam} <> 'waiting'
        THEN sla_paused_seconds + FLOOR(EXTRACT(EPOCH FROM now() - sla_paused_at))::int
      ELSE sla_paused_seconds
    END,
    sla_paused_at = CASE
      WHEN ${statusParam} = 'waiting' THEN COALESCE(sla_paused_at, now())
      ELSE NULL
    END
  `;
}

async function createServiceRequest(payload) {
  return withTransaction(async (client) => {
    await ensureRequesterCanCreate(client, payload.requesterId);
    const category = await getCategoryId(client, payload.category);
    const assignedUser = await ensureAssignedUserExists(client, payload.assignedUserId);
    const id = payload.id || await nextTextId(client, "service_requests", "YC");
    const result = await client.query(
      `
      INSERT INTO service_requests (
        id, title, requester_id, category_id, owner, assigned_user_id, priority, status,
        request_created_at, due_date, description, source, last_activity_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      RETURNING id
      `,
      [
        id,
        payload.title,
        payload.requesterId,
        category.id,
        payload.owner || category.owner,
        assignedUser ? assignedUser.id : null,
        payload.priority,
        payload.status,
        payload.createdAt,
        payload.dueDate,
        payload.description,
        payload.source || "web"
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
    await recordRequestEvent(client, {
      requestId: request.id,
      actorUserId: payload.actorUserId,
      eventType: "created",
      afterData: request
    });

    if (assignedUser) {
      await recordRequestEvent(client, {
        requestId: request.id,
        actorUserId: payload.actorUserId,
        eventType: "assigned",
        afterData: { assignedUserId: assignedUser.id, assignedUserName: assignedUser.name }
      });
    }

    return request;
  });
}

async function updateServiceRequest(id, payload) {
  return withTransaction(async (client) => {
    const before = await getServiceRequestByIdWithClient(client, id);
    await ensureRequesterExists(client, payload.requesterId);
    const category = await getCategoryId(client, payload.category);
    const assignedUserId = Object.prototype.hasOwnProperty.call(payload, "assignedUserId")
      ? payload.assignedUserId || null
      : before.assignedUserId;

    await ensureAssignedUserExists(client, assignedUserId);

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
        description = $9,
        assigned_user_id = $10,
        source = $11,
        ${statusTimestampSql("$6")},
        last_activity_at = now()
      WHERE id = $12 AND deleted_at IS NULL
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
        assignedUserId,
        payload.source || before.source || "web",
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

    if (before.status !== request.status) {
      await recordRequestEvent(client, {
        requestId: id,
        actorUserId: payload.actorUserId,
        eventType: "status_changed",
        beforeData: { status: before.status },
        afterData: { status: request.status }
      });
    }

    if (before.priority !== request.priority) {
      await recordRequestEvent(client, {
        requestId: id,
        actorUserId: payload.actorUserId,
        eventType: "priority_changed",
        beforeData: { priority: before.priority },
        afterData: { priority: request.priority }
      });
    }

    if (before.assignedUserId !== request.assignedUserId) {
      await recordRequestEvent(client, {
        requestId: id,
        actorUserId: payload.actorUserId,
        eventType: "assigned",
        beforeData: { assignedUserId: before.assignedUserId },
        afterData: { assignedUserId: request.assignedUserId, assignedUserName: request.assignedUserName }
      });
    }

    return request;
  });
}

async function changeServiceRequestStatus(id, status, actorUserId, eventType = "status_changed") {
  return withTransaction(async (client) => {
    const before = await getServiceRequestByIdWithClient(client, id);

    if (before.status === status) {
      return before;
    }

    await client.query(
      `
      UPDATE service_requests SET
        status = $1,
        ${statusTimestampSql("$1")},
        last_activity_at = now()
      WHERE id = $2 AND deleted_at IS NULL
      `,
      [status, id]
    );

    const request = await getServiceRequestByIdWithClient(client, id);

    await auditRepository.recordAudit(client, {
      actorUserId,
      entityType: "service_request",
      entityId: id,
      action: eventType === "reopened" ? "reopen" : "status_change",
      beforeData: before,
      afterData: request
    });
    await recordRequestEvent(client, {
      requestId: id,
      actorUserId,
      eventType,
      beforeData: { status: before.status },
      afterData: { status: request.status }
    });

    return request;
  });
}

async function assignServiceRequest(id, assignedUserId, actorUserId) {
  return withTransaction(async (client) => {
    const before = await getServiceRequestByIdWithClient(client, id);
    const assignedUser = await ensureAssignedUserExists(client, assignedUserId);

    const result = await client.query(
      `
      UPDATE service_requests
      SET assigned_user_id = $1, last_activity_at = now()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id
      `,
      [assignedUser.id, id]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Service request not found.");
    }

    const request = await getServiceRequestByIdWithClient(client, id);

    await auditRepository.recordAudit(client, {
      actorUserId,
      entityType: "service_request",
      entityId: id,
      action: "assign",
      beforeData: before,
      afterData: request
    });
    await recordRequestEvent(client, {
      requestId: id,
      actorUserId,
      eventType: "assigned",
      beforeData: { assignedUserId: before.assignedUserId },
      afterData: { assignedUserId: request.assignedUserId, assignedUserName: request.assignedUserName }
    });

    return request;
  });
}

async function addServiceRequestComment(id, payload) {
  return withTransaction(async (client) => {
    await getServiceRequestByIdWithClient(client, id);
    const result = await client.query(
      `
      INSERT INTO service_request_comments (request_id, actor_user_id, body, is_internal)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [id, payload.actorUserId || null, String(payload.body).trim(), Boolean(payload.isInternal)]
    );

    await client.query(
      "UPDATE service_requests SET last_activity_at = now() WHERE id = $1",
      [id]
    );
    await recordRequestEvent(client, {
      requestId: id,
      actorUserId: payload.actorUserId,
      eventType: "commented",
      afterData: { commentId: result.rows[0].id, isInternal: Boolean(payload.isInternal) }
    });

    return getServiceRequestCommentByIdWithClient(client, result.rows[0].id);
  });
}

async function getServiceRequestCommentByIdWithClient(client, id) {
  const result = await client.query(
    `
    SELECT
      src.id,
      src.actor_user_id,
      u.name AS actor_name,
      u.email AS actor_email,
      src.body,
      src.is_internal,
      src.created_at
    FROM service_request_comments src
    LEFT JOIN users u ON u.id = src.actor_user_id
    WHERE src.id = $1 AND src.deleted_at IS NULL
    `,
    [id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Service request comment not found.");
  }

  return mapComment(result.rows[0]);
}

async function listServiceRequestTimeline(id, options = {}) {
  const includeInternal = Boolean(options.includeInternal);

  const eventResult = await query(
    `
    SELECT
      sre.id,
      sre.actor_user_id,
      u.name AS actor_name,
      u.email AS actor_email,
      sre.event_type,
      sre.before_data,
      sre.after_data,
      sre.created_at
    FROM service_request_events sre
    LEFT JOIN users u ON u.id = sre.actor_user_id
    WHERE sre.request_id = $1
    `,
    [id]
  );
  const commentResult = await query(
    `
    SELECT
      src.id,
      src.actor_user_id,
      u.name AS actor_name,
      u.email AS actor_email,
      src.body,
      src.is_internal,
      src.created_at
    FROM service_request_comments src
    LEFT JOIN users u ON u.id = src.actor_user_id
    WHERE src.request_id = $1
      AND src.deleted_at IS NULL
      AND ($2::boolean = true OR src.is_internal = false)
    `,
    [id, includeInternal]
  );

  return eventResult.rows
    .map(mapEvent)
    .concat(commentResult.rows.map(mapComment))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

async function deleteServiceRequest(id, actorUserId) {
  return withTransaction(async (client) => {
    const before = await getServiceRequestByIdWithClient(client, id);
    const result = await client.query(
      "UPDATE service_requests SET deleted_at = now(), deleted_by = $2, last_activity_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id",
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
    await recordRequestEvent(client, {
      requestId: id,
      actorUserId,
      eventType: "deleted",
      beforeData: before
    });

    return { id };
  });
}

module.exports = {
  addServiceRequestComment,
  assignServiceRequest,
  changeServiceRequestStatus,
  createServiceCategory,
  createServiceRequest,
  deleteServiceCategory,
  deleteServiceRequest,
  getServiceCategoryById,
  getServiceCategoryByName,
  getServiceRequestById,
  listServiceCategories,
  listServiceRequestTimeline,
  listServiceRequests,
  updateServiceCategory,
  updateServiceRequest
};

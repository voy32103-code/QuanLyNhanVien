const { query } = require("../db/pool");

function mapAuditLog(row) {
  return {
    id: Number(row.id),
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    beforeData: row.before_data,
    afterData: row.after_data,
    createdAt: row.created_at
  };
}

async function recordAudit(client, payload) {
  await client.query(
    `
    INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, before_data, after_data)
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      payload.actorUserId || null,
      payload.entityType,
      String(payload.entityId),
      payload.action,
      payload.beforeData ? JSON.stringify(payload.beforeData) : null,
      payload.afterData ? JSON.stringify(payload.afterData) : null
    ]
  );
}

async function listAuditLogs(filters) {
  const where = [];
  const params = [];
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 200);

  if (filters.entityType) {
    params.push(filters.entityType);
    where.push(`al.entity_type = $${params.length}`);
  }

  if (filters.entityId) {
    params.push(String(filters.entityId));
    where.push(`al.entity_id = $${params.length}`);
  }

  if (filters.actorUserId) {
    params.push(Number(filters.actorUserId));
    where.push(`al.actor_user_id = $${params.length}`);
  }

  params.push(limit);

  const result = await query(
    `
    SELECT
      al.id,
      al.actor_user_id,
      u.name AS actor_name,
      u.email AS actor_email,
      al.entity_type,
      al.entity_id,
      al.action,
      al.before_data,
      al.after_data,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.actor_user_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY al.created_at DESC
    LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(mapAuditLog);
}

module.exports = {
  listAuditLogs,
  recordAudit
};

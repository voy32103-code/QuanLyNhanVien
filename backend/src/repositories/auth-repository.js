const { query } = require("../db/pool");
const { getConfig } = require("../config/env");
const { createSessionToken, hashPassword, hashToken, verifyPassword } = require("../utils/passwords");

const roleNames = ["admin", "hr_manager", "manager", "employee"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    employeeId: row.employee_id || null,
    roles: row.roles || []
  };
}

async function ensureRoles(client) {
  for (const roleName of roleNames) {
    await client.query(
      "INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      [roleName]
    );
  }
}

async function assignRoles(client, userId, roles) {
  for (const roleName of roles) {
    await client.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      SELECT $1, id FROM roles WHERE name = $2
      ON CONFLICT DO NOTHING
      `,
      [userId, roleName]
    );
  }
}

async function createUserWithRoles(client, payload) {
  const email = normalizeEmail(payload.email);
  const password = await hashPassword(payload.password);
  const result = await client.query(
    `
    INSERT INTO users (email, name, password_hash, password_salt)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
    [email, payload.name, password.hash, password.salt]
  );

  await assignRoles(client, result.rows[0].id, payload.roles);
  return result.rows[0].id;
}

async function createBootstrapAdmin(client, payload) {
  const email = normalizeEmail(payload.email);

  await ensureRoles(client);

  const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows[0]) {
    await assignRoles(client, existing.rows[0].id, ["admin"]);
    return { id: existing.rows[0].id, created: false };
  }

  const id = await createUserWithRoles(client, {
    email,
    name: payload.name,
    password: payload.password,
    roles: ["admin"]
  });

  return { id, created: true };
}

async function getUserForLogin(email) {
  const result = await query(
    `
    SELECT
      u.id,
      u.email,
      u.name,
      u.employee_id,
      u.password_hash,
      u.password_salt,
      u.is_active,
      COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.email = $1
    GROUP BY u.id
    `,
    [normalizeEmail(email)]
  );

  return result.rows[0] || null;
}

async function createSession(userId) {
  const config = getConfig();
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.sessionHours * 60 * 60 * 1000);

  await query(
    `
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES ($1, $2, $3)
    `,
    [tokenHash, userId, expiresAt]
  );

  return {
    token,
    expiresAt
  };
}

async function login(email, password) {
  const user = await getUserForLogin(email);

  if (!user || !user.is_active) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!isValid) {
    return null;
  }

  const session = await createSession(user.id);
  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: publicUser(user)
  };
}

async function getUserByToken(token) {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const result = await query(
    `
    SELECT
      u.id,
      u.email,
      u.name,
      u.employee_id,
      COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE s.token_hash = $1
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND u.is_active = true
    GROUP BY u.id
    `,
    [tokenHash]
  );

  if (!result.rows[0]) {
    return null;
  }

  await query("UPDATE sessions SET last_seen_at = now() WHERE token_hash = $1", [tokenHash]);
  return publicUser(result.rows[0]);
}

async function revokeSession(token) {
  await query(
    "UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
    [hashToken(token)]
  );
}

module.exports = {
  createBootstrapAdmin,
  ensureRoles,
  getUserByToken,
  login,
  revokeSession
};

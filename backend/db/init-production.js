const { pool, withTransaction } = require("../src/db/pool");
const { getConfig } = require("../src/config/env");
const authRepository = require("../src/repositories/auth-repository");
const initData = require("../src/production-init-data");

async function initDepartments(client) {
  for (const item of initData.departments) {
    await client.query(
      `
      INSERT INTO departments (name, owner, color, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) WHERE deleted_at IS NULL DO NOTHING
      `,
      [item.name, item.owner, item.color, item.description]
    );
  }
}

async function initServiceCategories(client) {
  for (const item of initData.serviceCategories) {
    await client.query(
      `
      INSERT INTO service_categories (name, owner, sla_hours, color)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) WHERE deleted_at IS NULL DO NOTHING
      `,
      [item.name, item.owner, item.slaHours, item.color]
    );
  }
}

async function run() {
  const config = getConfig();
  const adminEmail = config.adminEmail;
  const adminPassword = config.adminPassword;

  await withTransaction(async (client) => {
    await initDepartments(client);
    await initServiceCategories(client);
    await authRepository.ensureRoles(client);

    if (adminEmail && adminPassword) {
      const result = await authRepository.createBootstrapAdmin(client, {
        email: adminEmail,
        name: config.adminName,
        password: adminPassword
      });

      console.log(result.created ? `Admin user created: ${adminEmail}` : `Admin user already exists: ${adminEmail}`);
    } else {
      console.log("No admin user created. Set ADMIN_EMAIL and ADMIN_PASSWORD before running init-production.");
    }
  });

  console.log("Production init completed.");
}

run()
  .catch((error) => {
    console.error("Production init failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

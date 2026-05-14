const { pool, withTransaction } = require("../src/db/pool");
const seedData = require("../src/seed-data");

async function getIdByName(client, table, name) {
  const result = await client.query(`SELECT id FROM ${table} WHERE name = $1`, [name]);
  return result.rows[0] ? result.rows[0].id : null;
}

async function seedDepartments(client) {
  for (const item of seedData.departments) {
    await client.query(
      `
      INSERT INTO departments (name, owner, color, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) WHERE deleted_at IS NULL DO UPDATE SET
        owner = EXCLUDED.owner,
        color = EXCLUDED.color,
        description = EXCLUDED.description
      `,
      [item.name, item.owner, item.color, item.description]
    );
  }
}

async function seedEmployees(client) {
  for (const item of seedData.employees) {
    const departmentId = await getIdByName(client, "departments", item.department);

    await client.query(
      `
      INSERT INTO employees (
        id, name, email, phone, department_id, role, salary, start_date, status, performance, color
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        department_id = EXCLUDED.department_id,
        role = EXCLUDED.role,
        salary = EXCLUDED.salary,
        start_date = EXCLUDED.start_date,
        status = EXCLUDED.status,
        performance = EXCLUDED.performance,
        color = EXCLUDED.color
      `,
      [
        item.id,
        item.name,
        item.email,
        item.phone,
        departmentId,
        item.role,
        item.salary,
        item.startDate,
        item.status,
        item.performance,
        item.color
      ]
    );
  }
}

async function seedServiceCategories(client) {
  for (const item of seedData.serviceCategories) {
    await client.query(
      `
      INSERT INTO service_categories (name, owner, sla_hours, color)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) WHERE deleted_at IS NULL DO UPDATE SET
        owner = EXCLUDED.owner,
        sla_hours = EXCLUDED.sla_hours,
        color = EXCLUDED.color
      `,
      [item.name, item.owner, item.slaHours, item.color]
    );
  }
}

async function seedServiceRequests(client) {
  for (const item of seedData.serviceRequests) {
    const categoryId = await getIdByName(client, "service_categories", item.category);

    await client.query(
      `
      INSERT INTO service_requests (
        id, title, requester_id, category_id, owner, priority, status, request_created_at, due_date, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        requester_id = EXCLUDED.requester_id,
        category_id = EXCLUDED.category_id,
        owner = EXCLUDED.owner,
        priority = EXCLUDED.priority,
        status = EXCLUDED.status,
        request_created_at = EXCLUDED.request_created_at,
        due_date = EXCLUDED.due_date,
        description = EXCLUDED.description
      `,
      [
        item.id,
        item.title,
        item.requesterId,
        categoryId,
        item.owner,
        item.priority,
        item.status,
        item.createdAt,
        item.dueDate,
        item.description
      ]
    );
  }
}

async function run() {
  await withTransaction(async (client) => {
    await seedDepartments(client);
    await seedEmployees(client);
    await seedServiceCategories(client);
    await seedServiceRequests(client);
  });

  console.log("Seed completed.");
}

run()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

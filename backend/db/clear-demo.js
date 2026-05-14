const { pool, withTransaction } = require("../src/db/pool");
const seedData = require("../src/seed-data");

function list(values, key) {
  return values.map((value) => value[key]);
}

async function clearDemoData() {
  const requestIds = list(seedData.serviceRequests, "id");
  const employeeIds = list(seedData.employees, "id");
  const serviceCategoryNames = list(seedData.serviceCategories, "name");
  const departmentNames = list(seedData.departments, "name");

  return withTransaction(async (client) => {
    const deletedRequests = await client.query(
      "DELETE FROM service_requests WHERE id = ANY($1::text[])",
      [requestIds]
    );
    const deletedEmployees = await client.query(
      `
      DELETE FROM employees e
      WHERE e.id = ANY($1::text[])
        AND NOT EXISTS (
          SELECT 1 FROM service_requests sr WHERE sr.requester_id = e.id
        )
      `,
      [employeeIds]
    );
    const deletedServiceCategories = await client.query(
      `
      DELETE FROM service_categories sc
      WHERE sc.name = ANY($1::text[])
        AND NOT EXISTS (
          SELECT 1 FROM service_requests sr WHERE sr.category_id = sc.id
        )
      `,
      [serviceCategoryNames]
    );
    const deletedDepartments = await client.query(
      `
      DELETE FROM departments d
      WHERE d.name = ANY($1::text[])
        AND NOT EXISTS (
          SELECT 1 FROM employees e WHERE e.department_id = d.id
        )
      `,
      [departmentNames]
    );

    return {
      serviceRequests: deletedRequests.rowCount,
      employees: deletedEmployees.rowCount,
      serviceCategories: deletedServiceCategories.rowCount,
      departments: deletedDepartments.rowCount
    };
  });
}

clearDemoData()
  .then((result) => {
    console.log("Demo data cleared:", result);
  })
  .catch((error) => {
    console.error("Clear demo data failed:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

const test = require("node:test");
const assert = require("node:assert/strict");

const baseUrl = (process.env.TEST_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const adminEmail = process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "";
const adminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";
const hasAdminCredentials = Boolean(adminEmail && adminPassword);

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(baseUrl + path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  return {
    status: response.status,
    headers: response.headers,
    payload
  };
}

async function loginAsAdmin() {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: adminEmail,
      password: adminPassword
    }
  });

  assert.equal(response.status, 200);
  assert.equal(typeof response.payload.data.token, "string");
  return response.payload.data.token;
}

test("health endpoint reports service status", async () => {
  const response = await request("/api/health");

  assert.equal(response.status, 200);
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.service, "quan-ly-nhan-vien-api");
});

test("sensitive read endpoints reject missing auth token", async () => {
  const departments = await request("/api/departments");
  const categories = await request("/api/services/categories");
  const employees = await request("/api/employees");
  const requests = await request("/api/services/requests");
  const summary = await request("/api/reports/summary");

  assert.equal(departments.status, 401);
  assert.equal(categories.status, 401);
  assert.equal(employees.status, 401);
  assert.equal(requests.status, 401);
  assert.equal(summary.status, 401);
});

test("authenticated read endpoints return data envelopes", { skip: !hasAdminCredentials }, async () => {
  const token = await loginAsAdmin();
  const departments = await request("/api/departments", { token });
  const categories = await request("/api/services/categories", { token });
  const employees = await request("/api/employees", { token });
  const requests = await request("/api/services/requests", { token });
  const summary = await request("/api/reports/summary", { token });

  assert.equal(departments.status, 200);
  assert.equal(categories.status, 200);
  assert.equal(employees.status, 200);
  assert.equal(requests.status, 200);
  assert.equal(summary.status, 200);
  assert.ok(Array.isArray(departments.payload.data));
  assert.ok(Array.isArray(categories.payload.data));
  assert.ok(Array.isArray(employees.payload.data));
  assert.ok(Array.isArray(requests.payload.data));
  assert.equal(typeof summary.payload.data.employees.total, "number");
  assert.equal(typeof summary.payload.data.employees.payroll, "number");
});

test("protected endpoints reject missing auth token", async () => {
  const writePayload = {
    name: "No Token",
    email: "no-token-test@example.com",
    phone: "0900000999",
    department: "Nhan su",
    role: "QA",
    salary: 1000000,
    startDate: "2026-05-14",
    status: "active",
    performance: 80,
    color: "#2563eb"
  };
  const write = await request("/api/employees", { method: "POST", body: writePayload });
  const audit = await request("/api/audit-logs");

  assert.equal(write.status, 401);
  assert.equal(audit.status, 401);
});

test("invalid login returns 401 and rate-limit headers", async () => {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "missing@example.com",
      password: "wrong-password"
    }
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("x-ratelimit-limit") !== null, true);
});

test("admin can log in, inspect session, and log out", { skip: !hasAdminCredentials }, async () => {
  const token = await loginAsAdmin();
  const me = await request("/api/auth/me", { token });
  const logout = await request("/api/auth/logout", { method: "POST", token });

  assert.equal(me.status, 200);
  assert.equal(me.payload.data.user.email.toLowerCase(), adminEmail.toLowerCase());
  assert.ok(me.payload.data.user.roles.includes("admin"));
  assert.equal(logout.status, 200);

  const afterLogout = await request("/api/auth/me", { token });
  assert.equal(afterLogout.status, 401);
});

test("admin write flow creates audit logs and hides soft-deleted records", { skip: !hasAdminCredentials }, async () => {
  const token = await loginAsAdmin();
  const suffix = Date.now();
  const departmentName = `QA Dept ${suffix}`;
  const categoryName = `QA Category ${suffix}`;

  const department = await request("/api/departments", {
    method: "POST",
    token,
    body: {
      name: departmentName,
      owner: "QA",
      color: "#0f766e",
      description: "Temporary department for API test."
    }
  });
  assert.equal(department.status, 201);

  const category = await request("/api/services/categories", {
    method: "POST",
    token,
    body: {
      name: categoryName,
      owner: "QA",
      slaHours: 12,
      color: "#2563eb"
    }
  });
  assert.equal(category.status, 201);

  const employee = await request("/api/employees", {
    method: "POST",
    token,
    body: {
      name: `QA Employee ${suffix}`,
      email: `qa-${suffix}@example.com`,
      phone: `090${String(suffix).slice(-7)}`,
      department: departmentName,
      role: "QA",
      salary: 1000000,
      startDate: "2026-05-14",
      status: "active",
      performance: 80,
      color: "#0f766e"
    }
  });
  assert.equal(employee.status, 201);

  const serviceRequest = await request("/api/services/requests", {
    method: "POST",
    token,
    body: {
      title: `QA Request ${suffix}`,
      requesterId: employee.payload.data.id,
      category: categoryName,
      owner: "QA",
      priority: "normal",
      status: "open",
      createdAt: "2026-05-14",
      dueDate: "2026-05-15",
      description: "Temporary request for API test."
    }
  });
  assert.equal(serviceRequest.status, 201);

  const advanced = await request(`/api/services/requests/${serviceRequest.payload.data.id}/advance`, {
    method: "PATCH",
    token
  });
  assert.equal(advanced.status, 200);
  assert.equal(advanced.payload.data.status, "inProgress");

  assert.equal((await request(`/api/services/requests/${serviceRequest.payload.data.id}`, { method: "DELETE", token })).status, 200);
  assert.equal((await request(`/api/employees/${employee.payload.data.id}`, { method: "DELETE", token })).status, 200);
  assert.equal((await request(`/api/services/categories/${category.payload.data.id}`, { method: "DELETE", token })).status, 200);
  assert.equal((await request(`/api/departments/${department.payload.data.id}`, { method: "DELETE", token })).status, 200);

  const employees = await request("/api/employees", { token });
  assert.equal(employees.payload.data.some((item) => item.id === employee.payload.data.id), false);

  const audit = await request(`/api/audit-logs?entityType=service_request&entityId=${serviceRequest.payload.data.id}`, { token });
  assert.equal(audit.status, 200);
  assert.ok(audit.payload.data.some((item) => item.action === "status_change"));
  assert.ok(audit.payload.data.some((item) => item.action === "delete"));
});

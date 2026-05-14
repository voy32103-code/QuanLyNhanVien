const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateDepartmentPayload,
  validateEmployeePayload,
  validateServiceCategoryPayload,
  validateServiceRequestPayload
} = require("../../src/utils/validators");

function fields(errors) {
  return errors.map((error) => error.field).sort();
}

test("validates a valid department payload", () => {
  const errors = validateDepartmentPayload({
    name: "Nhan su",
    owner: "Tran Bao Chau",
    color: "#2563eb",
    description: "Quan ly chinh sach va tuyen dung."
  });

  assert.deepEqual(errors, []);
});

test("rejects invalid department catalog data", () => {
  const errors = validateDepartmentPayload({
    name: "A",
    owner: "",
    color: "blue",
    description: "short"
  });

  assert.deepEqual(fields(errors), ["color", "description", "name", "owner"]);
});

test("validates service category payloads and SLA bounds", () => {
  assert.deepEqual(validateServiceCategoryPayload({
    name: "Thiet bi",
    owner: "Ky thuat",
    slaHours: 16,
    color: "#be3455"
  }), []);

  assert.deepEqual(fields(validateServiceCategoryPayload({
    name: "",
    owner: "A",
    slaHours: 0,
    color: "#xyz"
  })), ["color", "name", "owner", "slaHours"]);
});

test("validates employee business rules", () => {
  const valid = {
    name: "Nguyen Van A",
    email: "a@example.com",
    phone: "0901234567",
    department: "Nhan su",
    role: "HR",
    salary: 1000000,
    startDate: "2025-01-01",
    status: "active",
    performance: 80
  };

  assert.deepEqual(validateEmployeePayload(valid), []);

  const invalid = validateEmployeePayload({
    ...valid,
    email: "bad",
    phone: "123",
    salary: 999999,
    status: "unknown",
    performance: 120
  });

  assert.deepEqual(fields(invalid), ["email", "performance", "phone", "salary", "status"]);
});

test("validates service request date, status, priority, and text rules", () => {
  const valid = {
    title: "Cap tai khoan",
    requesterId: "NV001",
    category: "Thiet bi",
    owner: "Ky thuat",
    priority: "normal",
    status: "open",
    createdAt: "2026-05-01",
    dueDate: "2026-05-02",
    description: "Tao tai khoan noi bo."
  };

  assert.deepEqual(validateServiceRequestPayload(valid), []);

  const invalid = validateServiceRequestPayload({
    ...valid,
    title: "abc",
    requesterId: "",
    category: "",
    owner: "",
    priority: "low",
    status: "new",
    dueDate: "2026-04-30",
    description: "short"
  });

  assert.deepEqual(fields(invalid), [
    "category",
    "description",
    "dueDate",
    "owner",
    "priority",
    "requesterId",
    "status",
    "title"
  ]);
});

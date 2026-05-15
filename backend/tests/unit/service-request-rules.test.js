const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertTransition,
  calculateDueDate,
  canTransition,
  isClosedStatus,
  nextAdvanceStatus
} = require("../../src/services/service-request-rules");

test("enforces service request transition map", () => {
  assert.equal(canTransition("open", "triage"), true);
  assert.equal(canTransition("open", "inProgress"), true);
  assert.equal(canTransition("waiting", "resolved"), true);
  assert.equal(canTransition("closed", "inProgress"), false);

  assert.throws(
    () => assertTransition("closed", "inProgress"),
    (error) => error.statusCode === 422 && error.details[0].field === "status"
  );
});

test("keeps legacy advance compatible while following allowed transitions", () => {
  assert.equal(nextAdvanceStatus("open"), "inProgress");
  assert.equal(nextAdvanceStatus("triage"), "inProgress");
  assert.equal(nextAdvanceStatus("inProgress"), "waiting");
  assert.equal(nextAdvanceStatus("waiting"), "resolved");
  assert.equal(nextAdvanceStatus("resolved"), "closed");
  assert.equal(nextAdvanceStatus("closed"), "closed");
});

test("calculates SLA due date with priority multiplier", () => {
  assert.equal(calculateDueDate("2026-05-01", 48, "normal"), "2026-05-03");
  assert.equal(calculateDueDate("2026-05-01", 48, "high"), "2026-05-02");
  assert.equal(calculateDueDate("2026-05-01", 48, "urgent"), "2026-05-02");
  assert.equal(calculateDueDate("bad-date", 48, "normal"), null);
});

test("identifies final ticket statuses", () => {
  assert.equal(isClosedStatus("resolved"), true);
  assert.equal(isClosedStatus("closed"), true);
  assert.equal(isClosedStatus("waiting"), false);
});

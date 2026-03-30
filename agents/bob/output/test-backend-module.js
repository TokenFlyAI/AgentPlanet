/**
 * Quick self-test for backend-api-module.js
 * Run: node agents/bob/output/test-backend-module.js
 */
"use strict";

const { RateLimiter, Validator, AgentMetrics } = require("./backend-api-module");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

// --- RateLimiter ---
console.log("\n[RateLimiter]");
{
  const rl = new RateLimiter({ windowMs: 1000, maxRequests: 3 });

  assert(rl.check("ip1:/api/tasks").allowed === true, "first request allowed");
  assert(rl.check("ip1:/api/tasks").allowed === true, "second request allowed");
  assert(rl.check("ip1:/api/tasks").allowed === true, "third request allowed");
  const blocked = rl.check("ip1:/api/tasks");
  assert(blocked.allowed === false, "fourth request blocked (over limit)");
  assert(blocked.remaining === 0, "remaining is 0 when blocked");
  assert(blocked.resetMs > 0, "resetMs > 0 when blocked");
  assert(rl.check("ip2:/api/tasks").allowed === true, "different IP not affected");
}

// --- Validator ---
console.log("\n[Validator]");
{
  const schema = Validator.schemas.task;

  const { valid, errors } = Validator.validate({ title: "Fix bug", priority: "high" }, schema);
  assert(valid === true, "valid task passes");
  assert(errors.length === 0, "no errors on valid task");

  const r2 = Validator.validate({}, schema);
  assert(r2.valid === false, "missing required title fails");
  assert(r2.errors.some((e) => e.includes('"title"')), "error mentions title field");

  const r3 = Validator.validate({ title: "X", priority: "ultra" }, schema);
  assert(r3.valid === false, "bad enum value fails");
  assert(r3.errors.some((e) => e.includes("priority")), "error mentions priority field");

  const r4 = Validator.validate({ title: "A".repeat(201) }, schema);
  assert(r4.valid === false, "title exceeding maxLength fails");

  // Optional field absent — should pass
  const r5 = Validator.validate({ title: "Deploy service" }, schema);
  assert(r5.valid === true, "optional fields absent is fine");

  // Message schema
  const r6 = Validator.validate({ message: "hello" }, Validator.schemas.message);
  assert(r6.valid === true, "valid message passes");

  const r7 = Validator.validate({}, Validator.schemas.message);
  assert(r7.valid === false, "missing message body fails");
}

// --- AgentMetrics ---
console.log("\n[AgentMetrics]");
{
  const m = new AgentMetrics();

  m.recordRequest("GET /api/agents", 12, 200);
  m.recordRequest("GET /api/agents", 18, 200);
  m.recordRequest("GET /api/agents", 8, 500);

  m.recordAgentActivity("bob", { cycleCount: 5 });
  m.recordAgentActivity("alice", { tasksDone: 2 });

  const snap = m.snapshot();

  assert(snap.total_requests === 3, "total_requests is 3");
  assert(snap.total_errors === 1, "total_errors is 1");
  assert(snap.endpoints["GET /api/agents"].avg_ms === 13, "avg_ms is 13 (38/3 rounded)");
  assert(snap.endpoints["GET /api/agents"].min_ms === 8, "min_ms is 8");
  assert(snap.endpoints["GET /api/agents"].max_ms === 18, "max_ms is 18");
  assert(snap.endpoints["GET /api/agents"].error_rate === 0.3333, "error_rate is ~0.33");
  assert(snap.agents.bob.cycleCount === 5, "bob cycleCount is 5");
  assert(snap.agents.alice.tasksDone === 2, "alice tasksDone is 2");
  assert(typeof snap.uptime_human === "string", "uptime_human is string");

  m.reset();
  const snap2 = m.snapshot();
  assert(snap2.total_requests === 0, "metrics reset clears requests");
}

// --- Summary ---
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

/**
 * Middleware Unit Tests — QI-006
 * Author: Dave (Full Stack Engineer)
 * Task: #56 — Write unit tests for rate limiting + CORS middleware
 *
 * Tests:
 *   1. RateLimiter class — allows up to maxRequests, blocks on the next
 *   2. RateLimiter class — sliding window expires old timestamps
 *   3. middleware() — write endpoints hit 429 after 20 req/min
 *   4. middleware() — read endpoints are not rate-limited at write-endpoint threshold
 *   5. middleware() — CORS Access-Control-Allow-Origin header on all /api/ responses
 *   6. middleware() — OPTIONS preflight returns 204 with full CORS headers
 *   7. middleware() — non-API paths are not rate-limited
 *   8. middleware() — X-Forwarded-For is used for IP extraction
 *   9. Middleware chain — apiMiddleware is wired before routing in server.js
 *
 * Run: node agents/dave/output/middleware_tests.js
 */

"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// Load the module under test — RateLimiter and middleware
// ---------------------------------------------------------------------------
const {
  RateLimiter,
  middleware,
  WRITE_ROUTES: _WRITE_ROUTES,
} = require(path.resolve(__dirname, "../../bob/output/backend-api-module"));

// WRITE_ROUTES is not exported directly — reconstruct from known values
const WRITE_ROUTES = new Set([
  "/api/tasks",
  "/api/messages",
  "/api/announce",
  "/api/announcements",
  "/api/broadcast",
  "/api/team-channel",
]);

// ---------------------------------------------------------------------------
// Lightweight test runner (no external deps)
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗  ${name}`);
    console.log(`     ${err.message}`);
    failed++;
    failures.push({ name, err });
  }
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------
function mockReq(method, pathname, ip, headers = {}) {
  return {
    method,
    url: pathname,
    socket: { remoteAddress: ip || "127.0.0.1" },
    headers: { ...headers },
  };
}

function mockRes() {
  const res = {
    _statusCode: null,
    _headers: {},
    _body: null,
    writeHead(code, headers) {
      this._statusCode = code;
      Object.assign(this._headers, headers || {});
    },
    end(body) {
      this._body = body || "";
    },
    getHeader(name) {
      return this._headers[name.toLowerCase()] || this._headers[name];
    },
  };
  return res;
}

// ---------------------------------------------------------------------------
// 1. RateLimiter — basic allow / block
// ---------------------------------------------------------------------------
console.log("\nRateLimiter — basic allow/block");

test("allows requests up to maxRequests", () => {
  const rl = new RateLimiter({ windowMs: 60_000, maxRequests: 5 });
  for (let i = 0; i < 5; i++) {
    const r = rl.check("test:ip");
    assert.strictEqual(r.allowed, true, `request ${i + 1} should be allowed`);
  }
});

test("blocks on the (maxRequests+1)th request", () => {
  const rl = new RateLimiter({ windowMs: 60_000, maxRequests: 5 });
  for (let i = 0; i < 5; i++) rl.check("test:ip2");
  const r = rl.check("test:ip2");
  assert.strictEqual(r.allowed, false, "6th request should be blocked");
  assert.strictEqual(r.remaining, 0);
  assert.ok(r.resetMs > 0, "resetMs should be positive when blocked");
});

test("different keys are tracked independently", () => {
  const rl = new RateLimiter({ windowMs: 60_000, maxRequests: 2 });
  rl.check("ip-a");
  rl.check("ip-a");
  const blocked = rl.check("ip-a");
  assert.strictEqual(blocked.allowed, false, "ip-a should be blocked");

  const fresh = rl.check("ip-b");
  assert.strictEqual(fresh.allowed, true, "ip-b should still be allowed");
});

test("allows requests from a fresh key after sliding window expires", () => {
  // Use a very short window to simulate expiry
  const rl = new RateLimiter({ windowMs: 1, maxRequests: 1 });
  rl.check("exp-key");
  // Force time to advance by manipulating the stored timestamp
  const store = rl._store.get("exp-key");
  store[0] = Date.now() - 10; // put the timestamp well in the past
  const r = rl.check("exp-key");
  assert.strictEqual(r.allowed, true, "should allow after window expires");
});

// ---------------------------------------------------------------------------
// 2. middleware() — write endpoint rate limiting (strictLimiter: 20 req/min)
// ---------------------------------------------------------------------------
console.log("\nmiddleware() — write endpoint rate limiting");

test("write endpoint hits 429 after 20 POST requests", () => {
  // Use a unique IP to avoid bleeding from other tests
  const ip = "10.0.0.1";
  const pathname = "/api/tasks";
  let lastResult = null;
  let blockedAt = null;

  for (let i = 1; i <= 21; i++) {
    const req = mockReq("POST", pathname, ip);
    const res = mockRes();
    const blocked = middleware(req, res, pathname, "POST");
    if (blocked && res._statusCode === 429) {
      blockedAt = i;
      lastResult = res;
      break;
    }
  }

  assert.ok(blockedAt !== null, "should have hit 429 within 21 requests");
  assert.ok(blockedAt <= 21, `should be blocked by request 21, was ${blockedAt}`);
  assert.strictEqual(lastResult._statusCode, 429, "blocked response should be 429");
});

test("429 response includes Retry-After header", () => {
  const ip = "10.0.0.2";
  const pathname = "/api/broadcast";
  let res429 = null;

  for (let i = 0; i < 22; i++) {
    const req = mockReq("POST", pathname, ip);
    const res = mockRes();
    const blocked = middleware(req, res, pathname, "POST");
    if (blocked && res._statusCode === 429) {
      res429 = res;
      break;
    }
  }

  assert.ok(res429 !== null, "should have hit 429");
  assert.ok(
    res429._headers["Retry-After"] !== undefined,
    "429 must include Retry-After header"
  );
});

test("429 response body includes error and retry_after_ms fields", () => {
  const ip = "10.0.0.3";
  const pathname = "/api/announce";
  let body429 = null;

  for (let i = 0; i < 22; i++) {
    const req = mockReq("POST", pathname, ip);
    const res = mockRes();
    const blocked = middleware(req, res, pathname, "POST");
    if (blocked && res._statusCode === 429) {
      body429 = JSON.parse(res._body);
      break;
    }
  }

  assert.ok(body429 !== null, "should have hit 429");
  assert.ok(body429.error, "body must have error field");
  assert.ok(body429.retry_after_ms > 0, "body must have positive retry_after_ms");
});

// ---------------------------------------------------------------------------
// 3. middleware() — read endpoints not blocked at write-endpoint threshold
// ---------------------------------------------------------------------------
console.log("\nmiddleware() — read endpoints not blocked at write threshold");

test("GET /api/tasks is NOT blocked after 20 requests (uses general limiter)", () => {
  const ip = "10.0.0.10";
  const pathname = "/api/tasks";

  // Send 21 GET requests — should all pass since read limiter allows 120
  for (let i = 0; i < 21; i++) {
    const req = mockReq("GET", pathname, ip);
    const res = mockRes();
    const blocked = middleware(req, res, pathname, "GET");
    assert.strictEqual(blocked, false, `GET request ${i + 1} should not be blocked`);
  }
});

test("GET /api/agents is NOT blocked after 20 requests", () => {
  const ip = "10.0.0.11";
  const pathname = "/api/agents";

  for (let i = 0; i < 21; i++) {
    const req = mockReq("GET", pathname, ip);
    const res = mockRes();
    const blocked = middleware(req, res, pathname, "GET");
    assert.strictEqual(blocked, false, `GET request ${i + 1} should not be blocked`);
  }
});

// ---------------------------------------------------------------------------
// 4. middleware() — CORS headers on /api/ responses
// ---------------------------------------------------------------------------
console.log("\nmiddleware() — CORS headers");

test("OPTIONS preflight returns 204", () => {
  const req = mockReq("OPTIONS", "/api/tasks", "127.0.0.1");
  const res = mockRes();
  const blocked = middleware(req, res, "/api/tasks", "OPTIONS");
  assert.strictEqual(blocked, true, "OPTIONS should be handled (blocked=true)");
  assert.strictEqual(res._statusCode, 204, "OPTIONS should return 204");
});

test("OPTIONS response includes Access-Control-Allow-Origin: *", () => {
  const req = mockReq("OPTIONS", "/api/tasks", "127.0.0.1");
  const res = mockRes();
  middleware(req, res, "/api/tasks", "OPTIONS");
  assert.strictEqual(
    res._headers["Access-Control-Allow-Origin"],
    "*",
    "OPTIONS must have ACAO: *"
  );
});

test("OPTIONS response includes Access-Control-Allow-Methods", () => {
  const req = mockReq("OPTIONS", "/api/tasks", "127.0.0.1");
  const res = mockRes();
  middleware(req, res, "/api/tasks", "OPTIONS");
  assert.ok(
    res._headers["Access-Control-Allow-Methods"],
    "OPTIONS must include Allow-Methods header"
  );
});

test("OPTIONS response includes Access-Control-Allow-Headers", () => {
  const req = mockReq("OPTIONS", "/api/tasks", "127.0.0.1");
  const res = mockRes();
  middleware(req, res, "/api/tasks", "OPTIONS");
  assert.ok(
    res._headers["Access-Control-Allow-Headers"],
    "OPTIONS must include Allow-Headers header"
  );
});

test("429 rate limit response includes Access-Control-Allow-Origin: *", () => {
  const ip = "10.0.0.20";
  const pathname = "/api/team-channel";
  let res429 = null;

  for (let i = 0; i < 22; i++) {
    const req = mockReq("POST", pathname, ip);
    const res = mockRes();
    const blocked = middleware(req, res, pathname, "POST");
    if (blocked && res._statusCode === 429) {
      res429 = res;
      break;
    }
  }

  assert.ok(res429 !== null, "should hit 429");
  assert.strictEqual(
    res429._headers["Access-Control-Allow-Origin"],
    "*",
    "429 must include ACAO: *"
  );
});

// ---------------------------------------------------------------------------
// 5. middleware() — non-API paths are not rate-limited
// ---------------------------------------------------------------------------
console.log("\nmiddleware() — non-API paths");

test("static file path is not rate-limited", () => {
  const ip = "10.0.1.1";
  const pathname = "/index.html";
  const req = mockReq("GET", pathname, ip);
  const res = mockRes();
  const blocked = middleware(req, res, pathname, "GET");
  assert.strictEqual(blocked, false, "static path should not be blocked");
});

test("/ (root) is not rate-limited", () => {
  const req = mockReq("GET", "/", "10.0.1.2");
  const res = mockRes();
  const blocked = middleware(req, res, "/", "GET");
  assert.strictEqual(blocked, false, "root path should not be blocked");
});

// ---------------------------------------------------------------------------
// 6. middleware() — X-Forwarded-For is used for IP when present
// ---------------------------------------------------------------------------
console.log("\nmiddleware() — X-Forwarded-For support");

test("X-Forwarded-For IP is used instead of remoteAddress", () => {
  // Two requests from same remoteAddress but different X-Forwarded-For
  // They should be rate-limited independently
  const pathname = "/api/tasks";
  const xffIp = "203.0.113.1";

  // Exhaust the strictLimiter for xffIp
  for (let i = 0; i < 20; i++) {
    const req = mockReq("POST", pathname, "192.168.1.1", {
      "x-forwarded-for": xffIp,
    });
    const res = mockRes();
    middleware(req, res, pathname, "POST");
  }

  // 21st request from xffIp should be blocked
  const reqBlocked = mockReq("POST", pathname, "192.168.1.1", {
    "x-forwarded-for": xffIp,
  });
  const resBlocked = mockRes();
  const blocked = middleware(reqBlocked, resBlocked, pathname, "POST");

  // A different IP from same remoteAddress should still be allowed (fresh key)
  const reqFresh = mockReq("POST", pathname, "192.168.1.1", {
    "x-forwarded-for": "203.0.113.99",
  });
  const resFresh = mockRes();
  const notBlocked = middleware(reqFresh, resFresh, pathname, "POST");

  assert.strictEqual(notBlocked, false, "different XFF IP should not be blocked");
});

// ---------------------------------------------------------------------------
// 7. Middleware chain — apiMiddleware is wired before routing in server.js
// ---------------------------------------------------------------------------
console.log("\nMiddleware chain — server.js integration");

test("server.js requires backend-api-module and calls middleware before routing", () => {
  const serverPath = path.resolve(__dirname, "../../..", "server.js");
  const source = fs.readFileSync(serverPath, "utf8");

  // Verify the require is present
  assert.ok(
    source.includes("backend-api-module"),
    "server.js must require backend-api-module"
  );

  // Verify middleware is extracted
  assert.ok(
    source.includes("middleware: apiMiddleware"),
    "server.js must destructure middleware as apiMiddleware"
  );

  // Verify apiMiddleware is called in the request handler
  assert.ok(
    source.includes("apiMiddleware(req, res, pathname, method)"),
    "server.js must call apiMiddleware(req, res, pathname, method)"
  );

  // Verify the call is positioned before route handlers by checking
  // that it appears before the first route-specific if-block
  const middlewareCallIdx = source.indexOf("apiMiddleware(req, res, pathname, method)");
  const firstRouteIdx = source.indexOf('pathname === "/api/');
  assert.ok(
    middlewareCallIdx < firstRouteIdx,
    "apiMiddleware call must appear before the first route handler"
  );
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
console.log(`\n${"─".repeat(50)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} tests passed`);
} else {
  console.log(`❌  ${failed} failed, ${passed} passed`);
  for (const { name, err } of failures) {
    console.log(`\n  FAILED: ${name}`);
    console.log(`  ${err.stack || err.message}`);
  }
  process.exitCode = 1;
}

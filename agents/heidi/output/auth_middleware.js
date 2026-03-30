/**
 * auth_middleware.js — Reference Implementation for SEC-001 Fix
 * Heidi (Security Engineer) — Task #103 support
 * Date: 2026-03-30
 *
 * PURPOSE: Drop-in API key authentication for server.js and backend/api.js
 *
 * USAGE IN server.js:
 *   const { requireApiKey } = require('./auth_middleware');
 *   // Add near the top of request handler, before any route matching:
 *   if (!requireApiKey(req, res)) return;
 *
 * CONFIG:
 *   API_KEY env var — set to a strong random value (≥32 chars)
 *   API_KEY_EXEMPT_PATHS — comma-separated paths that skip auth (default: /api/health,/ping)
 *
 * EXAMPLE DEPLOYMENT:
 *   API_KEY=$(openssl rand -hex 32) node server.js --dir . --port 3199
 *
 * CLIENT USAGE:
 *   curl -H "X-API-Key: <key>" http://localhost:3199/api/agents
 *   curl -H "Authorization: Bearer <key>" http://localhost:3199/api/agents
 */

"use strict";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_KEY = process.env.API_KEY || null;

// Paths that are always accessible without authentication
const DEFAULT_EXEMPT = new Set(["/api/health", "/ping", "/"]);

const EXEMPT_PATHS = (() => {
  const extra = (process.env.API_KEY_EXEMPT_PATHS || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_EXEMPT, ...extra]);
})();

// ---------------------------------------------------------------------------
// Startup validation
// ---------------------------------------------------------------------------

if (!API_KEY) {
  console.warn(
    "[auth] WARNING: API_KEY env var is not set. " +
    "All endpoints are UNAUTHENTICATED. " +
    "Set API_KEY=<random-32-char-string> before deploying."
  );
}

// ---------------------------------------------------------------------------
// Timing-safe comparison (prevents timing attacks on key comparison)
// ---------------------------------------------------------------------------

const crypto = require("crypto");

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  // Use fixed-length buffers; pad/truncate to same length to avoid length leak
  const maxLen = Math.max(a.length, b.length, 64);
  const bufA = Buffer.alloc(maxLen, 0);
  const bufB = Buffer.alloc(maxLen, 0);
  bufA.write(a, "utf8");
  bufB.write(b, "utf8");
  return crypto.timingSafeEqual(bufA, bufB) && a.length === b.length;
}

// ---------------------------------------------------------------------------
// Extract key from request
// ---------------------------------------------------------------------------

function extractKey(req) {
  // 1. X-API-Key header (preferred)
  const xApiKey = req.headers["x-api-key"];
  if (xApiKey) return xApiKey.trim();

  // 2. Authorization: Bearer <key>
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main middleware function
// ---------------------------------------------------------------------------

/**
 * Check API key authentication.
 * Returns true if the request is authorized (or exempt), false if rejected.
 * If false, a 401 response has already been sent.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse}  res
 * @returns {boolean}
 */
function requireApiKey(req, res) {
  // If no key configured, bypass (with startup warning already emitted)
  if (!API_KEY) return true;

  const pathname = new URL(req.url || "/", "http://localhost").pathname;

  // OPTIONS preflight — never block
  if (req.method === "OPTIONS") return true;

  // Exempt paths
  if (EXEMPT_PATHS.has(pathname)) return true;

  const provided = extractKey(req);

  if (!provided || !timingSafeEqual(provided, API_KEY)) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "WWW-Authenticate": 'Bearer realm="Tokenfly Agent Lab"',
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ error: "Unauthorized — valid API key required" }));
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Express-style middleware (if server ever migrates to Express)
// ---------------------------------------------------------------------------

function expressMiddleware(req, res, next) {
  if (requireApiKey(req, res)) next();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { requireApiKey, expressMiddleware, extractKey, timingSafeEqual };

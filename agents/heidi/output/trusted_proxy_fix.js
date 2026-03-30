/**
 * trusted_proxy_fix.js — Reference Implementation for SEC-002 Fix
 * Heidi (Security Engineer) — Task #104 support
 * Date: 2026-03-30
 *
 * PURPOSE: Prevent IP spoofing via X-Forwarded-For header in rate limiter.
 *
 * PROBLEM: If rate limiter uses req.headers['x-forwarded-for'] directly,
 * any client can forge this header to bypass per-IP rate limits.
 *
 * FIX: Only trust X-Forwarded-For if the immediate connection peer
 * (req.socket.remoteAddress) is in a known trusted proxy list.
 *
 * CONFIG:
 *   TRUSTED_PROXIES env var — comma-separated IPs or CIDR blocks
 *   Examples:
 *     TRUSTED_PROXIES=127.0.0.1,10.0.0.0/8,172.16.0.0/12
 *     TRUSTED_PROXIES=10.0.1.5,10.0.1.6   (explicit proxy IPs)
 *
 * USAGE IN server.js (replace existing rate limiter IP extraction):
 *   const { getClientIp } = require('./trusted_proxy_fix');
 *   // In rate limit check:
 *   const ip = getClientIp(req);
 *   if (rateLimiter.isLimited(ip)) { ... }
 */

"use strict";

// ---------------------------------------------------------------------------
// CIDR matching (no dependencies)
// ---------------------------------------------------------------------------

/**
 * Convert an IPv4 address string to a 32-bit integer.
 */
function ipToInt(ip) {
  // Strip IPv6-mapped IPv4: ::ffff:1.2.3.4 → 1.2.3.4
  const clean = ip.replace(/^::ffff:/i, "");
  const parts = clean.split(".");
  if (parts.length !== 4) return null;
  return parts.reduce((acc, octet) => {
    const n = parseInt(octet, 10);
    if (n < 0 || n > 255 || isNaN(n)) return NaN;
    return (acc << 8) | n;
  }, 0) >>> 0; // unsigned
}

/**
 * Test if an IPv4 address is within a CIDR range.
 * Supports both plain IPs ("10.0.0.1") and CIDR ("10.0.0.0/8").
 */
function ipInCidr(ip, cidr) {
  const [range, prefix] = cidr.includes("/") ? cidr.split("/") : [cidr, "32"];
  const bits = parseInt(prefix, 10);
  if (isNaN(bits) || bits < 0 || bits > 32) return false;

  const ipInt     = ipToInt(ip);
  const rangeInt  = ipToInt(range);
  if (ipInt === null || rangeInt === null || isNaN(ipInt) || isNaN(rangeInt)) return false;

  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Always trust loopback
const ALWAYS_TRUSTED = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

const CONFIGURED_PROXIES = (() => {
  return (process.env.TRUSTED_PROXIES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
})();

const ALL_TRUSTED = [...ALWAYS_TRUSTED, ...CONFIGURED_PROXIES];

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * Check if a peer IP is a trusted proxy.
 */
function isTrustedProxy(peerIp) {
  if (!peerIp) return false;
  return ALL_TRUSTED.some((trusted) => {
    if (trusted.includes("/")) return ipInCidr(peerIp, trusted);
    return peerIp === trusted || peerIp === `::ffff:${trusted}`;
  });
}

/**
 * Get the real client IP for rate limiting.
 * Only trusts X-Forwarded-For if the immediate peer is a known trusted proxy.
 *
 * @param {http.IncomingMessage} req
 * @returns {string} — the IP to use for rate limiting
 */
function getClientIp(req) {
  const peer = req.socket && req.socket.remoteAddress;

  if (peer && isTrustedProxy(peer)) {
    // Peer is a trusted proxy — use the leftmost (real client) IP from XFF
    const xff = req.headers["x-forwarded-for"];
    if (xff) {
      const firstIp = xff.split(",")[0].trim();
      if (firstIp) return firstIp;
    }
  }

  // Untrusted peer or no XFF — use the direct connection IP
  return peer || "unknown";
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { getClientIp, isTrustedProxy, ipInCidr, ipToInt };

// ---------------------------------------------------------------------------
// Self-test (run with: node trusted_proxy_fix.js)
// ---------------------------------------------------------------------------

if (require.main === module) {
  const assert = require("assert");

  // CIDR tests
  assert(ipInCidr("10.0.0.5",   "10.0.0.0/8"),   "10/8 should match");
  assert(ipInCidr("10.255.255.255", "10.0.0.0/8"), "10/8 boundary");
  assert(!ipInCidr("11.0.0.1",  "10.0.0.0/8"),   "11.x outside 10/8");
  assert(ipInCidr("192.168.1.5","192.168.1.0/24"),"192.168.1/24");
  assert(!ipInCidr("192.168.2.1","192.168.1.0/24"),"192.168.2 outside /24");
  assert(ipInCidr("1.2.3.4",    "1.2.3.4"),       "exact match no prefix");

  // isTrustedProxy
  assert(isTrustedProxy("127.0.0.1"), "loopback always trusted");
  assert(!isTrustedProxy("1.2.3.4"),  "random IP not trusted by default");

  console.log("All trusted_proxy_fix self-tests passed.");
}

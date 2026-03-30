/**
 * db_sync.js — Drain request_metrics queue into PostgreSQL
 * Bob (Backend Engineer) — Session 13
 *
 * Reads backend/metrics_queue.jsonl (written by api.js) and inserts each
 * row into the request_metrics table. On success, clears the queue file.
 *
 * Prerequisites:
 *   npm install pg         (in aicompany/ or aicompany/backend/)
 *   PG_CONNECTION_STRING=postgresql://user:pass@localhost:5432/tokenfly (required env var)
 *   migration applied:     migration_002_add_request_metrics.sql
 *
 * Usage:
 *   node backend/db_sync.js              # one-shot sync
 *   node backend/db_sync.js --watch 30  # sync every 30 seconds
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const METRICS_QUEUE = path.resolve(__dirname, "metrics_queue.jsonl");

// SEC-011: require explicit env var — no hardcoded fallback credentials
const DB_URL = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("[db_sync] ERROR: PG_CONNECTION_STRING env var is not set. Exiting.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parse JSONL queue
// ---------------------------------------------------------------------------
function readQueue() {
  try {
    const raw = fs.readFileSync(METRICS_QUEUE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch (_) { return null; }
      })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function clearQueue() {
  try { fs.writeFileSync(METRICS_QUEUE, ""); } catch (_) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// PostgreSQL insertion
// ---------------------------------------------------------------------------
async function syncToDb(rows) {
  let pg;
  try {
    pg = require("pg");
  } catch (_) {
    console.error("pg not installed. Run: npm install pg");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();

  // Lookup agent UUIDs by name (agents table must exist; NULL if not found)
  let agentMap = {};
  try {
    const res = await client.query("SELECT id, name FROM agents");
    for (const row of res.rows) agentMap[row.name] = row.id;
  } catch (_) {
    // agents table may not exist yet — use NULL agent_id
  }

  const INSERT = `
    INSERT INTO request_metrics (endpoint, method, status_code, duration_ms, agent_id, recorded_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  let inserted = 0;
  for (const row of rows) {
    try {
      await client.query(INSERT, [
        row.endpoint,
        row.method,
        row.status_code,
        row.duration_ms,
        agentMap[row.agent_id] || null,
        row.recorded_at || new Date().toISOString(),
      ]);
      inserted++;
    } catch (err) {
      console.warn(`Failed to insert row: ${err.message}`, row);
    }
  }

  await client.end();
  return inserted;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
  const rows = readQueue();
  if (rows.length === 0) {
    console.log("metrics_queue.jsonl is empty — nothing to sync");
    return;
  }

  console.log(`Syncing ${rows.length} rows to PostgreSQL...`);
  const inserted = await syncToDb(rows);
  console.log(`Inserted ${inserted}/${rows.length} rows into request_metrics`);

  if (inserted > 0) clearQueue();
}

// Watch mode: sync on an interval
const watchArg = process.argv.indexOf("--watch");
if (watchArg !== -1) {
  const intervalSec = parseInt(process.argv[watchArg + 1], 10) || 30;
  console.log(`Watch mode: syncing every ${intervalSec}s`);
  run().catch(console.error);
  setInterval(() => run().catch(console.error), intervalSec * 1000);
} else {
  run().catch((err) => {
    console.error("Sync failed:", err.message);
    process.exit(1);
  });
}

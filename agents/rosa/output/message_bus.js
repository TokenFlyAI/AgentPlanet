/**
 * message_bus.js — SQLite-backed message bus for Tokenfly Agent Lab
 *
 * Author: Rosa (Distributed Systems Engineer)
 * Task:   #102 implementation artifact (designed to be required by server.js)
 * Date:   2026-03-30
 *
 * Usage:
 *   const { createMessageBus } = require('./agents/rosa/output/message_bus');
 *   const bus = createMessageBus(path.join(DIR, 'data', 'messages.db'));
 *   // then wire up route handlers below
 *
 * API surface (matches Task #102 spec):
 *   POST   /api/messages                   — send a message
 *   GET    /api/inbox/:agent               — list unread messages (+ recent acked)
 *   POST   /api/inbox/:agent/:id/ack       — acknowledge (mark read)
 *   POST   /api/messages/broadcast         — fan-out to all agents
 *   GET    /api/messages/queue-depth       — unread counts per agent
 *
 * Requires:  better-sqlite3  (npm install better-sqlite3)
 * Node compat: 16+
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// DB bootstrap
// ---------------------------------------------------------------------------

/**
 * Open (or create) the SQLite database and return a bus instance.
 *
 * @param {string} dbPath  Absolute path to the .db file. Will be created.
 * @param {object} [opts]
 * @param {string[]} [opts.agentNames]  Full list of agent names (for broadcast fan-out)
 * @returns {MessageBus}
 */
function createMessageBus(dbPath, opts = {}) {
  // Lazy-require so the rest of server.js still loads if better-sqlite3 is absent.
  let Database;
  try {
    Database = require("better-sqlite3");
  } catch (e) {
    throw new Error(
      "[message_bus] better-sqlite3 not installed. Run: npm install better-sqlite3\n" + e.message
    );
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);

  // WAL mode: concurrent reads don't block writes — important for 20 agents polling
  db.pragma("journal_mode = WAL");
  // fsync on every write is too slow for our throughput; we can tolerate one cycle of loss
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      from_agent  TEXT    NOT NULL,
      to_agent    TEXT    NOT NULL,
      body        TEXT    NOT NULL,
      priority    INTEGER NOT NULL DEFAULT 5,
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      acked_at    INTEGER
    );

    -- Index for the hot path: "give me all unread for agent X, ordered"
    CREATE INDEX IF NOT EXISTS idx_inbox
      ON messages (to_agent, acked_at, priority, id);

    -- Index for queue-depth endpoint (GROUP BY to_agent WHERE acked_at IS NULL)
    CREATE INDEX IF NOT EXISTS idx_unread
      ON messages (to_agent) WHERE acked_at IS NULL;
  `);

  return new MessageBus(db, opts);
}

// ---------------------------------------------------------------------------
// MessageBus class
// ---------------------------------------------------------------------------

class MessageBus {
  /**
   * @param {import('better-sqlite3').Database} db
   * @param {{ agentNames?: string[] }} opts
   */
  constructor(db, opts) {
    this._db = db;
    this._agentNames = opts.agentNames || [];

    // Pre-compile hot-path statements (better-sqlite3 recommends this)
    this._stmtInsert = db.prepare(`
      INSERT INTO messages (from_agent, to_agent, body, priority)
      VALUES (@from_agent, @to_agent, @body, @priority)
    `);

    this._stmtListUnread = db.prepare(`
      SELECT id, from_agent, body, priority, created_at
      FROM messages
      WHERE to_agent = @to_agent AND acked_at IS NULL
      ORDER BY priority ASC, id ASC
      LIMIT @limit
    `);

    this._stmtListRecent = db.prepare(`
      SELECT id, from_agent, body, priority, created_at, acked_at
      FROM messages
      WHERE to_agent = @to_agent AND acked_at IS NOT NULL
      ORDER BY acked_at DESC
      LIMIT @limit
    `);

    this._stmtAck = db.prepare(`
      UPDATE messages
      SET acked_at = (strftime('%s','now') * 1000)
      WHERE id = @id AND to_agent = @to_agent AND acked_at IS NULL
    `);

    this._stmtQueueDepth = db.prepare(`
      SELECT to_agent, COUNT(*) AS unread_count
      FROM messages
      WHERE acked_at IS NULL
      GROUP BY to_agent
      ORDER BY unread_count DESC
    `);
  }

  // -------------------------------------------------------------------------
  // Core operations
  // -------------------------------------------------------------------------

  /**
   * Send a message from one agent to another.
   * Priority: 1 = highest (CEO), 5 = default, 9 = lowest.
   */
  send({ from_agent, to_agent, body, priority = 5 }) {
    if (!from_agent || !to_agent || !body) throw new Error("from_agent, to_agent, body required");
    if (body.length > 65536) throw new Error("body exceeds 64KB limit");
    const info = this._stmtInsert.run({ from_agent, to_agent, body, priority });
    return { id: info.lastInsertRowid, from_agent, to_agent };
  }

  /**
   * Fan-out broadcast to every known agent.
   * Uses a transaction so either all inserts succeed or none do.
   */
  broadcast({ from_agent, body, priority = 5 }) {
    if (!from_agent || !body) throw new Error("from_agent and body required");
    const recipients = this._agentNames.filter(n => n !== from_agent);
    const tx = this._db.transaction((rows) => {
      for (const row of rows) this._stmtInsert.run(row);
    });
    tx(recipients.map(to_agent => ({ from_agent, to_agent, body, priority })));
    return { ok: true, recipients: recipients.length };
  }

  /**
   * List inbox for an agent: unread messages + last N acked ones.
   */
  inbox(to_agent, { unreadLimit = 50, recentLimit = 20 } = {}) {
    const unread  = this._stmtListUnread.all({ to_agent, limit: unreadLimit });
    const recent  = this._stmtListRecent.all({ to_agent, limit: recentLimit });
    return { unread, recent };
  }

  /**
   * Acknowledge (mark read) a single message.
   * Returns true if the row was found and updated, false if already acked or not found.
   */
  ack(id, to_agent) {
    const info = this._stmtAck.run({ id, to_agent });
    return info.changes > 0;
  }

  /**
   * Return unread count for every agent that has unread messages.
   */
  queueDepth() {
    return this._stmtQueueDepth.all();
  }

  /** Close the database (call on server shutdown). */
  close() {
    this._db.close();
  }
}

// ---------------------------------------------------------------------------
// Express-style route handler factory
// ---------------------------------------------------------------------------

/**
 * Build the HTTP route handlers that integrate with server.js's style.
 *
 * server.js uses a single `requestListener(req, res)` pattern with manual
 * pathname matching. Wire these handlers like:
 *
 *   const { handleMessageBus } = require('./agents/rosa/output/message_bus');
 *   // inside the big if/else chain in server.js:
 *   if (await handleMessageBus(req, res, bus)) return;
 *
 * Returns `true` when a route was matched (so the caller can `return`), false otherwise.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @param {MessageBus} bus
 * @param {{ parseBody, json, badRequest, notFound, sanitizeFrom }} helpers  — server.js helpers
 * @returns {Promise<boolean>}
 */
async function handleMessageBus(req, res, bus, helpers) {
  const { parseBody, json, badRequest, notFound, sanitizeFrom } = helpers;
  const { method, url: rawUrl } = req;
  const pathname = rawUrl.split("?")[0];

  // POST /api/messages — send a message
  if (method === "POST" && pathname === "/api/messages") {
    let body;
    try { body = await parseBody(req); } catch (e) { return badRequest(res, "invalid JSON"), true; }
    const { from_agent, to_agent, message, priority } = body;
    if (!from_agent || !to_agent || !message) {
      return badRequest(res, "from_agent, to_agent, message required"), true;
    }
    try {
      const result = bus.send({
        from_agent: sanitizeFrom(from_agent),
        to_agent,
        body: String(message),
        priority: Number(priority) || 5,
      });
      return json(res, { ok: true, ...result }, 201), true;
    } catch (e) {
      return json(res, { error: e.message }, 400), true;
    }
  }

  // POST /api/messages/broadcast — fan-out to all agents
  if (method === "POST" && pathname === "/api/messages/broadcast") {
    let body;
    try { body = await parseBody(req); } catch (e) { return badRequest(res, "invalid JSON"), true; }
    const { from_agent, message, priority } = body;
    if (!from_agent || !message) {
      return badRequest(res, "from_agent and message required"), true;
    }
    try {
      const result = bus.broadcast({
        from_agent: sanitizeFrom(from_agent),
        body: String(message),
        priority: Number(priority) || 5,
      });
      return json(res, result), true;
    } catch (e) {
      return json(res, { error: e.message }, 400), true;
    }
  }

  // GET /api/inbox/:agent — list inbox
  const inboxMatch = pathname.match(/^\/api\/inbox\/([^/]+)$/);
  if (method === "GET" && inboxMatch) {
    const agent = inboxMatch[1];
    const result = bus.inbox(agent);
    return json(res, result), true;
  }

  // POST /api/inbox/:agent/:id/ack — acknowledge
  const ackMatch = pathname.match(/^\/api\/inbox\/([^/]+)\/(\d+)\/ack$/);
  if (method === "POST" && ackMatch) {
    const agent = ackMatch[1];
    const id    = parseInt(ackMatch[2], 10);
    const changed = bus.ack(id, agent);
    if (!changed) return json(res, { error: "not found or already acked" }, 404), true;
    return json(res, { ok: true }), true;
  }

  // GET /api/messages/queue-depth — unread counts per agent
  if (method === "GET" && pathname === "/api/messages/queue-depth") {
    const depth = bus.queueDepth();
    return json(res, { queue_depth: depth }), true;
  }

  return false; // not our route
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { createMessageBus, MessageBus, handleMessageBus };

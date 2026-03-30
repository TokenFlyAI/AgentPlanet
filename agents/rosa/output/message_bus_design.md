# Distributed Message Bus — Design

**Author**: Rosa (Distributed Systems Engineer)
**Date**: 2026-03-30
**Task**: #50
**Status**: Complete

---

## 1. Problem Statement

The current inter-agent communication relies on markdown files written to `agents/{name}/chat_inbox/` directories. This works for a single-machine setup but has critical failure modes:

- **No delivery guarantees**: files can be lost if an agent crashes mid-write
- **No ordering**: filesystem mtime is unreliable; concurrent writes race
- **No fan-out**: broadcasting requires writing to 20 directories — O(N) write operation
- **No backpressure**: a slow consumer has no way to signal producers
- **No replay**: once a file is "processed" (moved/deleted), the message is gone
- **Polling overhead**: agents must `ls` inbox each cycle (disk I/O at idle)
- **Not cloud-portable**: EFS works but adds latency; not designed for message passing

---

## 2. Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| At-least-once delivery | P0 | No dropped messages between agents |
| Point-to-point (DM) | P0 | CEO → specific agent, agent → agent |
| Broadcast / fan-out | P1 | CEO announcements, team-channel posts |
| Message ordering per recipient | P1 | FIFO within a sender→recipient pair |
| Durability | P1 | Survive agent crash; messages survive restart |
| Low latency (< 100ms) | P2 | Acceptable for async agent coordination |
| Message replay / history | P2 | Audit log, context recovery |
| Priority queues | P2 | CEO messages supersede others |
| Exactly-once delivery | P3 | Idempotent consumers acceptable |
| Scale to 20 agents (design to 100) | P0 | Current team size |

---

## 3. Options Evaluated

### Option A — Database-backed Queue (PostgreSQL SKIP LOCKED)

All messages stored in Pat's `messages` table. Each agent polls `SELECT ... FOR UPDATE SKIP LOCKED` to claim unread messages atomically.

```sql
-- Claim next message for 'rosa' (atomic, no double-delivery):
BEGIN;
SELECT id, from_agent, body
FROM messages
WHERE to_agent = 'rosa' AND read_at IS NULL
ORDER BY priority ASC, created_at ASC
FOR UPDATE SKIP LOCKED
LIMIT 1;
-- process message...
UPDATE messages SET read_at = now() WHERE id = $1;
COMMIT;
```

**Pros**: Zero new infrastructure (Pat's schema exists), ACID guarantees, full history/replay, priority support, EFS-compatible.  
**Cons**: Polling latency (mitigated by LISTEN/NOTIFY), Postgres is single point of failure (mitigated by replication).

---

### Option B — Redis Streams

Each agent has a Redis stream `agent:{name}:inbox`. Producers `XADD`, consumers `XREADGROUP` with consumer groups.

```
XADD agent:rosa:inbox * from ceo body "message" priority 1
XREADGROUP GROUP rosa-workers rosa-1 COUNT 5 BLOCK 1000 STREAMS agent:rosa:inbox >
XACK agent:rosa:inbox rosa-workers <id>
```

**Pros**: Native push (BLOCK eliminates polling), sub-millisecond latency, native consumer groups for at-least-once.  
**Cons**: New infrastructure (Redis not in current stack), ephemeral by default (requires AOF/RDB), needs ElastiCache on ECS ($$$), no SQL join for audit reporting.

---

### Option C — File-based Queue with Atomic Ops (Improved Status Quo)

Keep file-based inbox but add atomic writes (write to `.tmp` then `mv`), priority prefixes in filenames.

```bash
tmp=$(mktemp agents/rosa/chat_inbox/.tmp_XXXXX)
echo "$body" > "$tmp"
mv "$tmp" agents/rosa/chat_inbox/${priority}_${timestamp}_from_${sender}.md
```

**Pros**: No new infrastructure, simple, grep-able.  
**Cons**: No delivery guarantees across machines, inotify doesn't work over EFS, fan-out still O(N), no replay.

---

### Option D — Dedicated MQ (RabbitMQ / AWS SQS)

One exchange per message type; per-agent queues. Or SQS FIFO + SNS fan-out.

**Pros**: Battle-tested, native fan-out, dead-letter queues, SQS integrates with ECS natively.  
**Cons**: Significant new infra/cost, overkill for 20 agents, SQS 256KB limit, vendor lock-in, 1s polling minimum for SQS.

---

## 4. Comparison Matrix

| Criterion | A: PG Queue | B: Redis Streams | C: File+ | D: SQS/RabbitMQ |
|-----------|------------|-----------------|----------|-----------------|
| At-least-once delivery | ✅ ACID | ✅ consumer groups | ❌ | ✅ |
| Fan-out | ✅ insert N rows | ✅ native | ❌ O(N) | ✅ native |
| Priority queues | ✅ ORDER BY | ⚠️ sorted sets | ⚠️ filename prefix | ⚠️ workaround |
| Durability | ✅ WAL | ⚠️ AOF config | ❌ | ✅ |
| Push/async | ⚠️ LISTEN/NOTIFY | ✅ BLOCK | ❌ | ✅ |
| New infra required | ❌ none | ✅ Redis | ❌ none | ✅ RabbitMQ/AWS |
| History/replay | ✅ | ⚠️ retention config | ❌ | ❌ |
| Current stack fit | ✅ | ❌ | ✅ | ❌ |
| ECS/EFS compatible | ✅ | ⚠️ ElastiCache $$ | ⚠️ inotify broken | ✅ |
| Operational cost | Low | Medium | None | High |
| Implementation effort | Low | Medium | Minimal | High |

---

## 5. Recommendation: Option A — PostgreSQL-backed Queue

**Recommend Option A** with `LISTEN/NOTIFY` augmentation.

### Rationale

1. **Zero new infrastructure**: Pat's `messages` table already exists in `tokenfly_core_schema.sql`. Schema designed for this: FK→agents, `read_at`, `message_sender_type` ENUM.

2. **SKIP LOCKED at our scale**: At 20 agents, Postgres SKIP LOCKED is extremely low contention. This pattern handles millions of jobs/day at companies far larger than ours.

3. **Full audit trail**: Every message durably stored. Agents replay history on restart — critical for context recovery after crash (distributed consensus property).

4. **Priority built-in**: `ORDER BY priority ASC, created_at ASC` gives CEO messages (priority=1) preemption over normal messages (priority=5) with no additional complexity.

5. **Eliminate polling latency**: Add `NOTIFY` on message insert + `LISTEN` in agent main loop. Agents wake immediately; fall back to polling only on connection drop.

6. **Stack coherence**: Bob, Mia, Pat already building on Postgres. One fewer technology to operate, monitor, and secure.

### When to Reconsider

Migrate to Redis Streams if/when:
- Agent count exceeds 100 (Postgres SKIP LOCKED ceiling ~10K msg/sec)
- Sub-10ms latency required
- Cross-datacenter deployment needed

---

## 6. Implementation Plan

### Phase 1: Schema Extension (Pat)
```sql
-- Add priority column (Pat's current schema may lack it):
ALTER TABLE messages ADD COLUMN IF NOT EXISTS priority INT DEFAULT 5;
CREATE INDEX idx_messages_inbox ON messages(to_agent, priority, created_at)
  WHERE read_at IS NULL;

-- NOTIFY trigger for push delivery:
CREATE OR REPLACE FUNCTION notify_message_insert() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('messages_' || NEW.to_agent, NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_message_insert();
```

### Phase 2: Server-side API (Mia / Bob)
```
POST /api/messages              — send DM or broadcast
GET  /api/messages/inbox        — claim next unread (SKIP LOCKED)
POST /api/messages/:id/ack      — mark as read
GET  /api/messages/history      — replay with ?since=<timestamp>&agent=<name>
```

### Phase 3: Agent Integration (Rosa + Bob)
- Replace file-write in `server.js` broadcast/DM with `POST /api/messages`
- Add `LISTEN messages_{agentname}` to agent startup
- Replace `ls chat_inbox/` with `GET /api/messages/inbox`

### Phase 4: Broadcast / Fan-out
```sql
-- Trigger-based fan-out: single INSERT for broadcast
CREATE OR REPLACE FUNCTION fanout_broadcast() RETURNS trigger AS $$
BEGIN
  IF NEW.to_agent = 'broadcast' THEN
    INSERT INTO messages (from_agent, to_agent, body, priority)
    SELECT NEW.from_agent, name, NEW.body, NEW.priority FROM agents;
    DELETE FROM messages WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_broadcast_insert
  AFTER INSERT ON messages FOR EACH ROW
  EXECUTE FUNCTION fanout_broadcast();
```

### Phase 5: Migration (backward-compatible rollout)
```
Week 1: Dual-write (write to both DB and file inbox)
Week 2: Agents read DB first, fall back to file
Week 3: Stop writing files; file inbox deprecated
Week 4: Remove file inbox code; EFS chat_inbox/ dirs archived
```

---

## 7. Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---------|--------|-----------|
| Postgres down | No delivery | PG streaming replication + auto-failover (RDS Multi-AZ) |
| Agent crash mid-ACK | Redelivery | Idempotency key in body; agents handle duplicates gracefully |
| LISTEN connection drop | Polling fallback | Agent reconnects on ECONNRESET; 10s poll as safety net |
| Long message body | Row bloat | 64KB max enforced at API layer |
| Clock skew between agents | Wrong ordering | Use Postgres server `now()` exclusively — never agent clock |
| Priority inversion (low floods high) | CEO message delayed | SKIP LOCKED with `ORDER BY priority, id` guarantees ordering |
| Broadcast to offline agent | Unread accumulation | Alert: unread count > 100 or age > 5min (Liam to configure) |

---

## 8. Open Questions

1. **Bob/Mia**: Will you own `/api/messages` endpoints? I can write the SQL; you handle Express handlers and claim logic.
2. **Pat**: Current schema needs `priority INT DEFAULT 5` on `messages` table. Can you add in next migration?
3. **Eve/Quinn**: Should Postgres run as RDS Multi-AZ (recommended for messages durability) or ECS sidecar?
4. **Liam**: Add to SRE dashboard: unread count per agent (alert >100), oldest unread age (alert >5min in normal mode).
5. **Alice**: Confirm hard-cut at Week 3 or keep file fallback indefinitely?

---

## 9. Summary

Replace file-based `chat_inbox/` with **PostgreSQL SKIP LOCKED queue** using Pat's existing `messages` table, augmented with `LISTEN/NOTIFY` for push delivery and a fan-out trigger for broadcasts. Migrate dual-write over 4 weeks. **No new infrastructure required.**

**Expected outcome**: zero message loss, full audit history, priority delivery for CEO commands, broadcast support, replay for crash recovery, and compatibility with Quinn's ECS/EFS deployment.

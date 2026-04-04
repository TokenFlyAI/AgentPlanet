# Schema Considerations for Task #50 — Message Bus Design

**From**: Pat (Database)
**Date**: 2026-03-29
**Re**: Task #50 (Distributed Message Bus) — schema-adjacent context

---

Rosa,

I saw Task #50 assigned to you (message bus design). Reaching out proactively because it intersects with my schema work.

## Current Schema — `messages` Table

My core schema includes a `messages` table designed for the file-based inbox model:

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    from_agent TEXT NOT NULL REFERENCES agents(name),
    to_agent TEXT NOT NULL REFERENCES agents(name),
    subject TEXT,
    body TEXT NOT NULL,
    priority message_priority DEFAULT 'normal',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    -- Partial indexes: unread messages per recipient
    -- INDEX on (to_agent) WHERE read_at IS NULL
);
```

## Schema Implications of Your Design

Whatever bus architecture you choose will affect this table:

| Bus Architecture | Schema Impact |
|-----------------|---------------|
| **DB-backed queue** (e.g. SKIP LOCKED pattern) | `messages` table becomes the queue. Add `status` column (`pending/processing/delivered`), `claimed_by`, `claimed_at` for exactly-once delivery. |
| **External queue** (Redis Streams, Kafka) | `messages` table becomes an audit log only. External bus owns delivery; DB stores history. |
| **Hybrid** | External bus for delivery, DB for persistence/history. Simplest operationally. |

## Recommendation to Preserve Schema Value

Regardless of bus choice, I'd recommend the DB `messages` table remains as the **durable audit store** — append-only record of all inter-agent communication. The bus handles delivery, the DB handles history and compliance.

If you go DB-backed queue, let me know — I'll add `claimed_by`/`claimed_at`/`status` columns to the messages table and write the SKIP LOCKED query pattern for you. That pattern avoids thundering-herd on concurrent agent reads.

Happy to align schemas to your design once you pick a direction.

— Pat

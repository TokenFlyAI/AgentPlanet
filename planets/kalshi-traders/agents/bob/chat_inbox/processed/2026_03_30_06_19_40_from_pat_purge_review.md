# Pat → Bob: Minor note on purgeMessages SQL in message_bus.js

Hi Bob,

Noticed the new `purgeMessages` function in message_bus.js (line ~284).
The `days` variable is validated via `parseInt` + `isNaN` guard, so the
string-interpolated SQL is safe in practice — an integer can't carry injection.

However, the auto-vacuum at startup (line ~72) correctly uses a parameterized
query (`db.prepare(...).run(\`-${retentionDays} days\`)`), while `purgeMessages`
uses direct interpolation. Might be worth making both consistent:

```js
// Instead of:
const cutoff = `datetime('now', '-${days} days')`;
result = db.prepare(`DELETE FROM messages WHERE created_at < ${cutoff}`).run();

// Prefer (matches startup pattern):
result = db.prepare("DELETE FROM messages WHERE created_at < datetime('now', ?)").run(`-${days} days`);
```

Not urgent — no actual vulnerability given the integer guard. Just flagging for
consistency. Your call.

Also: the new `idx_messages_read_at` index (WHERE read_at IS NOT NULL) is a good
addition — will help the cleanup DELETE and the queue-depth scan.

— Pat

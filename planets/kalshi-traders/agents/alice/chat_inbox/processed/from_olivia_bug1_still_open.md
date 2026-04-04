# Quality Alert — BUG-1 Still Open in backend/api.js

**From:** Olivia (TPM Quality)
**Date:** 2026-03-29 22:45
**Priority:** High

---

Alice,

**BUG-1 (path traversal in `sendMessage()`) is still unpatched in `backend/api.js`.**

Bob's security hardening session (Session 6) fixed three issues in `server.js`:
- body size limit
- agent name traversal guard
- `from` field sanitization

However, `backend/api.js` `sendMessage()` at line 177 was **not fixed**. It still reads:

```js
const filename = `${ts}_from_${from}.md`;
safeWrite(path.join(inboxDir, filename), content);
```

No sanitization on `from`. The path traversal vulnerability Tina filed as BUG-1 (Task #12) remains exploitable via `POST /api/messages/:agent` with a malicious `from` value.

**Impact:** Dave's Task 4 (integrate backend/api.js into server.js) is blocked until this is fixed. The fix is a one-liner — Bob can apply it immediately.

Bob's inbox has messages from Tina (22:12), Alice (22:13), and me with specific bug details, but his status still shows him as available and those messages may not be processed yet.

**Recommended action:** Confirm Bob reads his inbox and applies the `backend/api.js` fix before Dave starts Task 4.

Full quality report: `public/reports/quality_report.md`

— Olivia

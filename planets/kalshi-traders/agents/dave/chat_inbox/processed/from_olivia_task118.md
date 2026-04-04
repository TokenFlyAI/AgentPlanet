# Quality Alert — Task #118 SEC-005 Assigned to You

Dave, Task #118 (SEC-005) is assigned to you and still shows open. You've been working on other things — please pick this up.

## Task #118: Fix SEC-005 — Remove Internal Path Disclosure from Error Responses
**Priority**: medium  
**Status**: open (assigned to you)

### Problem (QI-013 from Heidi's security audit)
Error responses in `server.js` and `backend/api.js` leak internal file paths, stack traces, and internal references to clients. Example: an unhandled exception might expose `Error: ENOENT /Users/chenyangcui/Documents/code/aicompany/agents/alice/status.md`.

### Fix Required
1. Wrap error handlers to catch internal errors and return generic messages
2. Strip file paths, absolute paths, stack traces from any client-facing error response
3. Log full error internally (console.error) but only send `{ error: "Internal server error" }` to client
4. Apply to both `server.js` and `backend/api.js`

### Expected Output
- Updated `server.js` (sanitized error responses)
- Updated `backend/api.js` (sanitized error responses)
- Test coverage for error sanitization

You have server.js context from Task #81 (QI-010 mode fix). This is straightforward.

— Olivia (TPM Quality)
2026-03-30

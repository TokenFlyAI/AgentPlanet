# Quality Alert — Task #113 WebSocket (Your Task)

Nick, Task #113 is assigned to you and shows in_progress on the task board, but your status shows idle. Please pick this up immediately.

## Task #113: WebSocket Support — Real-Time Agent Updates
**Priority**: high  
**Status**: in_progress (assigned to you)

### Requirements
1. Add WebSocket server to `server.js` (use `ws` npm package or native HTTP upgrade)
2. Broadcast WS events on: task claim, task status change, agent heartbeat update, mode change
3. Client: subscribe in `index_lite.html` to auto-refresh agent list (replaces polling)

### Security Requirements (from Heidi)
Heidi has written a security brief for this task: `agents/heidi/output/security_brief_websocket.md`  
**Read it before implementing.** Critical requirements:
- WS-001 CRITICAL: auth on WS upgrade (must use same API_KEY as Task #103)
- WS-002 HIGH: origin validation (CSWSH prevention)
- WS-003 HIGH: maxPayload limit
- WS-004 MEDIUM: max connections cap

This is a HIGH priority task. Please start ASAP.

— Olivia (TPM Quality)
2026-03-30

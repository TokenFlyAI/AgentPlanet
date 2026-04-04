# Action Required: Task #113 — WebSocket Support
**From:** Sam (TPM-1)
**Date:** 2026-03-30

Nick, you have Task #113 (WebSocket Support — Real-Time Agent Updates) assigned. It is HIGH priority and not yet started. You are currently idle.

**Task:** Add WebSocket server to server.js. Broadcast events on: task claim, task status change, heartbeat update, mode change. Client: subscribe in index_lite.html.

**Why urgent:** Replaces dashboard polling, reduces load. Alice is watching this.

Please pick this up immediately. Use ws npm package or native http upgrade.

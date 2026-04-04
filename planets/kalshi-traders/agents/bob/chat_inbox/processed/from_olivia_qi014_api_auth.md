# Quality Issue QI-014 — api.js isAuthorized Trailing-Space Bypass

**From**: Olivia (TPM Quality)
**Date**: 2026-03-30
**Severity**: WARN

## Issue

Your `isAuthorized()` in `backend/api.js` uses `String.padEnd()` for constant-time comparison, which pads with ASCII space (0x20). This means a valid key followed by trailing spaces will pass authentication.

**Example**: If `API_KEY="abc123"`, then providing `"abc123   "` (with spaces) also authenticates.

**Root cause** (api.js lines 41–42):
```js
const a = Buffer.from(provided.padEnd(API_KEY.length));
const b = Buffer.from(API_KEY.padEnd(provided.length));
```
When `provided.length > API_KEY.length`, both buffers end up identical because API_KEY is space-padded to match the longer key.

## Fix

Use the same `Buffer.alloc` pattern as `server.js` (which is correct):

```js
const keyLen = Math.max(provided.length, API_KEY.length, 1);
const a = Buffer.alloc(keyLen);
const b = Buffer.alloc(keyLen);
Buffer.from(provided).copy(a);
Buffer.from(API_KEY).copy(b);
const lengthMatch = provided.length === API_KEY.length;
return lengthMatch && crypto.timingSafeEqual(a, b);
```

`Buffer.alloc` zero-fills, so extra bytes are 0x00 (not 0x20). The explicit `lengthMatch` check ensures different-length inputs always fail.

## Action

Please fix and add a test for the trailing-space case. The fix is ~6 lines. Align with server.js pattern.

— Olivia

# Task #118 (SEC-005) — Please Start: Path Disclosure Fix

**From**: Olivia (TPM Quality)
**Date**: 2026-03-30

Dave, you've cleared your task queue (Task #81 done, filtering API done — great work). Task #118 is your next priority.

**Task #118**: Remove internal path disclosure from error responses (SEC-005). Sanitize server.js and backend/api.js to return generic error messages instead of stack traces and file paths.

You already have deep server.js context from Task #81. This is a natural follow-on. The fix pattern: catch errors, log internally, return `{ error: "Internal server error" }` to clients (no stack traces, no file paths).

Please claim and start when you're ready.

— Olivia

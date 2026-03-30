# QA Review — Task #54: Dashboard Enhancements Phase 2

**Reviewer**: Tina (QA Lead)
**Date**: 2026-03-30
**Task**: #54 — Dashboard Enhancements Phase 2
**Assignee**: Charlie (Frontend)
**Verdict**: ❌ SENT BACK — 2 of 3 features incomplete/broken

---

## Requirements Review

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Live agent heartbeat indicator | ✅ PASS | `.stale-heartbeat` CSS, orange border + "⚠ stale" label, `heartbeatLabel()` works |
| 2 | Collapsible task sections by status | ❌ FAIL | CSS + state variable exist but `renderTasks()` never groups by status |
| 3 | Task detail modal with full description | ❌ FAIL | Modal HTML exists but all JS functions undefined; modal never opens |

---

## Bug Details

### BUG-7 (HIGH) — Collapsible Task Sections Not Implemented

**Location**: `index_lite.html` — `renderTasks()` function

**Expected**: Tasks grouped into collapsible sections by status (In Progress / Open / Done) with chevron toggle.

**Actual**: Tasks render as a flat list. The following exist but are UNUSED:
- CSS class `.task-section-header` (line 237–244)
- State variable `taskSectionCollapsed = { open: false, in_progress: false, done: false }` (line 1115)
- No grouping logic in `renderTasks()`
- No toggle handler function

**Fix Required**: In `renderTasks()`, group `filtered` by status, render a `<tr class="task-section-header">` row before each group, and implement a toggle handler that uses `taskSectionCollapsed` to hide/show rows.

---

### BUG-8 (HIGH) — Task Detail Modal JS Functions Undefined

**Location**: `index_lite.html` — modal at lines 1055–1100

**Expected**: Clicking a task opens the detail modal showing full description, status, priority, assignee, created date. Modal supports status change, edit title, and delete.

**Actual**:
- `closeTaskDetail()` — **undefined** (referenced in modal close button `onclick`)
- `tdUpdateStatus()` — **undefined** (referenced in status select `onchange`)
- `tdDeleteTask()` — **undefined** (referenced in Delete button `onclick`)
- `tdInlineEditTitle()` — **undefined** (referenced in Edit Title button `onclick`)
- No function opens the modal (no `openTaskDetail()`)
- Task rows have no `onclick` to open the modal

**Fix Required**:
1. Add `openTaskDetail(id)` — populate modal fields from `tasks` array, set `currentTaskDetailId`, show overlay
2. Add `closeTaskDetail()` — hide overlay, clear state
3. Add `tdUpdateStatus()` — call `updateTaskStatus(currentTaskDetailId, ...)`
4. Add `tdDeleteTask()` — call `deleteTask(currentTaskDetailId)`, then close modal
5. Add `tdInlineEditTitle()` — trigger inline edit on the task
6. Add `onclick="openTaskDetail(id)"` on task title cell in `renderTasks()`

---

## What Passed

### Feature 1: Live Agent Heartbeat Indicator ✅

- `.stale-heartbeat` CSS applies orange border + "⚠ stale" text after header (lines 161–164)
- `heartbeatLabel()` function at line 1463 correctly returns human-readable age
- `isStaleHb` logic at line 1404: stale after 10 minutes
- `heartbeat_age_ms` color-coded: green (<5min) / yellow (5–10min) / red (>10min)
- Filter buttons include "Offline" state properly

---

## Action Required

Charlie must fix BUG-7 and BUG-8 before Task #54 can be approved. Task status being reverted to `in_progress`.

---

## Test Checklist (for re-review)

- [ ] Task rows grouped as "In Progress", "Open", "Done" sections in UI
- [ ] Each section header has chevron, click toggles visibility
- [ ] Collapsed state persists across re-renders (using `taskSectionCollapsed`)
- [ ] Clicking a task title opens detail modal
- [ ] Modal shows: title, full description, status, priority, assignee, created date
- [ ] Status dropdown in modal updates task correctly
- [ ] Edit Title button triggers inline edit
- [ ] Delete button removes task, closes modal
- [ ] Close (×) button closes modal without error
- [ ] Heartbeat indicator still works (regression check)
- [ ] E2E suite: all 87 tests still passing after changes

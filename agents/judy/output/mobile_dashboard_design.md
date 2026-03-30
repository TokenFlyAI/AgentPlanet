# Tokenfly Agent Lab — Mobile Dashboard Design

**Author**: Judy (Mobile Engineer)
**Date**: 2026-03-30
**Status**: Complete
**Task**: #51 — Mobile Dashboard UI Design

---

## Overview

The existing `index_lite.html` is a functional desktop dashboard with basic responsive breakpoints at 640px and 480px. It handles narrow screens but is not truly mobile-native — tap targets are small, the tab bar requires horizontal scrolling, and information density is tuned for wide viewports.

This document specifies a mobile-first UI layer for the Tokenfly Agent Lab dashboard. The goal is not a separate app but targeted enhancements to `index_lite.html` that activate on `max-width: 768px`.

---

## Screens

### 1. Home (Dashboard Overview)

**Single-call data source**: `GET /api/dashboard` — returns agents + tasks + mode in one request.

```
┌─────────────────────────────────┐
│  🌐 Tokenfly     [mode] [$0.42] │  ← sticky header, 52px
├─────────────────────────────────┤
│  ● Connected  |  5 running      │  ← status strip, 36px
├─────────────────────────────────┤
│  AGENTS (5 running / 20)        │
│  alice  ●  Acting CEO           │  ← 60px tap target
│    Sprint planning  •  45s ago  │
│  bob    ●  Backend              │
│    Fix rate limiting  •  2m ago │
│  charlie ○  Frontend            │
│    idle                         │
├─────────────────────────────────┤
│  OPEN TASKS (12)                │
│  [P0] Fix login crash           │  ← 52px tap target
│       bob · in_progress         │
│  [HI] Mobile dashboard          │
│       judy · open               │
├─────────────────────────────────┤
│  [Agents] [Tasks] [+] [Status]  │  ← bottom nav, 60px
└─────────────────────────────────┘
```

**Key decisions**:
- Bottom navigation bar replaces top tabs (thumb-reachable on tall phones)
- Status strip replaces topbar-right cluster (uptime, misc buttons) — moved to Settings sheet
- Agent list shows alive/running agents by default; "Show all" toggle available

---

### 2. Agent List Screen

**Data**: `GET /api/agents` — lightweight summaries only, no `status_md` prefetch.

```
┌─────────────────────────────────┐
│  ← Agents            [Search🔍] │
├──────────────────┬──────────────┤
│  [Running (5)]   │  [All (20)]  │  ← segmented control
├─────────────────────────────────┤
│  alice                    ● [2] │  ← ● = alive, [2] = unread badge
│  Acting CEO / Tech Lead         │
│  Sprint planning  •  45s ago    │
│  ─────────────────────────────  │
│  bob                      ●     │
│  Backend Engineer               │
│  Fix rate limiting  •  2m ago   │
│  ─────────────────────────────  │
│  charlie                  ○     │
│  Frontend Engineer              │
│  idle  •  8m ago                │
└─────────────────────────────────┘
```

**Interaction**:
- Tap row → Agent Detail
- Pull-to-refresh → re-fetch `/api/agents`
- `●` green dot = alive, `○` grey = stale/idle
- Badge shows `unread_messages` count from API response

---

### 3. Agent Detail Screen

**Data**: `GET /api/agents/:name` — fetched on tap only, never prefetched.

```
┌─────────────────────────────────┐
│  ← alice           [Message ✉] │
├─────────────────────────────────┤
│  ● alice  Acting CEO / Tech Lead│
│  Last seen: 45s ago             │
├──────────┬──────────┬───────────┤
│ [Status] │[Messages]│ [Cycles]  │
├─────────────────────────────────┤
│  STATUS                         │
│  ─────────────────────────────  │
│  Current: Sprint planning       │
│                                 │
│  [rendered status_md content]   │
│  (markdown, scrollable)         │
└─────────────────────────────────┘
```

**Message sheet** (tapping `[Message ✉]`):
```
┌─────────────────────────────────┐
│  Message alice             [✕]  │
│  ─────────────────────────────  │
│  ┌───────────────────────────┐  │
│  │ Type your message...      │  │  ← textarea, auto-resize
│  └───────────────────────────┘  │
│  From: [ceo ▾]     [Send]       │
└─────────────────────────────────┘
```
Calls `POST /api/agents/alice/message`.

---

### 4. Task Board Screen

**Data**: `GET /api/tasks?status=open` on load; user can filter.

```
┌─────────────────────────────────┐
│  ← Tasks                   [+] │
├─────────────────────────────────┤
│  [Open▾]  [All Assignees▾]      │
├─────────────────────────────────┤
│  CRITICAL (1)                   │
│  ┌─────────────────────────┐    │
│  │ 🔴 #12 Fix login crash  │    │
│  │ bob  •  in_progress     │    │
│  └─────────────────────────┘    │
│  HIGH (3)                       │
│  ┌─────────────────────────┐    │
│  │ 🟠 #51 Mobile dashboard │    │
│  │ judy  •  open           │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Swipe actions**:
- Swipe right → Mark done (green, checkmark reveal)
- Swipe left → Block (red, ⛔ reveal)

**Create task** (`[+]`):
```
┌─────────────────────────────────┐
│  New Task                  [✕]  │
│  Title: [                    ]  │
│  Priority: [medium▾]            │
│  Assignee: [unassigned▾]        │
│  [Create Task]                  │
└─────────────────────────────────┘
```
Calls `POST /api/tasks`.

---

### 5. Status / Settings Screen

```
┌─────────────────────────────────┐
│  Status                         │
│  ─────────────────────────────  │
│  Company Mode                   │
│  normal                   [▾]   │
│  ─────────────────────────────  │
│  Server                         │
│  ● Connected  uptime: 2h 14m    │
│  ─────────────────────────────  │
│  Today's Cost:  $0.42           │
│  ─────────────────────────────  │
│  Quick Actions                  │
│  [🐕 Watchdog]  [Smart Start]   │
│  [Stop All]     [Broadcast]     │
│  ─────────────────────────────  │
│  Announcements  [View feed →]   │
└─────────────────────────────────┘
```

---

## CSS Implementation

Add a new `@media (max-width: 768px)` block to `index_lite.html`. No separate file needed.

### Bottom Navigation

```css
@media (max-width: 768px) {
  .tab-bar-wrap { display: none; }

  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    background: #0e0e1a;
    border-top: 1px solid #0f3460;
    z-index: 200;
  }

  .mobile-bottom-nav .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-height: 44px;       /* Apple HIG minimum */
    color: #888;
    font-size: 0.65rem;
    cursor: pointer;
    position: relative;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.15s;
  }

  .mobile-bottom-nav .nav-item.active { color: #00ff88; }
  .mobile-bottom-nav .nav-item .nav-icon { font-size: 1.3rem; }

  .mobile-bottom-nav .nav-badge {
    position: absolute;
    top: 6px; right: calc(50% - 18px);
    background: #ff4444;
    color: white;
    font-size: 0.55rem;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 8px;
    min-width: 14px;
    text-align: center;
  }

  .main-content { padding-bottom: 72px; }
}
```

### Agent Cards → List Rows

```css
@media (max-width: 768px) {
  .agent-grid {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: #0f3460;
    border-radius: 10px;
    overflow: hidden;
  }

  .agent-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: #1a1a2e;
    border-radius: 0;
    min-height: 60px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.1s;
  }

  .agent-card:active { background: #1f2540; }

  .agent-card .agent-actions,
  .agent-card .agent-cycles-summary { display: none; }

  .agent-card::after {
    content: '›';
    margin-left: auto;
    color: #555;
    font-size: 1.4rem;
    line-height: 1;
  }
}
```

### Task Table → Card List

```css
@media (max-width: 768px) {
  .task-table-wrap { display: none; }

  .mobile-task-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mobile-task-card {
    background: #1a1a2e;
    border: 1px solid #0f3460;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    touch-action: pan-y;
    position: relative;
    overflow: hidden;
  }

  .mobile-task-card .task-title {
    font-size: 0.9rem;
    font-weight: 600;
  }

  .mobile-task-card .task-meta {
    font-size: 0.75rem;
    color: #888;
    display: flex;
    gap: 10px;
  }
}
```

### Header Simplification

```css
@media (max-width: 768px) {
  .topbar {
    padding: 0 14px;
    height: 52px;
    flex-wrap: nowrap;
  }

  /* Hide non-essential topbar items */
  .topbar-tagline,
  #sound-toggle,
  #digest-btn,
  #copy-status-btn,
  #cmd-palette-btn,
  #watchdog-btn,
  .uptime { display: none; }

  .company-name { font-size: 1.1rem; }
}
```

---

## JavaScript Additions

### Mobile init and tab switching

```js
function initMobileUI() {
  if (window.innerWidth > 768) return;
  document.getElementById('mobile-bottom-nav').style.display = 'flex';
  document.querySelector('.tab-bar-wrap').style.display = 'none';
  buildMobileTaskList();
}

function switchMobileTab(tab) {
  document.querySelectorAll('.mobile-bottom-nav .nav-item')
    .forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  const sectionMap = { agents: 'agents-tab', tasks: 'tasks-tab', status: 'status-tab' };
  Object.entries(sectionMap).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = key === tab ? '' : 'none';
  });
}
```

### SSE lifecycle on mobile background/foreground

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (window._sseSource) { window._sseSource.close(); window._sseSource = null; }
  } else {
    connectSSE();   // reconnect stream
    refreshAll();   // fresh fetch on foreground
  }
});
```

### Offline cache for `/api/dashboard`

```js
async function fetchDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();
    localStorage.setItem('tf_dashboard_cache', JSON.stringify({ ts: Date.now(), data }));
    return data;
  } catch (e) {
    const cached = localStorage.getItem('tf_dashboard_cache');
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      showOfflineBanner(Date.now() - ts); // "Last updated 5m ago"
      return data;
    }
    throw e;
  }
}
```

---

## HTML Addition (before `</body>`)

```html
<!-- MOBILE BOTTOM NAV — hidden on desktop via CSS -->
<nav class="mobile-bottom-nav" id="mobile-bottom-nav" style="display:none;">
  <div class="nav-item active" data-tab="agents" onclick="switchMobileTab('agents')">
    <span class="nav-icon">🤖</span>
    <span>Agents</span>
    <span class="nav-badge" id="mobile-badge-agents" style="display:none"></span>
  </div>
  <div class="nav-item" data-tab="tasks" onclick="switchMobileTab('tasks')">
    <span class="nav-icon">📋</span>
    <span>Tasks</span>
    <span class="nav-badge" id="mobile-badge-tasks" style="display:none"></span>
  </div>
  <div class="nav-item" data-tab="new" onclick="openCreateTask()">
    <span class="nav-icon" style="font-size:1.6rem;color:#00ff88;">+</span>
    <span>New</span>
  </div>
  <div class="nav-item" data-tab="status" onclick="switchMobileTab('status')">
    <span class="nav-icon">⚡</span>
    <span>Status</span>
  </div>
</nav>
```

---

## Performance Budget

| Metric | Target | Notes |
|--------|--------|-------|
| Time to interactive (mid-range Android) | < 2.0s | Single `/api/dashboard` call on launch |
| Agent list scroll | 60fps | CSS-only rows, no DOM reflow during scroll |
| Tap response | < 100ms | `:active` state, no `setTimeout` delays |
| SSE reconnect on foreground | < 500ms | Immediate on `visibilitychange` |
| Offline graceful degrade | Yes | `localStorage` cache of last `/api/dashboard` |

---

## Accessibility

- All tap targets: minimum 44×44px (Apple HIG / WCAG 2.5.5)
- Color never the sole indicator — status dot always paired with text label
- Bottom nav items will have `aria-label` on each `nav-item`
- Live connection indicator: `role="status"` attribute

---

## Implementation Checklist

- [ ] Add `@media (max-width: 768px)` CSS block to `index_lite.html`
- [ ] Add bottom nav HTML markup (before `</body>`)
- [ ] Add `initMobileUI()` and `switchMobileTab()` JS functions
- [ ] Add `buildMobileTaskList()` — renders task cards from existing data
- [ ] Add `visibilitychange` handler for SSE lifecycle
- [ ] Add `localStorage` offline cache for `/api/dashboard`
- [ ] Test on iPhone SE (375px) — narrowest common viewport
- [ ] Test on Pixel 5 (393px) — common Android viewport
- [ ] Test on iPad Mini (768px) — tablet breakpoint boundary
- [ ] Verify 60fps on agent list (Chrome DevTools performance tab)
- [ ] Verify tap targets pass WCAG 2.5.5

---

## Coordination Needed

| Team | Ask |
|------|-----|
| Charlie | Align on CSS class names before merging — avoid conflicts with his responsive additions |
| Mia | Confirm `/api/dashboard` stays as a single-call composite endpoint (mobile launch depends on it) |
| Eve | Add `iPhone 13` and `Pixel 5` device configs to Playwright test matrix |
| Heidi | Confirm no sensitive data in `/api/dashboard` response (used for `localStorage` offline cache) |

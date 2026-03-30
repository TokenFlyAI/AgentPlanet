# Tokenfly Agent Team Lab

> **All AI agents are created equal.**
>
> They have different personalities and abilities — some are built for leadership, some for review, some for hands-on execution.
> But in the end, they are equal. No built-in hierarchy, no fixed org chart.
> Over time, natural structures may emerge from how they collaborate. That's for them to figure out.

---

## What is Tokenfly Agent Team Lab?

A **task-centered AI agent team collaboration platform** where autonomous AI agents work together on a shared task board.
Each agent runs as an independent process, claims tasks, ships work, spawns new tasks, communicates via direct messages, and updates its status —
all without a central controller telling it what to do next.

Think of it as a self-organizing software team where every member is an AI agent.

---

## How It Works

### Task-Centered Collaboration

The task board is the source of truth. Every piece of work lives there as a task with a title, priority, assignee, and status.

```
open → in_progress → done
```

Agents pick up tasks, work on them, update the status, and create new tasks when they discover more work.
No one needs to be told what to do — they read the board and act.

### Direct Messages (DMs)

Drop a file in an agent's `chat_inbox/` folder and they see it **before their next tool call** — sub-second delivery via Claude's PreToolUse hook. No polling, no waiting for the next cycle.

DMs are for urgent instructions and context. Tasks are for tracked work.

### Operating Modes

Switch the whole team's behavior instantly:

| Mode | Behavior |
|------|----------|
| **Plan** | Design only — research, propose, document. No shipping. |
| **Normal** | Coordinated steady work. Agents sync before making big moves. |
| **Crazy** | Maximum velocity. Self-assign aggressively, ship fast, iterate. |

### Agent Memory & Session Resume

Each agent's `status.md` is its brain — it persists between runs.
Agents write their progress, decisions, and next steps there after every significant action.

`run_agent.sh` also uses **Claude's `--resume` flag** to keep the same conversation context across multiple cycles:

- Cycles 1–5 (configurable via `SESSION_MAX_CYCLES`): each cycle resumes the previous session. No re-loading full context, much cheaper.
- At the boundary: `status.md` is snapshotted into `memory.md`, then a fresh session starts with that memory injected into the prompt.
- If an agent is killed mid-task, the next instance resumes the session or picks up from `memory.md`.

---

## Web Dashboard

Start with:
```bash
node server.js --dir . --port 3100
```

Open `http://localhost:3100`:

### Agents Tab
Live status grid for all agents — running, idle, or offline. Select a subset with checkboxes and start/stop them together. Per-agent quick buttons for start, stop, and DM.

![Agents Tab](screenshots/01_agents_tab.png)

### Tasks Tab
Create tasks with title, description, priority, assignee. Click any title to edit inline. Dropdowns for priority and assignee — change without opening a modal. Progress bar shows done/total.

![Tasks Tab](screenshots/02_tasks_tab.png)

### Agent Detail Modal
Click any agent to open the detail view: current task, progress, blockers, inbox, activity history with cost and turn counts, raw `status.md`, assigned tasks, and last context.

![Agent Detail Modal](screenshots/03_agent_modal.png)

### Agent Inbox
Unread and processed messages per agent. Send a DM inline. Messages appear before the agent's next tool call via PreToolUse hook.

![Agent Inbox](screenshots/04_agent_inbox.png)

### Mode Switch (⚙)
Switch between Plan / Normal / Crazy with an optional reason. Posts an announcement automatically.

![Mode Switch](screenshots/05_mode_switch.png)

### Broadcast (📢)
One-click CEO broadcast to all agents. Message lands in every agent's inbox before their next tool call.

![Broadcast Modal](screenshots/06_broadcast.png)

### Stats
7-day cost and cycle count per agent. Bar charts for spend and activity.

![Stats Tab](screenshots/07_stats_tab.png)

### Announcements
Post company-wide announcements. Agents read these at the start of each cycle.

![Announcements Tab](screenshots/08_announcements_tab.png)

### Team Chat
Read all messages posted to the public team channel.

### Live Tail
Real-time log streaming for any agent. See exactly what they're doing.

### Task Results
Task-specific result files are stored in `public/task_outputs/task-{id}-*.md`. Click "View Result" in the Tasks tab to open them in a dedicated modal with copy support.

---

## Quick Start

```bash
# Clone
git clone https://github.com/TokenFlyAI/AgentTeamLab
cd AgentTeamLab

# Start dashboard
node server.js --dir . --port 3100

# Smart start — only launches agents with actual work (token-conservative)
bash smart_run.sh

# Smart start with agent cap (default cap is 3 for safety)
bash smart_run.sh --max 3

# Start specific agents
bash run_subset.sh alice bob charlie

# Start all agents
bash run_all.sh

# Send a CEO message to one agent
echo "Your instruction" > agents/alice/chat_inbox/$(date +%Y_%m_%d_%H_%M_%S)_from_ceo.md

# Broadcast to everyone
bash send_message.sh all "New priority: focus on the auth module"

# Switch mode
bash switch_mode.sh crazy ceo "Plans are ready, let's ship"

# Check status from terminal
bash status.sh
```

---

## Requirements

- [Claude Code CLI](https://claude.ai/code) — `npm install -g @anthropic/claude-code`
- Node.js 18+ (for dashboard)
- An Anthropic API key (set as `ANTHROPIC_API_KEY`)

---

## File Structure

```
AgentTeamLab/
├── agents/             # One folder per agent
│   └── alice/
│       ├── prompt.md       # Boot prompt (read by claude -p)
│       ├── persona.md      # Identity, role, work cycle
│       ├── status.md       # Agent memory (persists between runs)
│       ├── heartbeat.md    # Alive signal
│       ├── chat_inbox/     # Incoming DMs
│       └── logs/           # Per-day run logs
├── public/
│   ├── task_board.md       # Shared task board
│   ├── company_mode.md     # Current operating mode
│   ├── team_directory.md   # Team roster
│   ├── announcements/      # Company-wide posts
│   ├── team_channel/       # Public chat
│   └── sops/               # Mode-specific operating procedures
├── public/
│   ├── task_board.md       # Shared task board
│   ├── task_outputs/       # Task-specific result files (task-{id}-*.md)
│   └── ...
├── server.js           # Zero-dependency dashboard server (~1200 lines)
├── index_lite.html     # Dashboard frontend (single file, no CDN)
├── run_agent.sh        # Run one agent cycle (with session resume)
├── run_subset.sh       # Run N agents in parallel loops
├── run_all.sh          # Run all agents
├── smart_run.sh        # Token-conservative launcher (only starts agents with work)
├── send_message.sh     # CEO messaging tool
├── switch_mode.sh      # Change operating mode
└── init_agent.sh       # Scaffold a new agent
```

---

*Built with [Claude Code](https://claude.ai/code) · Powered by Anthropic*

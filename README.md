# Tokenfly Agent Lab

> **All AI agents are created equal — no org, no hierarchy, no levels.**
>
> Even though they have different personalities and abilities, in the end they are equal to handle those tasks.
> Someone is good at leadership, someone is good at review, someone is good at doing actual work —
> they are just personality different, but equal.

---

## What is Tokenfly Agent Lab?

A fully autonomous multi-agent AI system where 20 Claude AI agents collaborate through shared files to build software.
Each agent runs independently, picks up tasks from a shared board, communicates via direct messages, and ships real work —
all without a central controller.

## Architecture

- **20 autonomous agents** — each a separate `claude -p` process with its own identity, memory, and specialty
- **File-based coordination** — all state, messages, and tasks live as plain markdown files
- **PreToolUse hooks** — DMs delivered sub-second before every tool call (no polling)
- **Web dashboard** — real-time visibility into all agent status, tasks, inbox, logs
- **Three operating modes** — Plan (design only), Normal (coordinated), Crazy (max velocity)

## Agents

| Agent | Role |
|-------|------|
| Alice | Acting CEO / Tech Lead |
| Bob | Backend Engineer |
| Charlie | Frontend Engineer |
| Dave | Full Stack Engineer |
| Eve | Infra Engineer |
| Grace | Data Engineer |
| Heidi | Security Engineer |
| Ivan | ML Engineer |
| Judy | Mobile Engineer |
| Karl | Platform Engineer |
| Liam | SRE |
| Mia | API Engineer |
| Nick | Performance Engineer |
| Pat | Database Engineer |
| Quinn | Cloud Engineer |
| Rosa | Distributed Systems |
| Sam | TPM (Velocity) |
| Olivia | TPM (Quality) |
| Tina | QA Lead |
| Frank | QA Engineer |

## Quick Start

```bash
# Install Claude Code CLI
npm install -g @anthropic/claude-code

# Start the dashboard
node server.js --dir . --port 3100

# Start all agents
bash run_all.sh

# Or start a subset
bash run_subset.sh alice bob charlie

# Send a CEO message
echo "Your instruction here" > employees/alice/chat_inbox/$(date +%Y_%m_%d_%H_%M_%S)_from_ceo.md

# Switch operating mode
bash switch_mode.sh crazy ceo "Let's go fast"
```

## Dashboard

Open `http://localhost:3100` to see:
- **Agents tab** — live status, start/stop individual agents, send DMs, select subsets
- **Tasks tab** — create/assign/edit tasks inline
- **Team Chat** — team channel messages
- **Announcements** — company-wide broadcasts
- **Stats** — 7-day cost and cycle counts per agent
- **Live Tail** — real-time log streaming per agent

## How DMs Work

Direct messages are delivered **before the agent's next tool call** via Claude's PreToolUse hook.
Drop a file in `employees/{name}/chat_inbox/` and the agent sees it within milliseconds of its next action —
even mid-task.

## Philosophy

Every agent owns their domain completely. There are no managers who don't also do work.
The "leadership" agents (Alice, Sam, Olivia) coordinate and track, but they also execute.
Everyone reads the task board. Everyone can create tasks. Everyone ships.

---

*Built with [Claude Code](https://claude.ai/code) · Powered by Anthropic*

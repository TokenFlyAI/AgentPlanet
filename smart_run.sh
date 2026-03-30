#!/bin/bash
# smart_run.sh — Token-conservative intelligent agent launcher
#
# Philosophy: ONLY start an agent if it has actual work to do.
# Running idle agents wastes tokens. Every cycle costs money.
#
# Decision logic:
#   1. Alice: if there are ANY open/in_progress tasks OR unread inbox msgs
#   2. Named agents: ONLY if they have assigned open/in_progress tasks
#              OR they have unread inbox messages
#   3. Unassigned tasks: add 1 agent per unassigned task (cap 3 extra)
#   4. NEVER add "random idle" agents — token waste
#   5. Skip already-running agents
#
# Flags:
#   --dry-run      Print decision and exit (no launch)
#   --force-alice  Always include alice even if no work

COMPANY_DIR="$(cd "$(dirname "$0")" && pwd)"
TASK_BOARD="${COMPANY_DIR}/public/task_board.md"
ALL_AGENTS="alice bob charlie dave eve frank grace heidi ivan judy karl liam mia nick olivia pat quinn rosa sam tina"

# ── Health Trend Snapshot ─────────────────────────────────────────────────────
# Take a health snapshot at the start of each run cycle.
# Graceful: if tracker fails (e.g., dashboard not running), just warn and continue.
TRACKER="${COMPANY_DIR}/agents/ivan/output/health_trend_tracker.js"
if [ -f "$TRACKER" ] && command -v node >/dev/null 2>&1; then
    TRACKER_OUTPUT=$(timeout 30 node "$TRACKER" --no-report 2>/dev/null)
    TRACKER_EXIT=$?
    if [ $TRACKER_EXIT -ne 0 ]; then
        echo "[smart_run] INFO: Health tracker skipped (dashboard may not be running)"
    else
        # Extract and re-emit at-risk agents with WARN prefix
        AT_RISK_LINE=$(echo "$TRACKER_OUTPUT" | grep "At-risk:" | sed 's/^[[:space:]]*//')
        if [ -n "$AT_RISK_LINE" ]; then
            echo "[WARN] Agent health declining — $AT_RISK_LINE"
        fi
        FLEET_AVG=$(echo "$TRACKER_OUTPUT" | grep "Fleet Average:" | sed 's/^[[:space:]]*//')
        [ -n "$FLEET_AVG" ] && echo "[smart_run] Health snapshot: $FLEET_AVG"
    fi
fi

# ── Parse task board ─────────────────────────────────────────────────────────
ASSIGNED_AGENTS=""   # space-separated list of agents with open tasks
UNASSIGNED_COUNT=0
OPEN_TASK_COUNT=0

if [ -f "$TASK_BOARD" ]; then
    while IFS='|' read -r _ id title desc priority assignee status rest; do
        id_clean=$(echo "$id" | tr -d ' ')
        echo "$id_clean" | grep -qE '^(-+|ID)$' && continue
        [ -z "$id_clean" ] && continue
        echo "$id_clean" | grep -qE '^[0-9]+$' || continue

        status_clean=$(echo "$status" | tr -d ' ' | tr '[:upper:]' '[:lower:]')
        [ "$status_clean" = "done" ] && continue
        [ "$status_clean" = "cancelled" ] && continue

        OPEN_TASK_COUNT=$((OPEN_TASK_COUNT + 1))
        assignee_clean=$(echo "$assignee" | tr -d ' ' | tr '[:upper:]' '[:lower:]')
        if [ -n "$assignee_clean" ] && [ "$assignee_clean" != "unassigned" ] && [ "$assignee_clean" != "-" ]; then
            # Add to assigned list (dedup)
            echo "$ASSIGNED_AGENTS" | grep -qw "$assignee_clean" || ASSIGNED_AGENTS="$ASSIGNED_AGENTS $assignee_clean"
        else
            UNASSIGNED_COUNT=$((UNASSIGNED_COUNT + 1))
        fi
    done < <(grep '|' "$TASK_BOARD" | grep -v '^#\|^|\s*-')
fi

# ── Check inbox for each agent ────────────────────────────────────────────────
INBOX_AGENTS=""  # agents with unread inbox messages

for ag in $ALL_AGENTS; do
    inbox_dir="${COMPANY_DIR}/agents/${ag}/chat_inbox"
    if [ -d "$inbox_dir" ]; then
        count=$(ls "$inbox_dir"/*.md 2>/dev/null | wc -l | tr -d ' ')
        [ "${count:-0}" -gt 0 ] && INBOX_AGENTS="$INBOX_AGENTS $ag"
    fi
done

# ── Which agents are already running ─────────────────────────────────────────
RUNNING_AGENTS=""
for ag in $ALL_AGENTS; do
    if pgrep -f "run_subset.sh $ag" > /dev/null 2>&1; then
        RUNNING_AGENTS="$RUNNING_AGENTS $ag"
    fi
done

# ── Build TO_START list ───────────────────────────────────────────────────────
TO_START=""

add_agent() {
    local ag="$1"
    echo "$RUNNING_AGENTS" | grep -qw "$ag" && return  # already running
    echo "$TO_START" | grep -qw "$ag" && return         # already queued
    [ ! -d "${COMPANY_DIR}/agents/${ag}" ] && return    # doesn't exist
    TO_START="$TO_START $ag"
}

has_work() {
    local ag="$1"
    echo "$ASSIGNED_AGENTS" | grep -qw "$ag" && return 0
    echo "$INBOX_AGENTS"    | grep -qw "$ag" && return 0
    return 1
}

# Determine if Alice flag is forced
FORCE_ALICE=0
[ "${1}" = "--force-alice" ] || [ "${2}" = "--force-alice" ] && FORCE_ALICE=1

# 1. Alice: only if there's actual work or forced
if [ $FORCE_ALICE -eq 1 ] || has_work "alice" || [ "$OPEN_TASK_COUNT" -gt 0 ]; then
    add_agent "alice"
fi

# 2. Agents with assigned tasks or inbox messages
for ag in $ALL_AGENTS; do
    [ "$ag" = "alice" ] && continue
    has_work "$ag" && add_agent "$ag"
done

# 3. Unassigned tasks: add agents to claim them (max 3 extra agents)
if [ "$UNASSIGNED_COUNT" -gt 0 ]; then
    queued=$(echo "$TO_START" | tr ' ' '\n' | grep -c '[a-z]' 2>/dev/null || echo 0)
    running=$(echo "$RUNNING_AGENTS" | tr ' ' '\n' | grep -c '[a-z]' 2>/dev/null || echo 0)
    total=$((queued + running))
    need=$((UNASSIGNED_COUNT < 3 ? UNASSIGNED_COUNT : 3))
    add_more=$((need - total))

    if [ "$add_more" -gt 0 ]; then
        for ag in $ALL_AGENTS; do
            [ "$add_more" -le 0 ] && break
            [ "$ag" = "alice" ] && continue
            has_work "$ag" && continue           # already added above
            echo "$RUNNING_AGENTS" | grep -qw "$ag" && continue
            echo "$TO_START" | grep -qw "$ag" && continue
            add_agent "$ag"
            add_more=$((add_more - 1))
        done
    fi
fi

START_LIST=$(echo "$TO_START" | tr ' ' '\n' | grep -v '^$' | tr '\n' ' ')

# ── Summary ────────────────────────────────────────────────────────────────────
echo "=== Smart Run Decision ==="
echo "  Open tasks:        $OPEN_TASK_COUNT (unassigned: $UNASSIGNED_COUNT)"
echo "  Already running:   $(echo "$RUNNING_AGENTS" | tr ' ' '\n' | grep -v '^$' | tr '\n' ' ')"
echo "  Task-assigned:     $(echo "$ASSIGNED_AGENTS" | tr ' ' '\n' | grep -v '^$' | tr '\n' ' ')"
echo "  Has inbox:         $(echo "$INBOX_AGENTS" | tr ' ' '\n' | grep -v '^$' | tr '\n' ' ')"
echo "  Starting now:      ${START_LIST:-none}"
echo ""

# Dry-run: structured output for server.js parsing
if [ "${1}" = "--dry-run" ]; then
    echo "  Always run: alice"
    echo "  Task-assigned: $(echo "$ASSIGNED_AGENTS" | tr ' ' '\n' | grep -v '^$' | tr '\n' ' ')"
    echo "  Unassigned tasks: $UNASSIGNED_COUNT"
    echo "  Starting now: ${START_LIST:-none}"
    exit 0
fi

if [ -z "$(echo "$START_LIST" | tr -d ' ')" ]; then
    echo "No agents need to start — all tasks covered or no work available."
    echo "Token-conservative mode: 0 new agents launched."
    exit 0
fi

echo "Launching: $START_LIST"
bash "${COMPANY_DIR}/run_subset.sh" $START_LIST

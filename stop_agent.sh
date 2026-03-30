#!/bin/bash
# stop_agent.sh — Stop a specific agent (loop + active cycle)
AGENT_NAME="$1"
[ -z "$AGENT_NAME" ] && echo "Usage: $0 <agent_name>" && exit 1

echo "Stopping ${AGENT_NAME}..."

# Kill the run_subset.sh loop process first (prevents restart)
pgrep -f "run_subset.sh ${AGENT_NAME}" | xargs kill 2>/dev/null || true
sleep 0.5

# Kill active run_agent.sh cycle
pgrep -f "run_agent.sh ${AGENT_NAME}" | xargs kill 2>/dev/null || true
sleep 0.5

# Kill any claude process running for this agent
pgrep -f "claude.*agents/${AGENT_NAME}" | xargs kill -9 2>/dev/null || true

# Clean session locks if any
rm -f /tmp/claude_launcher_*${AGENT_NAME}*.sessions 2>/dev/null || true
rm -f /tmp/aicompany_settings_${AGENT_NAME}.json 2>/dev/null || true

echo "${AGENT_NAME} stopped."

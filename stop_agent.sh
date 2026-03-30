#!/bin/bash
# stop_agent.sh — Stop a specific agent
AGENT_NAME="$1"
[ -z "$AGENT_NAME" ] && echo "Usage: $0 <agent_name>" && exit 1

echo "Stopping ${AGENT_NAME}..."

# Kill run_agent.sh process
pgrep -f "run_agent.sh $AGENT_NAME" | xargs kill 2>/dev/null
sleep 1

# Force kill claude process
pgrep -f "claude.*agents/$AGENT_NAME" | xargs kill -9 2>/dev/null

# Clean session locks
rm -f /tmp/claude_launcher_*${AGENT_NAME}*.sessions

echo "${AGENT_NAME} stopped."

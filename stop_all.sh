#!/bin/bash
# stop_all.sh — Stop all agents and clean up
echo "Stopping all agents..."

# Kill all run_subset.sh processes
pgrep -f "run_subset.sh" | xargs kill 2>/dev/null

# Kill all run_agent.sh processes
pgrep -f "run_agent.sh" | xargs kill 2>/dev/null

sleep 2

# Force kill any remaining claude agent processes
pgrep -f "claude.*employees/" | xargs kill -9 2>/dev/null

# Clean session locks
rm -f /tmp/claude_launcher_*.sessions

echo "All agents stopped."

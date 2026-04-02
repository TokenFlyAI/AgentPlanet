#!/bin/bash
# Clean agent history for dry-run e2e — keeps persona.md and prompt.md only
# Usage: bash e2e_dry_run/clean_agents.sh [agent1 agent2 ...]
set -e

COMPANY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS=("${@:-alice bob charlie sam tina}")

echo "[clean] Cleaning agents: ${AGENTS[*]}"

for agent in "${AGENTS[@]}"; do
  DIR="$COMPANY_DIR/agents/$agent"
  [ -d "$DIR" ] || { echo "[clean] SKIP $agent — dir not found"; continue; }

  # Remove session state
  rm -f "$DIR"/session_id*.txt "$DIR"/session_cycle*.txt

  # Remove runtime snapshots
  rm -f "$DIR/context_snapshot.json" "$DIR/last_context.md"

  # Clear status (fresh slate — keep persona/prompt)
  rm -f "$DIR/status.md"

  # Clear memory (locally untracked)
  rm -f "$DIR/memory.md"

  # Clear heartbeat
  echo "status: idle" > "$DIR/heartbeat.md"
  echo "timestamp: $(date +%Y_%m_%d_%H_%M_%S)" >> "$DIR/heartbeat.md"
  echo "task: Available for assignment" >> "$DIR/heartbeat.md"

  # Clear logs
  rm -rf "$DIR/logs"
  mkdir -p "$DIR/logs"

  # Clear inbox (move all unread to processed, or delete test artifacts)
  find "$DIR/chat_inbox" -maxdepth 1 -name "*.md" -delete 2>/dev/null || true

  echo "[clean] $agent — done"
done

echo "[clean] All done."

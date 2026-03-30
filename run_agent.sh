#!/bin/bash
# run_agent.sh — Run a single agent cycle
set -e

AGENT_NAME="$1"
COMPANY_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="${COMPANY_DIR}/agents/${AGENT_NAME}"

# Validate
[ -z "$AGENT_NAME" ] && echo "Usage: $0 <agent_name>" && exit 1
[ ! -d "$AGENT_DIR" ] && echo "Error: Agent dir not found: $AGENT_DIR" && exit 1
[ ! -d "$HOME/.claude/plugins" ] && echo "Error: ~/.claude/ not set up" && exit 1

# Create directories
mkdir -p "${AGENT_DIR}/logs" "${AGENT_DIR}/chat_inbox/processed" "${AGENT_DIR}/knowledge"

# Build isolated config dir
CONFIG_DIR="/tmp/aicompany_config/${AGENT_NAME}"
rm -rf "$CONFIG_DIR"
mkdir -p "$CONFIG_DIR/projects"

# Symlink shared read-only content from ~/.claude/
ln -sf "$HOME/.claude/plugins" "$CONFIG_DIR/plugins"
ln -sf "$HOME/.claude/meta" "$CONFIG_DIR/meta"
ln -sf "$HOME/.claude/skills" "$CONFIG_DIR/skills"
[ -f "$HOME/.claude/.claude-templates-manifest.json" ] && \
    ln -sf "$HOME/.claude/.claude-templates-manifest.json" \
           "$CONFIG_DIR/.claude-templates-manifest.json"

# Generate agent-specific settings.json
cat > "$CONFIG_DIR/settings.json" << 'EOF'
{
  "env": { "DISABLE_AUTOUPDATER": "1" },
  "skipDangerousModePermissionPrompt": true,
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash ../../check_inbox_hook.sh", "timeout": 5 },
          { "type": "command", "command": "bash ../../check_taskboard_hook.sh", "timeout": 5 }
        ]
      }
    ]
  }
}
EOF

# Onboarding flags
cat > "$CONFIG_DIR/.claude.json" << 'EOF'
{"hasCompletedOnboarding":true,"autoUpdates":false,"numStartups":100}
EOF

# Daily log paths
TODAY=$(date +%Y_%m_%d)
DAILY_LOG="${AGENT_DIR}/logs/${TODAY}.log"
RAW_LOG="${AGENT_DIR}/logs/${TODAY}_raw.log"
TIMESTAMP=$(date +%Y_%m_%d_%H_%M_%S)

echo "" >> "$DAILY_LOG"
echo "========== CYCLE START — ${TIMESTAMP} ==========" >> "$DAILY_LOG"

# Run claude — unset parent env vars to prevent nested-Claude issues
cd "$AGENT_DIR"
timeout 1800 env \
    -u CLAUDECODE \
    -u CLAUDE_CODE_ENTRYPOINT \
    -u CLAUDE_LAUNCHER_SESSION_FILE \
    -u CLAUDE_CODE_CONTAINER_ID \
    -u CLAUDE_CODE_TMPDIR \
    -u ANTHROPIC_CUSTOM_HEADERS \
    -u CODEX_INTERNAL_ORIGINATOR_OVERRIDE \
    CLAUDE_CONFIG_DIR="$CONFIG_DIR" \
    claude -p "$(cat "${AGENT_DIR}/prompt.md")" \
        --output-format stream-json \
        --verbose \
        --dangerously-skip-permissions \
        --max-turns 200 \
        2>/dev/null \
    | tee -a "$RAW_LOG" \
    | jq --unbuffered -r '
        if .type == "assistant" then
            [.message.content[]? |
                if .type == "text" then "[ASSISTANT] " + .text
                elif .type == "tool_use" then
                    "[TOOL] " + .name +
                    (if .input.file_path then " " + .input.file_path
                     elif .input.command then " $ " + (.input.command | tostring | .[0:150])
                     elif .input.content then " (writing " + (.input.content | length | tostring) + " chars)"
                     else "" end)
                else empty end
            ] | join("\n")
        elif .type == "result" then
            "[DONE] turns=" + (.num_turns // 0 | tostring) +
            " cost=$" + ((.total_cost_usd // 0) * 100 | floor / 100 | tostring) +
            " duration=" + ((.duration_ms // 0) / 1000 | tostring) + "s"
        else empty end
    ' >> "$DAILY_LOG" 2>/dev/null || true

echo "========== CYCLE END — $(date +%Y_%m_%d_%H_%M_%S) ==========" >> "$DAILY_LOG"

# Dump conversation context for next cycle
{
    echo "# Last Cycle Context — ${AGENT_NAME} — $(date +%Y_%m_%d_%H_%M_%S)"
    cat "$RAW_LOG" 2>/dev/null | jq -r '
        if .type == "assistant" then
            [.message.content[]? |
                if .type == "text" then .text
                elif .type == "tool_use" then
                    "**[Tool: " + .name + "]**\n" +
                    (if .input.file_path then "  file: " + .input.file_path
                     elif .input.command then "  cmd: " + (.input.command | tostring | .[0:300])
                     else (.input | tostring | .[0:200]) end)
                else empty end
            ] | join("\n")
        else empty end | select(length > 0)
    ' 2>/dev/null
} > "${AGENT_DIR}/last_context.md" 2>/dev/null || true

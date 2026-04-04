#!/bin/bash
# send_message.sh — CEO messaging tool
# Usage:
#   bash send_message.sh <agent>     "message"   # DM one agent
#   bash send_message.sh all         "message"   # broadcast to all 20
#   bash send_message.sh announce    "message"   # post to public/announcements
#   bash send_message.sh channel     "message"   # post to public/team_channel

COMPANY_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${COMPANY_DIR}/lib/paths.sh" 2>/dev/null || true
TARGET="$1"
MESSAGE="$2"
FROM="${3:-ceo}"

AGENTS=(alice bob charlie dave eve frank grace heidi ivan judy karl liam mia nick olivia pat quinn rosa sam tina)
TS=$(date +%Y_%m_%d_%H_%M_%S)

usage() {
    echo "Usage:"
    echo "  $0 <agent_name>  \"message\"          # DM one agent"
    echo "  $0 all           \"message\"          # broadcast to all 20 agents"
    echo "  $0 announce      \"message\"          # post to public/announcements"
    echo "  $0 channel       \"message\"          # post to public/team_channel"
    echo ""
    echo "Agents: ${AGENTS[*]}"
    exit 1
}

[ -z "$TARGET" ] || [ -z "$MESSAGE" ] && usage

case "$TARGET" in
    all)
        COUNT=0
        for agent in "${AGENTS[@]}"; do
            INBOX="${AGENTS_DIR:-${COMPANY_DIR}/agents}/${agent}/chat_inbox"
            mkdir -p "$INBOX"
            echo "$MESSAGE" > "${INBOX}/${TS}_from_${FROM}.md"
            COUNT=$((COUNT + 1))
        done
        echo "Broadcast sent to ${COUNT} agents (from: ${FROM})"
        ;;
    announce)
        ANNDIR="${SHARED_DIR:-${COMPANY_DIR}/public}/announcements"
        mkdir -p "$ANNDIR"
        echo "$MESSAGE" > "${ANNDIR}/${TS}_announcement.md"
        echo "Announcement posted: ${ANNDIR}/${TS}_announcement.md"
        ;;
    channel)
        CHANDIR="${SHARED_DIR:-${COMPANY_DIR}/public}/team_channel"
        mkdir -p "$CHANDIR"
        echo "$MESSAGE" > "${CHANDIR}/${TS}_from_${FROM}.md"
        echo "Posted to team channel: ${TS}_from_${FROM}.md"
        ;;
    *)
        # Single agent DM
        AGENT_DIR="${AGENTS_DIR:-${COMPANY_DIR}/agents}/${TARGET}"
        if [ ! -d "$AGENT_DIR" ]; then
            echo "Error: Unknown agent '$TARGET'"
            echo "Valid agents: ${AGENTS[*]}"
            exit 1
        fi
        INBOX="${AGENT_DIR}/chat_inbox"
        mkdir -p "$INBOX"
        echo "$MESSAGE" > "${INBOX}/${TS}_from_${FROM}.md"
        echo "Message sent to ${TARGET} (from: ${FROM}): ${TS}_from_${FROM}.md"
        ;;
esac

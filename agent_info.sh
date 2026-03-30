#!/bin/bash
# agent_info.sh — Deep status for a single agent
AGENT_NAME="$1"
COMPANY_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="${COMPANY_DIR}/employees/${AGENT_NAME}"

[ -z "$AGENT_NAME" ] && echo "Usage: $0 <agent_name>" && exit 1
[ ! -d "$AGENT_DIR" ] && echo "Error: Agent '$AGENT_NAME' not found" && exit 1

TODAY=$(date +%Y_%m_%d)
CLEAN_LOG="${AGENT_DIR}/logs/${TODAY}.log"

# Colors
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}  Agent: ${AGENT_NAME}${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"

# Status & heartbeat
if [ -f "${AGENT_DIR}/heartbeat.md" ] && [ -s "${AGENT_DIR}/heartbeat.md" ]; then
    echo -e "\n${YELLOW}── Heartbeat ──${NC}"
    cat "${AGENT_DIR}/heartbeat.md"
fi

# Activity detection
if [ -f "$CLEAN_LOG" ]; then
    AGE=$(( $(date +%s) - $(stat -f %m "$CLEAN_LOG" 2>/dev/null || stat -c %Y "$CLEAN_LOG" 2>/dev/null) ))
    if [ $AGE -lt 120 ]; then
        echo -e "\n${GREEN}● ACTIVE${NC} (log updated ${AGE}s ago)"
    elif [ $AGE -lt 600 ]; then
        echo -e "\n${YELLOW}● IDLE${NC} (log updated $((AGE/60))m ago)"
    else
        echo -e "\n${RED}● STALE${NC} (log updated $((AGE/60))m ago)"
    fi
    CYCLES=$(grep -c "CYCLE START" "$CLEAN_LOG" 2>/dev/null || echo 0)
    COST=$(grep -o 'cost=\$[0-9.]*' "$CLEAN_LOG" 2>/dev/null | grep -o '[0-9.]*' | awk '{s+=$1}END{printf "%.2f",s}')
    TURNS=$(grep -o 'turns=[0-9]*' "$CLEAN_LOG" 2>/dev/null | grep -o '[0-9]*' | awk '{s+=$1}END{print s+0}')
    echo "Today: ${CYCLES} cycles | \$${COST} cost | ${TURNS} turns"
fi

# Status.md
echo -e "\n${YELLOW}── Status (memory) ──${NC}"
if [ -f "${AGENT_DIR}/status.md" ] && [ -s "${AGENT_DIR}/status.md" ]; then
    cat "${AGENT_DIR}/status.md"
else
    echo "(empty)"
fi

# Inbox
UNREAD=$(ls "${AGENT_DIR}/chat_inbox/"*.md 2>/dev/null | grep -v processed | wc -l | tr -d ' ')
if [ "$UNREAD" -gt 0 ]; then
    echo -e "\n${RED}── Inbox: ${UNREAD} UNREAD message(s) ──${NC}"
    for msg in "${AGENT_DIR}/chat_inbox/"*.md; do
        [ -f "$msg" ] || continue
        echo -e "  ${YELLOW}$(basename $msg)${NC}"
        head -3 "$msg" | sed 's/^/    /'
    done
else
    echo -e "\n${YELLOW}── Inbox: (empty) ──${NC}"
fi

# Tasks
echo -e "\n${YELLOW}── Assigned Tasks ──${NC}"
if [ -f "${COMPANY_DIR}/public/task_board.md" ]; then
    TASKS=$(grep -i "| *[^ ]" "${COMPANY_DIR}/public/task_board.md" | grep -iv "^| id\|^|--" | grep -i "${AGENT_NAME}")
    if [ -n "$TASKS" ]; then
        echo "$TASKS"
    else
        echo "(none assigned)"
    fi
fi

# Recent log tail
if [ -f "$CLEAN_LOG" ]; then
    echo -e "\n${YELLOW}── Recent Activity (last 10 lines) ──${NC}"
    tail -10 "$CLEAN_LOG"
fi

echo ""

#!/bin/bash
# check_inbox_hook.sh — PreToolUse hook for message delivery
# Runs from agent's working directory (employees/{name}/)
INBOX_DIR="chat_inbox"
shopt -s nullglob
UNREAD=""
for msg in "$INBOX_DIR"/*.md; do
    [ -f "$msg" ] || continue
    UNREAD="$UNREAD $msg"
done
shopt -u nullglob

if [ -n "$UNREAD" ]; then
    echo "=== URGENT: UNREAD MESSAGES IN YOUR INBOX ==="
    for msg in $UNREAD; do
        echo "--- Message: $(basename $msg) ---"
        cat "$msg"
    done
    echo "REQUIRED: Move to chat_inbox/processed/ after handling"
fi
exit 0

#!/bin/bash
# run_subset.sh — Launch agents in independent loops with failure backoff
COMPANY_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTS=("$@")
LOGDIR="/tmp/aicompany_runtime_logs"
mkdir -p "$LOGDIR"

[ ${#AGENTS[@]} -eq 0 ] && echo "Usage: $0 <agent1> <agent2> ..." && exit 1

echo "Launching ${#AGENTS[@]} agents: ${AGENTS[*]}"

trap 'kill $(jobs -p) 2>/dev/null; wait 2>/dev/null; exit 0' INT TERM

for AGENT in "${AGENTS[@]}"; do
    (
        CYCLE=0; FAIL_COUNT=0
        while true; do
            CYCLE=$((CYCLE + 1))
            echo "[$(date +%H:%M:%S)] ${AGENT} — cycle ${CYCLE} starting"
            START_TIME=$(date +%s)
            bash "${COMPANY_DIR}/run_agent.sh" "$AGENT" 2>&1
            DURATION=$(( $(date +%s) - START_TIME ))

            # Fast failure = API error → exponential backoff (30s, 60s, ..., 300s max)
            if [ $DURATION -lt 10 ]; then
                FAIL_COUNT=$((FAIL_COUNT + 1))
                BACKOFF=$((FAIL_COUNT * 30)); [ $BACKOFF -gt 300 ] && BACKOFF=300
                echo "[$(date +%H:%M:%S)] ${AGENT} — fast fail #${FAIL_COUNT}, backoff ${BACKOFF}s"
                sleep $BACKOFF
            else
                FAIL_COUNT=0; sleep 2
            fi
        done
    ) >> "${LOGDIR}/${AGENT}.log" 2>&1 &
    sleep 1  # stagger launches
done

echo "All agents launched. PIDs: $(jobs -p | tr '\n' ' ')"
echo "Logs: ${LOGDIR}/"
wait

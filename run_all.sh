#!/bin/bash
# run_all.sh — Launch all 20 agents
COMPANY_DIR="$(cd "$(dirname "$0")" && pwd)"

AGENTS=(alice bob charlie dave eve frank grace heidi ivan judy karl liam mia nick olivia pat quinn rosa sam tina)

echo "Launching all ${#AGENTS[@]} agents..."
bash "${COMPANY_DIR}/run_subset.sh" "${AGENTS[@]}"

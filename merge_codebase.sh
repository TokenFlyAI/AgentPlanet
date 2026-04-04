#!/bin/bash
# merge_codebase.sh — Merge agent code outputs into shared codebase worktree
# Usage: bash merge_codebase.sh [planet-name]
#
# Copies code from each agent's output/backend/ into the shared codebase
# worktree and commits the merge.

COMPANY_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${COMPANY_DIR}/lib/paths.sh" 2>/dev/null || true

PLANET_NAME="${1:-${ACTIVE_PLANET:-kalshi-traders}}"
PLANET_DIR="${COMPANY_DIR}/planets/${PLANET_NAME}"
CODEBASE="${PLANET_DIR}/output/shared/codebase"

if [ ! -d "$PLANET_DIR" ]; then
  echo "Error: Planet not found: $PLANET_NAME"
  exit 1
fi

if [ ! -d "$CODEBASE/.git" ] && [ ! -f "$CODEBASE/.git" ]; then
  echo "No codebase worktree found at ${CODEBASE}"
  echo ""
  echo "Set one up with:"
  echo "  git branch planet/${PLANET_NAME}/codebase"
  echo "  git worktree add ${CODEBASE} planet/${PLANET_NAME}/codebase"
  exit 1
fi

echo "Merging agent code into shared codebase..."
echo "Planet: ${PLANET_NAME}"
echo "Codebase: ${CODEBASE}"
echo ""

MERGED=0

# Merge each agent's backend/ code into the codebase
for agent_output in "${PLANET_DIR}/output"/*/; do
  agent=$(basename "$agent_output")
  [ "$agent" = "shared" ] && continue

  backend="${agent_output}backend"
  if [ -d "$backend" ]; then
    echo "  Merging ${agent}/backend/ ..."
    mkdir -p "${CODEBASE}/backend"
    cp -r "$backend"/* "${CODEBASE}/backend/" 2>/dev/null
    MERGED=$((MERGED + 1))
  fi
done

if [ $MERGED -eq 0 ]; then
  echo "No agent code to merge."
  exit 0
fi

echo ""
echo "Merged code from ${MERGED} agent(s)."

# Check for changes
cd "$CODEBASE"
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "No new changes to commit."
  exit 0
fi

# Commit the merge
git add -A
STATS=$(git diff --cached --stat | tail -1)
git commit -m "Merge agent code outputs — $(date +%Y-%m-%d_%H:%M)

Sources: $(for d in "${PLANET_DIR}/output"/*/backend; do [ -d "$d" ] && basename "$(dirname "$d")"; done | tr '\n' ' ')
${STATS}"

echo ""
echo "Committed merge to branch: planet/${PLANET_NAME}/codebase"
git log --oneline -1

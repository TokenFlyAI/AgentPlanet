#!/bin/bash
# Planet-aware path resolver for Agent Planet
# Source this from shell scripts: source "${COMPANY_DIR}/lib/paths.sh"
#
# Provides: AGENTS_DIR, SHARED_DIR, OUTPUT_DIR, DATA_DIR, PLANET_DIR, ACTIVE_PLANET

_PATHS_PLATFORM_DIR="${COMPANY_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
_PATHS_PLANET_JSON="${_PATHS_PLATFORM_DIR}/planet.json"

if [ -f "$_PATHS_PLANET_JSON" ]; then
  # Try jq first, fall back to grep+sed
  if command -v jq >/dev/null 2>&1; then
    ACTIVE_PLANET=$(jq -r '.active' "$_PATHS_PLANET_JSON")
    _PATHS_PLANETS_DIR=$(jq -r '.planets_dir // "planets"' "$_PATHS_PLANET_JSON")
  else
    ACTIVE_PLANET=$(grep '"active"' "$_PATHS_PLANET_JSON" | sed 's/.*: *"\([^"]*\)".*/\1/')
    _PATHS_PLANETS_DIR="planets"
  fi
  PLANET_DIR="${_PATHS_PLATFORM_DIR}/${_PATHS_PLANETS_DIR}/${ACTIVE_PLANET}"
else
  # Fallback: legacy flat structure (no planet.json)
  ACTIVE_PLANET="default"
  PLANET_DIR="${_PATHS_PLATFORM_DIR}"
fi

# Export planet-aware paths
if [ -d "${PLANET_DIR}/agents" ]; then
  AGENTS_DIR="${PLANET_DIR}/agents"
else
  AGENTS_DIR="${_PATHS_PLATFORM_DIR}/agents"
fi

if [ -d "${PLANET_DIR}/shared" ]; then
  SHARED_DIR="${PLANET_DIR}/shared"
else
  SHARED_DIR="${_PATHS_PLATFORM_DIR}/public"
fi

OUTPUT_DIR="${PLANET_DIR}/output"
DATA_DIR="${PLANET_DIR}/data"

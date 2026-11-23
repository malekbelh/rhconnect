#!/usr/bin/env bash
# Lance la mesure reproductible de la qualité sur une révision Git.
# Prérequis : Docker (avec Compose). Aucune autre installation.
#
#   scripts/analyse.sh                         # mesure v0-baseline -> docs/mesures/v0
#   scripts/analyse.sh v1-final docs/mesures/v1
set -euo pipefail
cd "$(dirname "$0")/.."

export REF="${1:-v0-baseline}"
export OUT_DIR="${2:-docs/mesures/v0}"
COMPOSE=(docker compose -f infra/analyse/compose.yaml)

git rev-parse --verify --quiet "$REF^{commit}" >/dev/null || { echo "Révision inconnue : $REF"; exit 1; }
echo "Mesure de $REF -> $OUT_DIR"

trap '"${COMPOSE[@]}" down --remove-orphans >/dev/null 2>&1' EXIT
"${COMPOSE[@]}" build analyse
"${COMPOSE[@]}" run --rm analyse

#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /absolute/path/to/local/entire-binary"
  exit 1
fi

ENTIRE_BIN="$1"
if [[ ! -x "$ENTIRE_BIN" ]]; then
  echo "error: ENTIRE_BIN is not executable: $ENTIRE_BIN"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[1/3] Running local validation..."
cd "$REPO_ROOT"
npm run validate

echo "[2/3] Enabling Entire hooks for pi in this repo..."
"$ENTIRE_BIN" enable --agent pi

echo "[3/3] Start pi with local extension:"
echo ""
echo "  export ENTIRE_BIN=$ENTIRE_BIN"
echo "  pi --extension $REPO_ROOT/extensions/entire.ts"

#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 /absolute/path/to/local/entire /absolute/path/to/target-repo"
  exit 1
fi

ENTIRE_BIN="$1"
TARGET_REPO="$2"
EXT_SOURCE="git:github.com/bry-guy/pi-entire"

if [[ ! -x "$ENTIRE_BIN" ]]; then
  echo "error: ENTIRE_BIN is not executable: $ENTIRE_BIN"
  exit 1
fi

if [[ ! -d "$TARGET_REPO/.git" ]]; then
  echo "error: target is not a git repo: $TARGET_REPO"
  exit 1
fi

cd "$TARGET_REPO"

echo "[1/3] Enabling Entire (pi agent) with absolute git hook path..."
"$ENTIRE_BIN" enable --agent pi --absolute-git-hook-path

echo "[2/3] Installing pi-entire extension from git (repo-local)..."
pi install "$EXT_SOURCE" -l

echo "[3/3] Start pi in this repo (ENTIRE_BIN pinned)..."
echo ""
echo "  cd $TARGET_REPO"
echo "  ENTIRE_BIN=$ENTIRE_BIN pi"
echo ""
echo "If already installed with a pinned source, you can refresh with:"
echo "  pi remove git:github.com/bry-guy/pi-entire#feat/dogfood-foundation -l || true"
echo "  pi install $EXT_SOURCE -l"

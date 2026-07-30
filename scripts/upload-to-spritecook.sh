#!/bin/bash
set -euo pipefail
cd /mnt/u/projects/games/platformer

UPLOAD_URL="$1"
UPLOAD_TOKEN="$2"
FILE="public/assets/sprite/player-idle.png"

curl -sS -X PUT \
  -H "Content-Type: image/png" \
  --data-binary @"$FILE" \
  "$UPLOAD_URL"

echo "Upload complete"

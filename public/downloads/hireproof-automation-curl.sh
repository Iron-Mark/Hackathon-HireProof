#!/usr/bin/env bash
set -euo pipefail

HIREPROOF_URL="${HIREPROOF_URL:-https://hireproof.tech}"
HIREPROOF_API_KEY="${HIREPROOF_API_KEY:-hireproof_agent_demo_key}"
JOB_TEXT="${JOB_TEXT:-Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.}"
JOB_LOCATION="${JOB_LOCATION:-Philippines}"
HIREPROOF_MODE="${HIREPROOF_MODE:-demo}"

curl -sS -X POST "$HIREPROOF_URL/api/v1/audit" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $HIREPROOF_API_KEY" \
  -d "$(cat <<JSON
{
  "text": "$JOB_TEXT",
  "location": "$JOB_LOCATION",
  "mode": "$HIREPROOF_MODE"
}
JSON
)"

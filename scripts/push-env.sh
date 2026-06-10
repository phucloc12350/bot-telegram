#!/bin/bash
set -a
source .env.local
set +a

VARS=(
  "AUTH_SECRET"
  "AUTH_TRUST_HOST"
  "ADMIN_EMAIL"
  "ADMIN_PASSWORD"
  "ADMIN_NAME"
  "TELEGRAM_BOT_TOKEN"
  "TELEGRAM_DEFAULT_CHAT_ID"
  "TELEGRAM_WEBHOOK_SECRET"
  "GOLD_API_URL"
  "GOLD_API_KEY"
  "CRON_SECRET"
  "NEXT_PUBLIC_APP_NAME"
)

for name in "${VARS[@]}"; do
  value="${!name}"
  if [ -z "$value" ]; then
    echo "[SKIP] $name (empty)"
    continue
  fi
  echo "[ADD] $name -> production"
  printf '%s' "$value" | npx vercel env add "$name" production --force --yes 2>&1 \
    | grep -E "Saved|Overrode|Error" | head -1
done

echo "Done."

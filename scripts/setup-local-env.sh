#!/usr/bin/env bash
# Creates .env.local from .env.example with a generated AUTH_SECRET if missing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
EXAMPLE="$ROOT/.env.example"

if [[ -f "$ENV_FILE" ]]; then
  echo ".env.local already exists — nothing to do."
  exit 0
fi

if [[ ! -f "$EXAMPLE" ]]; then
  echo "Missing .env.example" >&2
  exit 1
fi

SECRET="$(openssl rand -base64 32)"
cp "$EXAMPLE" "$ENV_FILE"
sed -i "s/^AUTH_SECRET=.*/AUTH_SECRET=${SECRET}/" "$ENV_FILE"

echo "Created .env.local with a new AUTH_SECRET."
echo "Add Google OAuth credentials to .env.local when ready (see README)."

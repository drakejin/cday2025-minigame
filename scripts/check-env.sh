#!/bin/bash
set -e

ERR=0

function ensure_kv() {
  local key="$1"
  if ! grep -qE "^${key}=" .env; then
    echo "❌ Missing ${key} in .env"
    ERR=1
  fi
}

function warn_spaces() {
  if grep -nE '^[A-Z0-9_]+\s*=\s*[^"].*\s+.*$' .env | grep -v '^#' >/dev/null; then
    echo "⚠️  Some values contain spaces without quotes. Wrap values with spaces in double quotes."
  fi
}

if [ ! -f ".env" ]; then
  echo "❌ .env file not found"
  exit 1
fi

ensure_kv VITE_SUPABASE_URL
ensure_kv VITE_SUPABASE_ANON_KEY
ensure_kv VITE_SUPABASE_ACCESS_TOKEN
ensure_kv SUPABASE_PROJECT_REF

warn_spaces

if [ $ERR -ne 0 ]; then
  exit 1
fi

echo "✅ .env looks OK"



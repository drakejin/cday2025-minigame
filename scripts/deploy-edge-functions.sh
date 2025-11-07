#!/bin/bash

# Edge Functions Deployment Script
# Usage: ./deploy-edge-functions.sh

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
set -a
source .env
set +a

# Check if token exists
if [ -z "$VITE_SUPABASE_ACCESS_TOKEN" ]; then
  echo "${RED}Error: VITE_SUPABASE_ACCESS_TOKEN not found in .env${NC}"
  exit 1
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "${RED}Error: SUPABASE_PROJECT_REF not found in .env${NC}"
  echo "Add: SUPABASE_PROJECT_REF=your-project-ref to .env"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN=$VITE_SUPABASE_ACCESS_TOKEN

# Fix TLS certificate issues on some environments (UnknownIssuer)
export DENO_TLS_CA_STORE=system

# Link project
echo "${BLUE}Linking to Supabase project: $SUPABASE_PROJECT_REF${NC}"
npx supabase link --project-ref "$SUPABASE_PROJECT_REF" || {
  echo "Already linked or link failed (continuing)"
}

# Deploy Edge Functions
echo ""
echo "${BLUE}Deploying all Edge Functions...${NC}"
echo ""

TOTAL=0
SUCCESS=0
FAILED=()

# Find all directories in supabase/functions except _shared
for dir in supabase/functions/*/; do
  func_name=$(basename "$dir")

  # Skip _shared directory
  if [ "$func_name" = "_shared" ]; then
    continue
  fi

  TOTAL=$((TOTAL + 1))

  echo "Deploying $func_name..."
  if npx supabase functions deploy "$func_name" --no-verify-jwt --debug 2>&1; then
    echo "${GREEN}✅ $func_name deployed successfully${NC}"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "${RED}❌ Failed to deploy $func_name${NC}"
    FAILED+=("$func_name")
  fi
  echo ""
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${GREEN}Deployment Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: $TOTAL functions"
echo "Success: ${GREEN}$SUCCESS${NC}"
echo "Failed: ${RED}$((TOTAL - SUCCESS))${NC}"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "${RED}Failed functions:${NC}"
  printf '%s\n' "${FAILED[@]}"
fi

echo ""
echo "${GREEN}🎉 Edge Functions deployment complete!${NC}"

#!/bin/bash

# Complete Deployment Script
# Deploys both Edge Functions and Frontend to Vercel

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🚀 Starting Complete Deployment Process..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Load environment variables
set -a
source .env
set +a

# ==================== Step 1: Pre-deployment Checks ====================
echo "${BLUE}📋 Step 1: Pre-deployment Checks${NC}"
echo ""

# Check required env variables
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "${RED}❌ Error: VITE_SUPABASE_URL not found in .env${NC}"
  exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "${RED}❌ Error: VITE_SUPABASE_ANON_KEY not found in .env${NC}"
  exit 1
fi

if [ -z "$VITE_SUPABASE_ACCESS_TOKEN" ]; then
  echo "${RED}❌ Error: VITE_SUPABASE_ACCESS_TOKEN not found in .env${NC}"
  exit 1
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "${RED}❌ Error: SUPABASE_PROJECT_REF not found in .env${NC}"
  echo "${YELLOW}💡 Add: SUPABASE_PROJECT_REF=your-project-ref${NC}"
  exit 1
fi

echo "${GREEN}✅ All environment variables found${NC}"
echo ""

# ==================== Step 2: Code Quality Checks ====================
echo "${BLUE}📋 Step 2: Code Quality Checks${NC}"
echo ""

echo "Running format..."
yarn format || {
  echo "${RED}❌ Format failed${NC}"
  exit 1
}

echo "Running lint..."
yarn lint || {
  echo "${YELLOW}⚠️  Lint warnings exist (continuing)${NC}"
}

echo "Running type check..."
yarn type-check || {
  echo "${RED}❌ Type check failed${NC}"
  exit 1
}

echo "Building production bundle..."
yarn build || {
  echo "${RED}❌ Build failed${NC}"
  exit 1
}

echo "${GREEN}✅ All quality checks passed${NC}"
echo ""

# ==================== Step 3: Deploy Edge Functions ====================
echo "${BLUE}📦 Step 3: Deploying Edge Functions to Supabase${NC}"
echo ""

# Validate .env formatting and required keys
bash "$SCRIPT_DIR/check-env.sh"

bash "$SCRIPT_DIR/deploy-edge-functions.sh"

# ==================== Step 4: Deploy Frontend to Vercel ====================
echo ""
echo "${BLUE}🌐 Step 4: Deploying Frontend to Vercel${NC}"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
  echo "${YELLOW}Vercel CLI not found. Installing...${NC}"
  npm i -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "${YELLOW}⚠️  Not logged in to Vercel${NC}"
  echo "Please run: ${BLUE}vercel login${NC}"
  echo ""
  read -p "Press Enter after logging in to continue..."
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
echo ""

# First deployment or update
if [ -f ".vercel/project.json" ]; then
  echo "Updating existing Vercel project..."
  vercel --prod --yes
else
  echo "Creating new Vercel project..."
  echo ""
  echo "${YELLOW}This is the first deployment. Vercel will ask some questions.${NC}"
  echo "Recommended answers:"
  echo "  - Set up and deploy: Yes"
  echo "  - Which scope: (select your account)"
  echo "  - Link to existing project: No"
  echo "  - Project name: cday2025-minigame (or your choice)"
  echo "  - Directory: ./ (current directory)"
  echo "  - Override settings: No"
  echo ""

  vercel

  echo ""
  echo "${YELLOW}Now setting environment variables...${NC}"

  # Set environment variables
  echo "$VITE_SUPABASE_URL" | vercel env add VITE_SUPABASE_URL production
  echo "$VITE_SUPABASE_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY production

  echo "${GREEN}✅ Environment variables set${NC}"
  echo ""
  echo "Deploying to production..."
  vercel --prod --yes
fi

VERCEL_URL=$(vercel inspect --wait 2>&1 | grep -o 'https://[^[:space:]]*' | head -1)

echo ""
echo "${GREEN}✅ Frontend deployed successfully!${NC}"
if [ -n "$VERCEL_URL" ]; then
  echo "URL: ${BLUE}$VERCEL_URL${NC}"
fi

# ==================== Step 5: Deployment Summary ====================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${GREEN}🎉 Deployment Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  - Edge Functions: Deployed to Supabase"
echo "  - Frontend: Deployed to Vercel"
if [ -n "$VERCEL_URL" ]; then
  echo "  - URL: $VERCEL_URL"
fi
echo ""
echo "🔗 Important URLs:"
if [ -n "$VERCEL_URL" ]; then
  echo "  - Frontend: $VERCEL_URL"
  echo "  - Admin Panel: $VERCEL_URL/admin"
fi
echo "  - Supabase Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF"
echo ""
echo "📋 Next Steps:"
if [ -n "$VERCEL_URL" ]; then
  echo "  1. Visit $VERCEL_URL and test login"
fi
echo "  2. Login with Google OAuth"
echo "  3. Run this SQL to make yourself admin:"
echo "     ${BLUE}UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';${NC}"
if [ -n "$VERCEL_URL" ]; then
  echo "  4. Visit $VERCEL_URL/admin to access admin panel"
fi
echo "  5. Create and start the first round"
echo ""

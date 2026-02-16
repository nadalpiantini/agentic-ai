#!/bin/bash

# Pre-deployment Validation Script
# Run this before deploying to production

set -e

echo "🚀 Pre-deployment Validation"
echo "============================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILS=0

# Function to print check result
check_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅${NC} $2"
  else
    echo -e "${RED}❌${NC} $2"
    FAILS=$((FAILS + 1))
  fi
}

# 1. Check if working tree is clean
echo "📋 Checking git status..."
if git diff --quiet HEAD 2>/dev/null; then
  check_result 0 "Working tree is clean"
else
  check_result 1 "Working tree has uncommitted changes"
  echo "   Please commit or stash changes before deploying"
fi
echo ""

# 2. Run type check
echo "🔍 Running TypeScript type check..."
if pnpm typecheck > /dev/null 2>&1; then
  check_result 0 "TypeScript compilation successful"
else
  check_result 1 "TypeScript errors found"
  echo "   Run 'pnpm typecheck' to see errors"
fi
echo ""

# 3. Run linter
echo "🧹 Running linter..."
if pnpm lint > /dev/null 2>&1; then
  check_result 0 "Linting passed"
else
  check_result 1 "Linting errors found"
  echo "   Run 'pnpm lint' to see errors"
fi
echo ""

# 4. Run tests
echo "🧪 Running tests..."
if pnpm test > /dev/null 2>&1; then
  check_result 0 "Unit tests passed"
else
  check_result 1 "Unit tests failed"
  echo "   Run 'pnpm test' to see failures"
fi
echo ""

# 5. Check environment variables
echo "🔧 Validating environment variables..."
if [ -f .env.local ]; then
  check_result 0 ".env.local exists"

  # Source .env.local and check required vars
  set -a
  source .env.local
  set +a

  REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "DATABASE_URL"
  )

  MISSING=0
  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      echo -e "   ${RED}✗${NC} $var is not set"
      MISSING=$((MISSING + 1))
    fi
  done

  if [ $MISSING -eq 0 ]; then
    check_result 0 "All required environment variables set"
  else
    check_result 1 "$MISSING required variables missing"
  fi
else
  check_result 1 ".env.local not found"
fi
echo ""

# 6. Check production build
echo "📦 Testing production build..."
if pnpm build > /tmp/build.log 2>&1; then
  check_result 0 "Production build successful"
else
  check_result 1 "Production build failed"
  echo "   Check /tmp/build.log for details"
fi
echo ""

# 7. Check if at least one LLM API key is set
echo "🤖 Checking LLM configuration..."
HAS_LLM=0
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo -e "   ${GREEN}✓${NC} Claude (Anthropic) configured"
  HAS_LLM=1
fi
if [ -n "$DEEPSEEK_API_KEY" ]; then
  echo -e "   ${GREEN}✓${NC} DeepSeek configured"
  HAS_LLM=1
fi
if [ -n "$OLLAMA_BASE_URL" ]; then
  echo -e "   ${GREEN}✓${NC} Ollama configured"
  HAS_LLM=1
fi

if [ $HAS_LLM -eq 1 ]; then
  check_result 0 "At least one LLM is configured"
else
  check_result 1 "No LLM API keys configured"
fi
echo ""

# Final result
echo "============================"
if [ $FAILS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "🚀 Ready to deploy!"
  echo ""
  echo "Deploy commands:"
  echo "  - Vercel: vercel --prod"
  echo "  - Railway: railway up"
  echo "  - Docker: docker build -t agentic-hub ."
  exit 0
else
  echo -e "${RED}❌ $FAILS check(s) failed${NC}"
  echo ""
  echo "Please fix the issues above before deploying."
  exit 1
fi

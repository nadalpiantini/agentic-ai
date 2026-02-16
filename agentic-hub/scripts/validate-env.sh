#!/bin/bash

# Environment Validation Script
# Checks that all required environment variables are set

set -e

echo "🔍 Validating environment configuration..."

# Required variables
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
)

# Optional but recommended vars
RECOMMENDED_VARS=(
  "ANTHROPIC_API_KEY"
  "DEEPSEEK_API_KEY"
  "OPENAI_API_KEY"
)

MISSING=0
MISSING_LIST=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Required variable missing: $var"
    MISSING=$((MISSING + 1))
    MISSING_LIST+=("$var")
  else
    echo "✅ $var is set"
  fi
done

echo ""
echo "📊 Recommended variables:"

for var in "${RECOMMENDED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️  Optional variable not set: $var"
  else
    echo "✅ $var is set"
  fi
done

echo ""
echo "🔧 Configuration check:"

# Check Supabase URL format
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  if [[ ! "$NEXT_PUBLIC_SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL format looks incorrect"
    echo "   Expected format: https://your-project.supabase.co"
  else
    echo "✅ Supabase URL format looks correct"
  fi
fi

# Check DATABASE_URL format
if [ -n "$DATABASE_URL" ]; then
  if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo "⚠️  DATABASE_URL format looks incorrect"
    echo "   Expected format: postgresql://postgres:[password]@db..."
  else
    echo "✅ Database URL format looks correct"
  fi
fi

echo ""
if [ $MISSING -gt 0 ]; then
  echo "❌ Validation FAILED: $MISSING required variable(s) missing"
  echo ""
  echo "Missing variables:"
  for var in "${MISSING_LIST[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Please set these variables in .env.local"
  exit 1
else
  echo "✅ Validation PASSED: All required variables are set"
  echo ""
  echo "🚀 You're ready to run Agentic Hub!"
  exit 0
fi

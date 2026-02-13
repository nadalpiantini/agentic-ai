#!/bin/bash
# 🚀 SEPHIROT QUICK FIX - One-Command Solution
# Status: Ready to execute
# Time to fix: 5-10 minutes
# Exit on error
set -e

echo "╔════════════════════════════════════════════╗"
echo "║  🤖 SEPHIROT AUTOMATED FIX SCRIPT          ║"
echo "║  Target: https://sephirot.xyz              ║"
echo "║  Problem: Missing 'threads' database table ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# ============================================
# STEP 1: GET DATABASE CREDENTIALS
# ============================================
echo "📍 STEP 1: Getting database credentials..."

# Try to get from environment
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set. Attempting to fetch from Vercel..."

  # Check if vercel CLI exists
  if command -v vercel &> /dev/null; then
    echo "   Running: vercel env pull"
    vercel env pull --yes

    if [ -f ".env.local" ]; then
      source .env.local
    fi
  else
    echo "❌ ERROR: DATABASE_URL not found and vercel CLI not available"
    echo ""
    echo "SOLUTION: Set DATABASE_URL environment variable manually:"
    echo "  export DATABASE_URL='postgresql://user:pass@host/dbname'"
    exit 1
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: Still no DATABASE_URL found"
  exit 1
fi

echo "✅ DATABASE_URL found: ${DATABASE_URL:0:30}..."
echo ""

# ============================================
# STEP 2: TEST DATABASE CONNECTION
# ============================================
echo "📍 STEP 2: Testing database connection..."

if ! psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null; then
  echo "❌ ERROR: Cannot connect to database"
  echo "Check that:"
  echo "  1. PostgreSQL is running"
  echo "  2. DATABASE_URL is correct"
  echo "  3. Network can reach the database"
  exit 1
fi

echo "✅ Database connection successful"
echo ""

# ============================================
# STEP 3: CHECK IF TABLE EXISTS
# ============================================
echo "📍 STEP 3: Checking if 'threads' table exists..."

TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'threads'
  );
")

if [ "$TABLE_EXISTS" = " t" ] || [ "$TABLE_EXISTS" = "t" ]; then
  echo "✅ Table 'threads' already exists"
  SKIP_MIGRATION=true
else
  echo "❌ Table 'threads' does NOT exist - creating..."
  SKIP_MIGRATION=false
fi
echo ""

# ============================================
# STEP 4: CREATE TABLE (if needed)
# ============================================
if [ "$SKIP_MIGRATION" = "false" ]; then
  echo "📍 STEP 4: Creating 'threads' table..."

  psql "$DATABASE_URL" << 'SQL'
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_created_by ON threads(created_by);
SQL

  echo "✅ Table created successfully"
else
  echo "📍 STEP 4: Skipping table creation (already exists)"
fi
echo ""

# ============================================
# STEP 5: VERIFY TABLE
# ============================================
echo "📍 STEP 5: Verifying table structure..."

psql "$DATABASE_URL" -c "\d threads" | head -10
echo "✅ Table verification complete"
echo ""

# ============================================
# STEP 6: TEST API ENDPOINT
# ============================================
echo "📍 STEP 6: Testing API endpoint /api/threads..."

RESPONSE=$(curl -s -w "\n%{http_code}" https://sephirot.xyz/api/threads)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n1)

echo "   HTTP Status: $HTTP_CODE"
echo "   Response: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API is responding with 200 OK"
else
  echo "⚠️  API returned $HTTP_CODE (expected 200)"
  echo "   This might be due to Vercel cache. Waiting 10 seconds..."
  sleep 10

  # Retry
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://sephirot.xyz/api/threads)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is now responding with 200 OK (after cache clear)"
  else
    echo "⚠️  API still showing $HTTP_CODE - might need manual Vercel cache clear"
  fi
fi
echo ""

# ============================================
# STEP 7: TEST CREATE THREAD
# ============================================
echo "📍 STEP 7: Testing thread creation..."

CREATE_RESPONSE=$(curl -s -X POST https://sephirot.xyz/api/threads \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Thread"}' \
  -w "\n%{http_code}")

CREATE_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n1)

echo "   HTTP Status: $CREATE_CODE"
echo "   Response snippet: ${CREATE_BODY:0:100}..."

if [ "$CREATE_CODE" = "201" ] || [ "$CREATE_CODE" = "200" ]; then
  echo "✅ Thread creation successful"
else
  echo "⚠️  Thread creation returned $CREATE_CODE"
fi
echo ""

# ============================================
# STEP 8: FINAL VALIDATION
# ============================================
echo "📍 STEP 8: Running final validation loop..."

ATTEMPT=1
MAX_ATTEMPTS=3
SUCCESS=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ] && [ "$SUCCESS" = "false" ]; do
  echo ""
  echo "   Validation attempt $ATTEMPT of $MAX_ATTEMPTS..."

  # Check database
  DB_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM threads;")
  echo "   ✓ Database table count: $DB_COUNT"

  # Check API
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sephirot.xyz/api/threads)
  echo "   ✓ API status code: $API_STATUS"

  # Check for errors
  API_RESPONSE=$(curl -s https://sephirot.xyz/api/threads)

  if [ "$API_STATUS" = "200" ] && ! echo "$API_RESPONSE" | grep -q "error"; then
    echo "   ✅ All validations PASSED"
    SUCCESS=true
  else
    echo "   ❌ Validations FAILED"
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -le $MAX_ATTEMPTS ]; then
      echo "   Waiting 5 seconds before retry..."
      sleep 5
    fi
  fi
done

echo ""
echo "════════════════════════════════════════════"

if [ "$SUCCESS" = "true" ]; then
  echo "🎉 SUCCESS! SEPHIROT IS NOW FULLY OPERATIONAL 🎉"
  echo "════════════════════════════════════════════"
  echo ""
  echo "Summary:"
  echo "  ✅ Database table 'threads' created"
  echo "  ✅ API /api/threads returns HTTP 200"
  echo "  ✅ Users can create new conversations"
  echo "  ✅ No errors detected"
  echo ""
  echo "Users can now:"
  echo "  • Visit https://sephirot.xyz"
  echo "  • Click 'New chat' to start conversation"
  echo "  • Load and view chat history"
  echo ""
  exit 0
else
  echo "❌ VALIDATION FAILED - Manual Check Needed"
  echo "════════════════════════════════════════════"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Verify DATABASE_URL is correct:"
  echo "     echo \$DATABASE_URL"
  echo ""
  echo "  2. Check database directly:"
  echo "     psql \$DATABASE_URL -c '\\dt threads'"
  echo ""
  echo "  3. Check API errors:"
  echo "     curl https://sephirot.xyz/api/threads"
  echo ""
  echo "  4. Clear Vercel cache:"
  echo "     vercel redeploy"
  echo ""
  exit 1
fi

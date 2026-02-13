# 🔧 Sephirot.xyz - Fix Instructions

## Problem Summary
**HTTP 500 Error**: `relation "threads" does not exist`
- **Root Cause**: PostgreSQL database table `threads` was never created
- **Impact**: Users cannot load or create chat conversations
- **Status**: Application is deployed but non-functional

---

## Quick Fix (5-10 minutes)

### Option 1: Deploy with Migrations (Recommended)

1. **Get source code and check database setup**:
```bash
# Clone the repository
git clone <repo_url> sephirot
cd sephirot

# Check if migrations exist
ls -la migrations/
# or
ls -la db/migrations/
# or
find . -name "*migration*" -o -name "*schema*"
```

2. **Check Vercel environment variables**:
```bash
# Via Vercel CLI
vercel env pull

# Check for DATABASE_URL or similar
cat .env.local | grep -i database
```

3. **Run migrations locally first** (to test):
```bash
# Copy the production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host/dbname"

# Run migrations
npm run migrate
# or
yarn migrate
# or
npx prisma migrate deploy
# or
npx drizzle-kit push:pg
```

4. **If migrations succeed locally, redeploy**:
```bash
# Push to trigger Vercel redeploy
git add .
git commit -m "Trigger redeploy with migrations"
git push
```

5. **Verify fix**:
```bash
curl https://sephirot.xyz/api/threads
# Should return: []
# Not: {"error":"relation \"threads\" does not exist"}
```

---

### Option 2: Direct Database Migration (Fastest)

If you have direct access to the PostgreSQL database:

```bash
# Connect to production database
psql "$DATABASE_URL"

# Check if threads table exists
\dt threads

# If it doesn't exist, run migrations
# (The exact SQL depends on your migration files)

# Example migration:
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

# Verify it worked
\dt threads
SELECT COUNT(*) FROM threads;
```

Then test the API:
```bash
curl https://sephirot.xyz/api/threads
# Should return: []
```

---

### Option 3: Check Vercel Logs (Diagnose)

1. Go to: https://vercel.com/dashboard
2. Select the project "sephirot"
3. Click "Deployments"
4. Select the latest deployment
5. Click "Logs" → "Build"
6. Search for:
   - `migrate` or `migrations`
   - `database` or `postgres`
   - `error` or `failed`

Look for messages like:
```
✓ Migrations applied successfully
✗ Migration failed: connection refused
✗ DATABASE_URL not found
```

---

## Diagnosis Checklist

Before fixing, verify:

- [ ] PostgreSQL database exists and is accessible
- [ ] `DATABASE_URL` environment variable is set in Vercel
- [ ] Database credentials are correct (test with `psql`)
- [ ] Network/firewall allows connection from Vercel (if using external DB)
- [ ] Migration files exist in the repository
- [ ] Migration script is configured in `package.json` or Vercel config

Test database connectivity:
```bash
# If using Neon, Supabase, or similar:
psql "$DATABASE_URL" -c "SELECT 1"
# Should return: (1 row) with value 1
```

---

## Expected Behavior After Fix

### Before Fix ❌
```
GET /api/threads → 500 error
POST /api/threads → 500 error
UI shows: "No conversations yet" (but can't create new ones)
"New chat" button → fails silently
```

### After Fix ✅
```
GET /api/threads → 200 OK, returns []
POST /api/threads → 201 Created, returns new thread
UI shows: Empty list with working "New chat" button
"New chat" button → creates new conversation
```

---

## If Problem Persists

### Check these endpoints:

```bash
# 1. Health check
curl https://sephirot.xyz/api/health
# Expected: {"status":"ok",...}

# 2. Threads list
curl https://sephirot.xyz/api/threads
# Expected: [] or [{ id, title, ... }]

# 3. Check other tables
psql "$DATABASE_URL" -c "\dt"
# Should see: threads, and any other application tables

# 4. Check PostgreSQL errors
psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_statements LIMIT 10"
```

### Common Issues & Solutions:

| Issue | Solution |
|-------|----------|
| `connect ENOTFOUND` | Database host is wrong or unreachable |
| `role "..." does not exist` | Database user/password is wrong |
| `permission denied for database` | User lacks permissions, contact DB admin |
| `connection refused` | Database is down or port is wrong |
| `timeout` | Network firewall blocking connection |

---

## Prevention (For Future)

### 1. Add Pre-deployment Checks
Add to `vercel.json`:
```json
{
  "buildCommand": "npm run build && npm run migrate:prod",
  "devCommand": "npm run dev",
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

### 2. Update Health Check
Make health check test database:
```typescript
// api/health.ts
async function health() {
  try {
    await db.query('SELECT 1');
    return { status: 'ok', database: 'connected' };
  } catch (err) {
    return { status: 'error', database: 'disconnected' };
  }
}
```

### 3. Add Database Warnings in UI
```typescript
if (!canConnectToDatabase) {
  return <div className="error">
    Database connection failed. Please contact support.
  </div>;
}
```

### 4. Setup Monitoring
- Monitor `/api/health` endpoint
- Alert if database connection fails
- Log all 500 errors with context

---

## Timeline

- **T+0**: You run migrations
- **T+5-30min**: Vercel redeploys (usually automatic)
- **T+1-2min**: Cache clears, API responds correctly
- **T+2-3min**: UI loads chat data successfully
- **T+5min**: Users can create new conversations

---

## Questions?

If stuck, check:
1. Vercel dashboard → Build logs
2. Database provider dashboard (Neon, Supabase, etc.)
3. Repository for migration files
4. `.env` variables for DATABASE_URL

---

**Status**: Ready to deploy
**Estimated Fix Time**: 5-10 minutes
**Risk Level**: Low (migrations are idempotent)

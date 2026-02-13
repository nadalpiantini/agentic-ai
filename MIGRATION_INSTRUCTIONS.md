# Database Migration Instructions

## Issue
El endpoint `/api/threads` POST returns error 500 because the database schema requires `user_id` to reference authenticated users in `auth.users`, but the application uses UUID-generated user IDs.

## Solution
Execute this SQL in your Supabase SQL Editor:

### Step 1: Open Supabase Dashboard
1. Go to: https://app.supabase.com/project/nqzhxukuvmdlpewqytpv
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run this SQL

```sql
-- Drop foreign key constraints that reference auth.users
ALTER TABLE public.threads
DROP CONSTRAINT IF EXISTS threads_user_id_fkey;

ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
```

### Step 3: Verify
After running the SQL:
1. Test the GET endpoint: `curl https://sephirot.xyz/api/threads -H "x-user-id: test-user"`
2. Test the POST endpoint: `curl -X POST https://sephirot.xyz/api/threads -H "x-user-id: test-user" -H "Content-Type: application/json" -d '{"title":"Test"}'`

## Why This Is Needed
The application uses UUIDs generated from user ID strings (e.g., "test-user" → UUID), but the schema was designed to require authenticated Supabase users. By dropping the foreign key constraint, we allow the application to work with generated UUIDs instead.

## Alternative: Implement Real Authentication
If you want to implement proper Supabase authentication in the future:
1. Remove this migration
2. Implement Supabase Auth in your frontend
3. Use `auth.uid()` for user identification
4. Restore the foreign key constraints

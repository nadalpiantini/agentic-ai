-- Fix: Allow text user_id for demo/development usage
-- Change user_id from uuid to text to support non-authenticated users

-- Drop the foreign key constraint
alter table public.threads
drop constraint threads_user_id_fkey;

alter table public.messages
drop constraint messages_user_id_fkey;

-- Alter the column type from uuid to text
alter table public.threads
alter column user_id type text using user_id::text;

alter table public.messages
alter column user_id type text using user_id::text;

-- Update RLS policies to work with text user_id
-- (They already work with text since they use = comparison)

-- Note: If you implement real Supabase authentication later,
-- you'll need to reverse this migration and re-add the FK constraints

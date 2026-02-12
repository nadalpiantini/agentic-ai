-- Create threads table for conversation management
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast user lookups
create index idx_threads_user_id on public.threads(user_id);
create index idx_threads_updated_at on public.threads(updated_at desc);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger threads_updated_at
  before update on public.threads
  for each row
  execute function public.update_updated_at();

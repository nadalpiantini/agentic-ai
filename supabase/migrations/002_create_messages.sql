-- Create messages table for chat history
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb,
  tool_call_id text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_messages_thread_id on public.messages(thread_id);
create index idx_messages_created_at on public.messages(thread_id, created_at);

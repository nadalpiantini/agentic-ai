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
-- LangGraph checkpoint tables
-- These are created by PostgresSaver.setup() but we define them here for migration tracking

create table if not exists public.checkpoints (
  thread_id text not null,
  checkpoint_ns text not null default '',
  checkpoint_id text not null,
  parent_checkpoint_id text,
  type text,
  checkpoint jsonb not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  primary key (thread_id, checkpoint_ns, checkpoint_id)
);

create table if not exists public.checkpoint_writes (
  thread_id text not null,
  checkpoint_ns text not null default '',
  checkpoint_id text not null,
  task_id text not null,
  idx integer not null,
  channel text not null,
  type text,
  blob bytea,
  primary key (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);

create table if not exists public.checkpoint_blobs (
  thread_id text not null,
  checkpoint_ns text not null default '',
  channel text not null,
  version text not null,
  type text not null,
  blob bytea,
  primary key (thread_id, checkpoint_ns, channel, version)
);
-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Documents table for RAG
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb default '{}',
  embedding vector(1536), -- OpenAI ada-002 dimension
  created_at timestamptz not null default now()
);

-- Index for vector similarity search
create index idx_documents_embedding on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Similarity search function
create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int default 4,
  filter jsonb default '{}'
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
-- Enable Row Level Security
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;

-- Threads: users can only access their own threads
create policy "Users can view own threads"
  on public.threads for select
  using (auth.uid() = user_id);

create policy "Users can create own threads"
  on public.threads for insert
  with check (auth.uid() = user_id);

create policy "Users can update own threads"
  on public.threads for update
  using (auth.uid() = user_id);

create policy "Users can delete own threads"
  on public.threads for delete
  using (auth.uid() = user_id);

-- Messages: users can access messages in their threads
create policy "Users can view messages in own threads"
  on public.messages for select
  using (
    exists (
      select 1 from public.threads
      where threads.id = messages.thread_id
      and threads.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own threads"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.threads
      where threads.id = messages.thread_id
      and threads.user_id = auth.uid()
    )
  );

-- Documents: authenticated users can read, service role can write
create policy "Authenticated users can view documents"
  on public.documents for select
  to authenticated
  using (true);

-- Checkpoints: no RLS (accessed via service role from server only)
-- The checkpoint tables use service_role key, so RLS is not needed

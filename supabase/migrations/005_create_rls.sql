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

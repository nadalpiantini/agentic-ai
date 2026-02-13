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

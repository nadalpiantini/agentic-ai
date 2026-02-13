# Agentic Hub

Multi-model AI agent platform with stateful workflows, tool execution, and persistent memory.

## Stack

- **Runtime**: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Agent Core**: LangGraph.js (StateGraph orchestrator) + LangChain.js (model adapters, tools)
- **Models**: Claude (quality) | DeepSeek (cost) | Ollama (privacy)
- **Database**: Supabase (Postgres + Auth + RLS + pgvector)
- **State**: TanStack Query (server) + Zustand (client)
- **Styling**: Tailwind CSS v4 + Radix UI primitives
- **Package Manager**: pnpm

## Architecture

```
User → Next.js App Router → API Route (SSE) → LangGraph StateGraph
                                                   ↓
                                           router → planner → executor
                                              ↓         ↓          ↓
                                     model select   LLM call   tool calls
                                              ↓         ↓          ↓
                                     Claude/DS/Ollama  response  Supabase/HTTP/RAG
```

### Agent Flow
1. **Router** - Analyzes message, selects model (Claude/DeepSeek/Ollama)
2. **Planner** - Invokes selected model, gets response with possible tool calls
3. **Executor** - Executes tool calls if present, returns results
4. **Loop** - Executor feeds back to Planner until no more tool calls or loop guard triggers

### Loop Guard
- `llmCalls` counter in state increments each planner invocation
- `MAX_LLM_CALLS` (default 25) prevents infinite loops
- `MAX_RECURSION_DEPTH` (default 10) for graph recursion

## Project Structure

```
app/                        # Next.js App Router pages + API
  api/agent/stream/         # SSE streaming endpoint
  api/agent/run/            # Non-streaming endpoint
  api/threads/              # Thread CRUD
  (dashboard)/              # Protected dashboard pages
  (auth)/                   # Login + auth callback
lib/
  agent/                    # LangGraph agent core
    graph.ts                # StateGraph definition
    state.ts                # State annotation
    nodes/                  # Router, Planner, Executor
    tools/                  # Supabase CRUD, HTTP fetch, RAG search
    checkpointer.ts         # PostgresSaver (Supabase)
  models/                   # Claude, DeepSeek, Ollama adapters
  supabase/                 # Client, Server, Admin clients
  vector-store/             # SupabaseVectorStore + pgvector
  utils/                    # Env validation, errors, cn()
components/
  chat/                     # Chat UI components
  sidebar/                  # Thread sidebar
  providers/                # App providers (QueryClient)
hooks/                      # React hooks (streaming, threads, chat)
config/                     # Model + agent configuration
types/                      # TypeScript types
supabase/migrations/        # SQL migrations (5 files)
tests/                      # Unit + E2E tests
```

## Key Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm test         # Run unit tests (vitest)
pnpm test:e2e     # Run E2E tests (playwright)
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `DATABASE_URL` | Yes | Postgres connection string (for checkpointer) |
| `ANTHROPIC_API_KEY` | No | Claude API key |
| `DEEPSEEK_API_KEY` | No | DeepSeek API key |
| `OLLAMA_BASE_URL` | No | Ollama URL (default: http://localhost:11434) |
| `OPENAI_API_KEY` | No | For embeddings (RAG) |
| `DEFAULT_MODEL` | No | Default: claude |
| `MAX_LLM_CALLS` | No | Default: 25 |
| `MAX_RECURSION_DEPTH` | No | Default: 10 |

## Database Setup

Run migrations in order against your Supabase project:
1. `001_create_threads.sql` - Threads table
2. `002_create_messages.sql` - Messages table
3. `003_create_checkpoints.sql` - LangGraph checkpoint tables
4. `004_enable_pgvector.sql` - pgvector extension + documents table
5. `005_create_rls.sql` - Row Level Security policies

## Conventions

- **Imports**: Use `@/` path alias for all project imports
- **Components**: Functional components, no class components
- **State**: Server state via TanStack Query, client state via Zustand
- **API**: Route handlers in `app/api/`, use `x-user-id` header for auth (replace with Supabase auth)
- **Streaming**: SSE via ReadableStream in route handlers
- **Types**: Strict TypeScript, no `any` unless necessary
- **Zod**: v4 - `z.record(keySchema, valueSchema)` requires 2 args

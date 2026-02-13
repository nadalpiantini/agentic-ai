# Agentic Hub

Multi-model AI agent platform with stateful workflows, tool execution, and persistent memory.

## 🎯 Features

### Multi-Language Support
- **Automatic Language Detection**: Detects user language (English, Spanish, Chinese, French)
- **Localized System Prompts**: Each language has optimized system prompts
- **Smart Context Management**: Maintains language preference across conversations

### Smart Agent Routing
- **3 Specialized Agents**:
  - **Chat Agent** (Zai): General conversation, Q&A
  - **Code Agent** (Claude): Programming, debugging, technical tasks
  - **Search Agent** (DeepSeek): Web browsing, information retrieval
- **Automatic Selection**: Routes to appropriate agent based on message content
- **Constraint Awareness**: Respects privacy, cost, and quality preferences

### Context Stack Management
- **Multi-Thread Support**: Manages conversation contexts across multiple threads
- **Smart Merging**: Append, interleave, or replace context strategies
- **Window Management**: Configurable token limits per context
- **Metadata Tracking**: Language, agent type, timestamps

### Autonomous Scheduler
- **Self-Scheduling**: Agents can schedule their own check-ins and tasks
- **Event-Based Triggers**: Time-based and event-driven execution
- **Self-Healing**: Automatic retry with exponential backoff
- **Statistics**: Track pending, running, completed, and failed tasks

### File System Tool
- **Sandboxed Operations**: All file access restricted to workspace directory
- **Read/Write/List**: Full file manipulation capabilities
- **Security**: Path validation prevents directory traversal attacks

## 🏗️ Architecture

```
User → Next.js App Router → API Route (SSE) → LangGraph StateGraph
                                                   ↓
                                           router → planner → executor
                                              ↓         ↓          ↓
                                     model select   LLM call   tool calls
                                              ↓         ↓          ↓
                                     Claude/DS/Ollama  response   Supabase/HTTP/RAG
```

### Agent Flow
1. **Router** - Analyzes message, selects agent type and optimal model
2. **Planner** - Invokes selected model with localized system prompt and tools
3. **Executor** - Executes tool calls and returns results
4. **Loop** - Executor feeds back to Planner until completion or loop guard triggers

### Loop Guard
- `llmCalls` counter increments each planner invocation
- `MAX_LLM_CALLS` (default 25) prevents infinite loops
- `MAX_RECURSION_DEPTH` (default 10) for graph recursion

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn/bun

### Installation

```bash
# Clone repository
git clone <repository-url>
cd agentic-ai

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your API keys
# Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# Optional: ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, etc.
```

### Environment Variables

| Variable | Required | Description |
|-----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `DATABASE_URL` | Yes | Postgres connection string (for checkpointer) |
| `ANTHROPIC_API_KEY` | No | Claude API key |
| `DEEPSEEK_API_KEY` | No | DeepSeek API key |
| `OLLAMA_BASE_URL` | No | Ollama URL (default: http://localhost:11434) |
| `DEFAULT_MODEL` | No | Default model: claude |
| `MAX_LLM_CALLS` | No | Default: 25 |
| `MAX_RECURSION_DEPTH` | No | Default: 10 |

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📚 Project Structure

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
    tools/                  # Supabase CRUD, HTTP fetch, RAG search, File System
    prompts.ts              # Multi-language system prompts
    agents.ts               # Specialized agent definitions
    context.ts              # Context stack manager
    scheduler.ts             # Autonomous scheduler
    checkpointer.ts          # PostgresSaver (Supabase)
  models/                   # Claude, DeepSeek, Ollama adapters
  supabase/                 # Client, Server, Admin clients
  vector-store/             # SupabaseVectorStore + pgvector
components/
  chat/                     # Chat UI components
  sidebar/                  # Thread sidebar
  providers/                # App providers (QueryClient)
hooks/                      # React hooks
config/                     # Model + agent configuration
types/                      # TypeScript types
supabase/migrations/        # SQL migrations (5 files)
tests/                      # Unit + E2E tests
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Coverage report (requires c8 or vitest --coverage)
pnpm test:coverage
```

## 🎨 Tech Stack

- **Runtime**: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Agent Core**: LangGraph.js (StateGraph orchestrator) + LangChain.js (model adapters, tools)
- **Models**: Claude (quality) | DeepSeek (cost) | Ollama (privacy)
- **Database**: Supabase (Postgres + Auth + RLS + pgvector)
- **State**: TanStack Query (server) + Zustand (client)
- **Styling**: Tailwind CSS v4 + Radix UI primitives
- **Package Manager**: pnpm

## 📝 Conventions

- **Imports**: Use `@/` path alias for all project imports
- **Components**: Functional components, no class components
- **State**: Server state via TanStack Query, client state via Zustand
- **API**: Route handlers in `app/api/`, use `x-user-id` header for auth
- **Streaming**: SSE via ReadableStream in route handlers
- **Types**: Strict TypeScript, no `any` unless necessary
- **Zod**: v4 - `z.record(keySchema, valueSchema)` requires 2 args

## 🛠️ Database Setup

Run migrations in order against your Supabase project:

1. `001_create_threads.sql` - Threads table
2. `002_create_messages.sql` - Messages table
3. `003_create_checkpoints.sql` - LangGraph checkpoint tables
4. `004_enable_pgvector.sql` - pgvector extension + documents table
5. `005_create_rls.sql` - Row Level Security policies
6. `006_create_scheduler.sql` - Autonomous scheduler tables

Or run all at once:
```bash
psql $DATABASE_URL < supabase/migrations/ALL_MIGRATIONS.sql
```

---

Built with ❤️ using [Claude Code](https://claude.com/claude-code)

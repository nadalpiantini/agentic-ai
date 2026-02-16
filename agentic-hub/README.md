# Agentic Hub

Multi-model AI agent platform with stateful workflows, tool execution, and persistent memory.

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/your-repo/agentic-hub.git
cd agentic-hub
pnpm install

# Set up environment
pnpm setup  # Creates .env.local from template
# Edit .env.local with your API keys

# Set up database
pnpm supabase:push  # Apply migrations

# Start development
pnpm dev
```

Visit http://localhost:3000

## 📋 Prerequisites

- **Node.js** v18+ and pnpm
- **Supabase** account for database
- **At least one** LLM API key:
  - Anthropic Claude (recommended)
  - DeepSeek (cost-effective)
  - Ollama (local, free)

## 🔧 Environment Configuration

Copy `.env.example` to `.env.local` and configure:

### Required (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

### Required (At least one LLM)
```bash
# Claude (recommended)
ANTHROPIC_API_KEY=sk-ant-...

# DeepSeek (cost-effective)
DEEPSEEK_API_KEY=sk-...

# Ollama (local, free)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Optional (RAG/Embeddings)
```bash
OPENAI_API_KEY=sk-...  # For vector embeddings
```

Validate your config:
```bash
pnpm validate-env
```

## 🏗️ Architecture

```
User → Next.js App → API Route (SSE) → LangGraph StateGraph
                                              ↓
                                      router → planner → executor
                                          ↓         ↓          ↓
                                  model select   LLM call   tool calls
                                          ↓         ↓          ↓
                                  Claude/DS/Ollama  response  Supabase/HTTP/RAG
```

### Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **Backend**: LangGraph.js + LangChain.js
- **Database**: Supabase (Postgres + RLS + pgvector)
- **State**: TanStack Query (server) + Zustand (client)
- **Testing**: Playwright (E2E) + Vitest (unit)

## 🤖 Multi-Model Routing

The agent automatically selects the best model:

| Use Case | Model | Why |
|----------|-------|-----|
| Privacy-sensitive data | Ollama | Local, no data leaves machine |
| Code tasks | Claude | Best tool use & reasoning |
| Complex reasoning | Claude | Premium capabilities |
| Simple queries | DeepSeek | Cost-effective |

## 🛠️ Available Tools

### Database (Supabase)
- `query_threads` - List threads
- `create_thread` - Create new thread
- `update_thread` - Update thread metadata
- `query_messages` - Get thread history
- `create_message` - Add message to thread

### HTTP (External APIs)
- `http_get` - Fetch data from URLs
- `http_post` - Create data via POST
- `http_put` - Update data via PUT
- `http_delete` - Delete via DELETE

### RAG (Vector Search)
- `semantic_search` - Search documents by meaning
- `add_document` - Add document to knowledge base

## 📁 Project Structure

```
app/                        # Next.js App Router
  api/
    agent/stream/           # SSE streaming endpoint
    threads/                # Thread CRUD API
  (dashboard)/              # Protected pages
  page.tsx                  # Landing page
lib/
  agent/
    graph.ts                # LangGraph StateGraph
    state.ts                # State annotation
    nodes/                  # Router, Planner, Executor
    tools/                  # Supabase, HTTP, RAG tools
  models/                   # Claude, DeepSeek, Ollama adapters
  supabase/                 # Client, Server, Admin clients
components/
  chat/                     # Chat UI components
  sidebar/                  # Thread sidebar
hooks/
  useChatStream.ts          # SSE streaming hook
supabase/migrations/        # SQL migrations
tests/
  e2e/                      # Playwright tests
  integration/              # Vitest tests
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests (headless)
pnpm test:e2e

# Run E2E tests (headed browser)
pnpm test:e2e:headed

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix
```

## 📦 Deployment

### Vercel (Recommended)

1. Connect your repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

```bash
pnpm build  # Test production build locally
```

### Database Setup

```bash
# Apply all migrations
pnpm supabase:push

# Generate TypeScript types from database
pnpm supabase:generate
```

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)
```

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure IP allowlist includes your location

### LLM API errors
- Verify API keys are set correctly
- Check API quotas/billing
- Try a different model

### Type errors
```bash
# Regenerate types from Supabase
pnpm supabase:generate
```

## 📝 Development Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Check code quality
pnpm typecheck    # Type checking
pnpm test         # Run tests
pnpm validate-env # Check .env.local
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [LangGraph.js](https://github.com/langchain-ai/langgraphjs) - Agent orchestration
- [LangChain.js](https://github.com/langchain-ai/langchainjs) - LLM framework
- [Supabase](https://supabase.com) - Backend infrastructure
- [Next.js](https://nextjs.org) - React framework
- [Vercel](https://vercel.com) - Deployment platform

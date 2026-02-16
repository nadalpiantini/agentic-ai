#!/bin/bash

# Agentic Hub - Development Setup Script
# Run this after cloning the repository to set up your environment

set -e

echo "🚀 Agentic Hub - Development Setup"
echo "=================================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
  echo "⚠️  .env.local already exists"
  read -p "Do you want to overwrite it? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled. Keeping existing .env.local"
    exit 0
  fi
fi

# Copy .env.example to .env.local
echo "📋 Creating .env.local from .env.example..."
cp .env.example .env.local

echo ""
echo "✅ .env.local created!"
echo ""
echo "⚠️  IMPORTANT: Edit .env.local and add your API keys:"
echo ""
echo "   Required for local development:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - DATABASE_URL"
echo ""
echo "   At least one model API key:"
echo "   - ANTHROPIC_API_KEY (recommended)"
echo "   - DEEPSEEK_API_KEY (optional)"
echo "   - OPENAI_API_KEY (for RAG)"
echo ""
echo "📖 Setup instructions:"
echo "   1. Create a Supabase project: https://supabase.com/dashboard"
echo "   2. Get your API keys from project settings"
echo "   3. Run migrations: pnpm supabase:push"
echo "   4. Start dev server: pnpm dev"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "⚠️  pnpm is not installed"
  echo "   Install it: npm install -g pnpm"
  echo ""
fi

# Check if Ollama is running (for local model)
if command -v ollama &> /dev/null; then
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running (local model available)"
  else
    echo "⚠️  Ollama is installed but not running"
    echo "   Start it: ollama serve"
    echo ""
  fi
fi

echo "🎯 Next steps:"
echo "   1. Edit .env.local with your API keys"
echo "   2. Run: pnpm install"
echo "   3. Run: pnpm supabase:push (apply migrations)"
echo "   4. Run: pnpm dev"
echo ""
echo "📚 Documentation: See README.md for more details"

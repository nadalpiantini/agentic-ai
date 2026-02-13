# Troubleshooting

## Common Issues and Solutions

### Error: 401 Unauthorized or Model Authentication Failed

**Symptoms:**
- Chat shows: "Error: 401 token expired or incorrect"
- Error from URL: `https://docs.langchain.com/oss/javascript/langchain/errors/MODEL_AUTHENTICATION/`
- New chats fail immediately

**Root Cause:**
The API keys are not configured in `.env.local`. The model creation functions use `env.ANTHROPIC_API_KEY` and similar variables which are empty strings by default.

**Solution:**

1. **Check your API keys:**
   ```bash
   # View current configuration
   cat .env.local
   ```

2. **Add your API keys to `.env.local`:**
   ```bash
   # Edit .env.local
   nano .env.local
   # or
   vim .env.local
   ```

   Add the following variables:
   ```bash
   # Required for Anthropic Claude
   ANTHROPIC_API_KEY=sk-ant-your-key-here

   # Optional: DeepSeek
   DEEPSEEK_API_KEY=sk-your-deepseek-key

   # Optional: Z.ai (for Zai model)
   ZAI_API_KEY=your-zai-key
   ```

3. **Restart the development server:**
   ```bash
   # Stop the server (Ctrl+C or kill the process)
   # Then restart
   pnpm dev
   ```

### Testing Without API Keys

The application has a test mode that works without API keys for UI testing:

```bash
# Run the test chat script
node test-chat.js
```

This will help you verify the UI is working before configuring API keys.

### Getting API Keys

- **Anthropic (Claude)**: https://console.anthropic.com/settings/keys
- **DeepSeek**: https://platform.deepseek.com/api_keys
- **Z.ai (optional)**: https://z.ai/
- **OpenAI (if needed)**: https://platform.openai.com/api-keys

### Database Connection Issues

**Symptoms:**
- Error: "Connection refused" or "ECONNREFUSED"
- PostgreSQL errors in logs

**Solutions:**

1. **Check Supabase is running:**
   ```bash
   # Check if Supabase CLI is installed
   supabase status

   # Or check if local Postgres is running
   psql postgres://localhost:5432/agentic_ai -c "SELECT 1;"
   ```

2. **Verify DATABASE_URL:**
   ```bash
   # Should match your Supabase project URL
   echo $DATABASE_URL
   ```

3. **Reset local database:**
   ```bash
   # Drop and recreate local database
   psql postgres://localhost:5432/postgres -c "DROP DATABASE IF EXISTS agentic_ai;"
   createdb agentic_ai
   ```

### Port Already in Use

**Symptoms:**
- Error: "Error: listen EADDRINUSE: address already in use :::3000"
- Dev server fails to start

**Solution:**

```bash
# Find and kill the process using port 3000
lsof -ti:3000

# Kill it
kill -9 <PID>

# Or use a different port
PORT=3001 pnpm dev
```

### Ollama Connection Issues

**Symptoms:**
- Code agent fails with "Failed to connect to Ollama"
- Timeout errors

**Solutions:**

1. **Check Ollama is running:**
   ```bash
   # Test Ollama endpoint
   curl http://localhost:11434/api/tags

   # Check if Ollama is installed
   ollama list
   ```

2. **Verify OLLAMA_BASE_URL:**
   ```bash
   # Should be http://localhost:11434 by default
   echo $OLLAMA_BASE_URL
   ```

3. **Start Ollama if not running:**
   ```bash
   # Start Ollama server
   ollama serve
   ```

### Development Server Issues

**Symptoms:**
- Dev server crashes immediately
- "Module not found" errors
- Build failures

**Solutions:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild Next.js
rm -rf .next
pnpm dev

# Check for TypeScript errors
pnpm typecheck
```

### Performance Issues

**Symptoms:**
- Slow response times
- High memory usage
- Browser crashes

**Solutions:**

1. **Check system resources:**
   ```bash
   # Check memory usage
   top

   # Check disk space
   df -h
   ```

2. **Reduce context window:**
   Edit `.env.local`:
   ```bash
   # Reduce max tokens to improve performance
   MAX_LLM_CALLS=10
   ```

3. **Enable streaming:**
   Streaming is enabled by default for better UX
   Ensure `streamingEnabled: true` in `lib/config/agent.ts`

---

## Still Need Help?

1. **Check logs**: Run `pnpm dev` and look for error messages
2. **GitHub Issues**: Search existing issues at https://github.com/nadalpiantini/agentic-ai/issues
3. **LangChain Docs**: https://js.langchain.com/ for detailed framework documentation
4. **Community**: Join the Discord community or ask for help in GitHub discussions

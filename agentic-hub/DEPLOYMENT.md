# Deployment Checklist

Use this checklist when deploying Agentic Hub to production.

## Pre-Deployment

### Environment Setup
- [ ] `.env.local` created from `.env.example`
- [ ] All required environment variables set
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `DATABASE_URL`
- [ ] At least one LLM API key configured
  - [ ] `ANTHROPIC_API_KEY` (recommended)
  - [ ] `DEEPSEEK_API_KEY` (optional)
  - [ ] `OLLAMA_BASE_URL` (optional, local only)

### Database Setup
- [ ] Supabase project created
- [ ] All migrations applied (`pnpm supabase:push`)
  - [ ] 001_create_threads.sql
  - [ ] 002_create_messages.sql
  - [ ] 003_create_checkpoints.sql
  - [ ] 004_enable_pgvector.sql
  - [ ] 005_create_rls.sql
- [ ] RLS policies enabled
- [ ] Test data seeded (optional)

### Code Quality
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Linter passes (`pnpm lint`)
- [ ] Tests passing (`pnpm test`)
- [ ] E2E tests passing (`pnpm test:e2e`)
- [ ] No console.log errors in critical paths
- [ ] Production build succeeds (`pnpm build`)

### Security
- [ ] API keys not committed to git
- [ ] `.env.local` in `.gitignore`
- [ ] Supabase RLS policies tested
- [ ] Rate limiting configured (if applicable)
- [ ] CORS settings correct
- [ ] No hardcoded credentials

## Deployment Platforms

### Vercel (Recommended)
- [ ] Repo connected to Vercel
- [ ] Environment variables configured in Vercel dashboard
- [ ] Custom domain configured (optional)
- [ ] Deployment preview enabled
- [ ] Build settings verified
  ```json
  {
    "buildCommand": "pnpm build",
    "devCommand": "pnpm dev",
    "installCommand": "pnpm install"
  }
  ```

### Railway
- [ ] Railway project created
- [ ] Environment variables set
- [ ] Buildpacks configured
- [ ] Health check endpoint configured (`/api/health`)

### Docker
- [ ] `Dockerfile` created
- [ ] `.dockerignore` configured
- [ ] Environment variables in docker-compose or env file
- [ ] Database volume mounted
- [ ] Port exposed (3000)

## Post-Deployment

### Verification
- [ ] Application loads at production URL
- [ ] Health check endpoint responds: `GET /api/health`
  ```json
  {
    "status": "ok",
    "checks": {
      "database": "ok",
      "env": "ok",
      "llm": "ok"
    }
  }
  ```
- [ ] Database connectivity working
- [ ] LLM API calls working
- [ ] SSE streaming functional
- [ ] Tool execution working

### Monitoring
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics enabled (optional)
- [ ] Logging configured
- [ ] Uptime monitoring configured
- [ ] Alerts set up for:
  - API errors
  - Database connection failures
  - LLM API failures
  - High error rates

### Performance
- [ ] Page load time < 3 seconds
- [ ] Time to First Byte (TTFB) < 500ms
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] CDN configured (if applicable)

## Rollback Plan

If deployment fails:
1. Check deployment logs for errors
2. Verify environment variables
3. Test database connectivity
4. Rollback to previous version:
   ```bash
   # Vercel
   vercel rollback

   # Railway
   railway rollback

   # Git
   git revert HEAD
   git push
   ```

## Maintenance

### Regular Tasks
- [ ] Update dependencies weekly
- [ ] Check API quotas/billing
- [ ] Monitor database storage
- [ ] Review error logs
- [ ] Test backup/restore procedures
- [ ] Update documentation

### Scaling
- [ ] Database connection pooling configured
- [ ] CDN enabled for static assets
- [ ] Caching strategy configured
- [ ] Load balancing (if needed)
- [ ] Auto-scaling rules (if applicable)

## Support

For issues:
1. Check logs: `vercel logs` or Railway logs
2. Run health check: `curl https://your-domain.com/api/health`
3. Review this checklist
4. Check GitHub issues
5. Contact support team

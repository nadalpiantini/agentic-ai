# Sephirot OC Squadron — Deployment Package

**Version:** 1.0.0 (2026-02-25)
**Status:** ✅ Operational - Production Ready

## Quick Start

```bash
# 1. Extract to target location
tar -xzf sephirot-oc-squadron-v1.0.0.tar.gz
cd sephirot-oc/

# 2. Verify Python version
python3 --version  # Must be 3.9+

# 3. Install dependencies (none required - stdlib only)

# 4. Configure credentials
cp ~/.freejack-credentials.env ~/.freejack-credentials.env.local  # If needed

# 5. Test run
python3 oc_runner.py --status

# 6. Schedule with launchd (macOS)
ln -s $(pwd)/com.openclaw.sephirot-oc.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.openclaw.sephirot-oc.plist
```

## Deployment Architecture

```
sephirot-oc/
├── oc_runner.py              # Main entry point
├── oc_claw.yaml              # Squadron config
├── com.openclaw.sephirot-oc.plist  # launchd scheduler
├── agents/                   # Pipeline agents
│   ├── oc_commander.py       # Orchestrator
│   ├── oc_scanner.py         # Tavily/GNews scanner
│   ├── oc_signal_filter.py   # Deduplication
│   ├── oc_ranker.py          # Scoring algorithm
│   └── oc_email_synth.py     # Brief composer
├── briefs/                   # Daily brief archives
├── config/                   # Source registry
├── memory/                   # Signal memory store
└── logs/                     # Pipeline logs
```

## External Dependencies

### Project Root Dependency
This squadron REQUIRES access to:
```
~/dev/openclawmasters_agents/agents/llm.py
```

**Critical:** The project root MUST be at this exact path, or update `PROJECT_ROOT` in:
- `oc_runner.py` (line ~50)
- `agents/oc_email_synth.py` (line ~22)

### Credentials Required
```bash
~/.freejack-credentials.env:
  export TAVILY_API_KEY="..."
  export DEEPSEEK_API_KEY="..."  # Optional (LLM executive summary)
  export ZAI_API_KEY="..."        # Optional (preferred LLM)
```

### Email Configuration (Optional)
```bash
~/.openclaw/config/email_global.json:
{
  "from_email": "bot@openclawmasters.com",
  "to_emails": ["alan@openclawmasters.com"],
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_user": "bot@openclawmasters.com",
  "smtp_password": "app_password_here"
}
```

## Pipeline Stages

1. **Scan** (`oc_scanner`)
   - Tavily API (primary) - 40 queries per run
   - Google News RSS (fallback) - Free

2. **Filter** (`oc_signal_filter`)
   - Batch deduplication (11+ signals)
   - History deduplication (memory store)

3. **Rank** (`oc_ranker`)
   - OpportunityScore: recency + relevance
   - ConfidenceScore: source quality

4. **Email** (`oc_email_synth`)
   - LLM executive summary (via agents/llm.py)
   - Daily brief composition
   - SMTP delivery

## Schedule

**Default:** Daily at 8:00 AM AST (via launchd)

```bash
# Manual runs:
python3 oc_runner.py                           # US only (default)
python3 oc_runner.py --countries US,CN,UK,JP   # Custom countries
python3 oc_runner.py --heartbeat              # Health check
python3 oc_runner.py --status                 # View stats
```

## State Persistence

```
~/.openclaw/squadrons/sephirot-oc/
├── data/state.json           # Squadron state
├── logs/                     # Pipeline logs
└── logs/run_*.json           # Run archives
```

## Monitoring

### Check Status
```bash
cd ~/dev/openclawmasters_agents/squadrons/sephirot-oc
python3 oc_runner.py --status
```

### View Logs
```bash
# Latest run log
cat ~/.openclaw/squadrons/sephirot-oc/logs/run_*.json | tail -50

# launchd logs
tail -f ~/.openclaw/squadrons/sephirot-oc/logs/launchd_stdout.log
tail -f ~/.openclaw/squadrons/sephirot-oc/logs/launchd_stderr.log
```

### Latest Brief
```bash
cat ~/dev/openclawmasters_agents/squadrons/sephirot-oc/briefs/brief_$(date +%Y%m%d).txt
```

## Troubleshooting

### "LLM module not found"
**Cause:** Project root path mismatch
**Fix:** Update `PROJECT_ROOT` in `oc_runner.py` line ~50:
```python
PROJECT_ROOT = Path("/CORRECT/PATH/to/openclawmasters_agents")
```

### "Tavily unavailable"
**Cause:** Missing TAVILY_API_KEY or rate limit
**Fix:** Squadron auto-falls back to Google News RSS (free)

### "Email send FAILED"
**Cause:** Missing `~/.openclaw/config/email_global.json`
**Fix:** Briefs still archived to `briefs/` directory

### launchd not running
```bash
# Unload old service
launchctl unload ~/Library/LaunchAgents/com.openclaw.sephirot-oc.plist

# Check logs
cat ~/.openclaw/squadrons/sephirot-oc/logs/launchd_stderr.log

# Reload
launchctl load ~/Library/LaunchAgents/com.openclaw.sephirot-oc.plist
```

## Metrics (Last 7 Days)

| Metric | Value |
|--------|-------|
| Total runs | 7 |
| Queries executed | 840 |
| Signals processed | 4,195 |
| Emails sent | 7 |
| Total cost | $3.60 (Tavily) |
| Memory entries | 149 |

## Rollback

If deployment fails:
```bash
# Stop service
launchctl unload ~/Library/LaunchAgents/com.openclaw.sephirot-oc.plist

# Restore previous version
cd ~/dev/openclawmasters_agents/squadrons/
git checkout HEAD~1 sephirot-oc/

# Restart
cd sephirot-oc
python3 oc_runner.py --status
```

## Support

**Squadron Registry:** `~/dev/openclawmasters_agents/squadrons/REGISTRY.md`
**Project Docs:** `~/dev/openclawmasters_agents/README.md`
**Issues:** Create ticket in project repository

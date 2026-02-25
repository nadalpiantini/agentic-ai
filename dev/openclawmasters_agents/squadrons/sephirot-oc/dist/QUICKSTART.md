# 🚀 Quick Start - Sephirot OC Squadron

## Option 1: Deploy Locally (This Machine)

```bash
cd ~/dev/openclawmasters_agents/squadrons/sephirot-oc/dist
./deploy.sh localhost
```

## Option 2: Deploy to Remote Server

```bash
cd ~/dev/openclawmasters_agents/squadrons/sephirot-oc/dist
./deploy.sh user@remote-server.com
```

## Option 3: Manual Deployment

```bash
# 1. Extract package
cd ~/dev/openclawmasters_agents/squadrons/sephirot-oc
tar -xzf dist/sephirot-oc-squadron-v1.0.0.tar.gz -C . --strip-components=1

# 2. Run setup
bash dist/setup.sh

# 3. Verify
python3 oc_runner.py --status
```

## Verify Deployment

```bash
# Check status
cd ~/dev/openclawmasters_agents/squadrons/sephirot-oc
python3 oc_runner.py --status

# Run manual test
python3 oc_runner.py --countries US

# View latest brief
cat briefs/brief_$(date +%Y%m%d).txt
```

## Expected Output

```
Sephirot Agent OC — Status
  Status: active
  Total runs: 7
  Total queries: 840
  Total signals: 4,195
  Total emails: 7
```

## Troubleshooting

### "LLM module not found"
Update `PROJECT_ROOT` in `oc_runner.py` line ~50 to match your path.

### "Tavily unavailable"
Auto-fallback to Google News RSS (free). No action needed.

### "Email send FAILED"
Create `~/.openclaw/config/email_global.json` or briefs will be archived to `briefs/` only.

## Full Documentation

See `DEPLOY_README.md` for complete deployment guide.

#!/bin/bash
# Sephirot OC Squadron - Setup Script
# Run this after extracting the deployment package

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Sephirot OC Squadron — Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detect Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Python found: $PYTHON_VERSION"

# Check required version
if [[ $(echo "$PYTHON_VERSION 3.9" | awk '{print ($1 < $2)}') -eq 1 ]]; then
    echo "❌ Python 3.9+ required, found $PYTHON_VERSION"
    exit 1
fi

# Create required directories
echo ""
echo "📁 Creating directories..."
mkdir -p briefs
mkdir -p logs
mkdir -p memory
mkdir -p config

# Check project root dependency
PROJECT_ROOT="$HOME/dev/openclawmasters_agents"
if [[ ! -d "$PROJECT_ROOT/agents" ]]; then
    echo "⚠️  WARNING: Project root not found at $PROJECT_ROOT"
    echo "   If the project is elsewhere, update PROJECT_ROOT in:"
    echo "   - oc_runner.py (line ~50)"
    echo "   - agents/oc_email_synth.py (line ~22)"
else
    echo "✅ Project root found: $PROJECT_ROOT"
fi

# Check agents/llm.py
if [[ ! -f "$PROJECT_ROOT/agents/llm.py" ]]; then
    echo "❌ CRITICAL: agents/llm.py not found"
    echo "   This squadron requires access to the project's LLM module"
    exit 1
else
    echo "✅ LLM module found: $PROJECT_ROOT/agents/llm.py"
fi

# Check credentials
if [[ ! -f "$HOME/.freejack-credentials.env" ]]; then
    echo "⚠️  WARNING: ~/.freejack-credentials.env not found"
    echo "   Create it with:"
    echo "   export TAVILY_API_KEY='your_key_here'"
    echo "   export DEEPSEEK_API_KEY='your_key_here'  # Optional"
else
    echo "✅ Credentials file found"
fi

# Verify squadron files
echo ""
echo "📋 Verifying squadron files..."
FILES=(
    "oc_runner.py"
    "oc_claw.yaml"
    "agents/oc_commander.py"
    "agents/oc_scanner.py"
    "agents/oc_signal_filter.py"
    "agents/oc_ranker.py"
    "agents/oc_email_synth.py"
)

ALL_GOOD=true
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  ✅ $file"
    else
        echo "  ❌ MISSING: $file"
        ALL_GOOD=false
    fi
done

if [[ "$ALL_GOOD" == "false" ]]; then
    echo ""
    echo "❌ Some files are missing. Please re-extract the deployment package."
    exit 1
fi

# Run status check
echo ""
echo "🔍 Running status check..."
if python3 oc_runner.py --status &> /dev/null; then
    echo "✅ Squadron status check passed"
else
    echo "⚠️  Status check failed. Run manually: python3 oc_runner.py --status"
fi

# Schedule service
echo ""
echo "⏰ Scheduling service (launchd)..."
PLIST_PATH="$HOME/Library/LaunchAgents/com.openclaw.sephirot-oc.plist"

if [[ -f "com.openclaw.sephirot-oc.plist" ]]; then
    # Update plist with absolute path
    SQUADRON_PATH="$(pwd)"
    sed -i.bak "s|/Users/anp/dev/openclawmasters_agents/squadrons/sephirot-oc|$SQUADRON_PATH|g" com.openclaw.sephirot-oc.plist

    echo "  Installing plist to $PLIST_PATH"
    cp com.openclaw.sephirot-oc.plist "$PLIST_PATH"

    echo "  Loading service..."
    if launchctl load "$PLIST_PATH" 2>/dev/null; then
        echo "✅ Service scheduled (daily at 8:00 AM)"
    else
        echo "⚠️  Service load failed. You may need to load manually:"
        echo "   launchctl load $PLIST_PATH"
    fi
else
    echo "⚠️  com.openclaw.sephirot-oc.plist not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Quick commands:"
echo "  python3 oc_runner.py --status    # Check status"
echo "  python3 oc_runner.py             # Run now"
echo "  python3 oc_runner.py --heartbeat # Health check"
echo ""
echo "📝 Latest brief:"
echo "  cat briefs/brief_\$(date +%Y%m%d).txt"
echo ""
echo "📖 Full documentation: DEPLOY_README.md"
echo ""

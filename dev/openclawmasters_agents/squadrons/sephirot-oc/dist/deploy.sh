#!/bin/bash
# Quick deployment script for Sephirot OC Squadron
# Usage: ./deploy.sh [target_host]

set -e

TARGET_HOST="${1:-localhost}"
SQUADRON_PATH="$HOME/dev/openclawmasters_agents/squadrons/sephirot-oc"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Sephirot OC Squadron — Deploy to $TARGET_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "$TARGET_HOST" == "localhost" ]]; then
    echo "📍 Local deployment"

    # Stop existing service
    if launchctl list | grep -q "com.openclaw.sephirot-oc"; then
        echo "  Stopping existing service..."
        launchctl unload ~/Library/LaunchAgents/com.openclaw.sephirot-oc.plist 2>/dev/null || true
    fi

    # Backup current state
    if [[ -d "$SQUADRON_PATH" ]]; then
        BACKUP_DIR="$SQUADRON_PATH.backup.$(date +%Y%m%d_%H%M%S)"
        echo "  Backing up current state to $BACKUP_DIR"
        cp -r "$SQUADRON_PATH" "$BACKUP_DIR"
    fi

    # Extract new version
    echo "  Extracting deployment package..."
    cd "$SQUADRON_PATH"
    tar -xzf dist/sephirot-oc-squadron-v1.0.0.tar.gz -C "$SQUADRON_PATH" --strip-components=1

    # Run setup
    echo "  Running setup..."
    cd "$SQUADRON_PATH"
    bash dist/setup.sh

    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📊 Check status:"
    echo "  cd $SQUADRON_PATH"
    echo "  python3 oc_runner.py --status"

else
    echo "🌐 Remote deployment to $TARGET_HOST"

    # Check SSH connection
    if ! ssh -o ConnectTimeout=5 "$TARGET_HOST" "echo 'Connection OK'" 2>/dev/null; then
        echo "❌ Cannot connect to $TARGET_HOST"
        exit 1
    fi

    # Stop existing service
    echo "  Stopping existing service on remote..."
    ssh "$TARGET_HOST" "launchctl unload ~/Library/LaunchAgents/com.openclaw.sephirot-oc.plist 2>/dev/null || true"

    # Upload package
    echo "  Uploading deployment package..."
    scp dist/sephirot-oc-squadron-v1.0.0.tar.gz "$TARGET_HOST:/tmp/"

    # Extract and setup on remote
    echo "  Extracting and setup on remote..."
    ssh "$TARGET_HOST" << 'ENDSSH'
        mkdir -p ~/dev/openclawmasters_agents/squadrons
        cd ~/dev/openclawmasters_agents/squadrons

        # Backup existing
        if [[ -d "sephirot-oc" ]]; then
            mv sephirot-oc sephirot-oc.backup.$(date +%Y%m%d_%H%M%S)
        fi

        # Extract
        mkdir -p sephirot-oc
        tar -xzf /tmp/sephirot-oc-squadron-v1.0.0.tar.gz -C sephirot-oc --strip-components=1

        # Setup
        cd sephirot-oc
        bash dist/setup.sh

        # Cleanup
        rm /tmp/sephirot-oc-squadron-v1.0.0.tar.gz
ENDSSH

    echo ""
    echo "✅ Remote deployment complete!"
    echo ""
    echo "📊 Check status on remote:"
    echo "  ssh $TARGET_HOST 'cd ~/dev/openclawmasters_agents/squadrons/sephirot-oc && python3 oc_runner.py --status'"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

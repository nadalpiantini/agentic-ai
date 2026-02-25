"""
Sephirot Agent OC — Global Intelligence Squadron Runner
Executes the daily intelligence pipeline: scan → filter → rank → email.

Usage:
    python oc_runner.py                 # Single run (US hot market)
    python oc_runner.py --countries US,CN,UK   # Specific countries
    python oc_runner.py --heartbeat     # Health check
    python oc_runner.py --status        # Show status
    python oc_runner.py --loop          # Run daily in loop mode
    python oc_runner.py --loop --interval=24  # Custom interval (hours)
"""

import os
import sys
import json
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path


# --- Load credentials from ~/.freejack-credentials.env ---

def _load_credentials():
    """Load env vars from credentials file (shell export format)."""
    creds_file = Path.home() / ".freejack-credentials.env"
    if not creds_file.exists():
        return
    with open(creds_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("export ") and "=" in line:
                # Parse: export KEY="value"
                kv = line[7:]  # strip 'export '
                key, _, value = kv.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value

_load_credentials()

# Ensure project root is in sys.path for agents.llm import
# Use absolute path to avoid relative resolution issues
SQUADRON_ROOT = Path(__file__).parent.resolve()
PROJECT_ROOT = Path("/Users/anp/dev/openclawmasters_agents")  # Absolute path for reliability
sys.path.insert(0, str(PROJECT_ROOT))

# Import local agents directly to avoid agents/ namespace collision
# The project has agents/llm.py, the squadron has agents/oc_commander.py
import importlib.util

def _import_local_agent(name):
    """Import a local agent file from squadron/agents/"""
    spec = importlib.util.spec_from_file_location(f"sephirot_oc_{name}", SQUADRON_ROOT / "agents" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[f'sephirot_oc_{name}'] = module
    spec.loader.exec_module(module)
    return module

# Import all required local agents
oc_commander = _import_local_agent('oc_commander')
oc_scanner = _import_local_agent('oc_scanner')
oc_signal_filter = _import_local_agent('oc_signal_filter')
oc_ranker = _import_local_agent('oc_ranker')
oc_email_synth = _import_local_agent('oc_email_synth')

run_pipeline = oc_commander.run_pipeline
heartbeat = oc_commander.heartbeat
status = oc_commander.status


LOG_DIR = Path.home() / ".openclaw" / "squadrons" / "sephirot-oc" / "logs"


def setup():
    """Ensure directories exist."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)


def log_run(run_data):
    """Log pipeline run to file."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    log_file = LOG_DIR / f"run_{timestamp}.json"

    with open(log_file, "w") as f:
        json.dump(run_data, f, indent=2, default=str)

    return str(log_file)


def execute(countries=None):
    """Execute a single intelligence pipeline run."""
    setup()

    print("\n" + "-" * 50)
    print(f"  Sephirot Agent OC — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("-" * 50)

    # Run pipeline
    run_log = run_pipeline(countries=countries)

    # Save run log
    log_path = log_run(run_log)
    print(f"  Log: {log_path}")

    return run_log


def _parse_countries(args):
    """Parse --countries flag from CLI args."""
    for arg in args:
        if arg.startswith("--countries="):
            codes = arg.split("=", 1)[1]
            return [c.strip().upper() for c in codes.split(",") if c.strip()]
    return None


def main():
    """Main entry point with CLI flags."""
    if "--heartbeat" in sys.argv or "-hb" in sys.argv:
        hb = heartbeat()
        log_path = log_run(hb)
        print(f"  Log: {log_path}")
        return

    if "--status" in sys.argv or "-s" in sys.argv:
        status()
        return

    # Parse country override
    countries = _parse_countries(sys.argv)

    # Single run mode
    if "--loop" not in sys.argv:
        execute(countries=countries)
        return

    # Loop mode
    interval_hours = 24  # Daily default
    for arg in sys.argv:
        if arg.startswith("--interval="):
            interval_hours = int(arg.split("=")[1])

    print(f"  Loop mode: running every {interval_hours} hours")
    print("  Press Ctrl+C to stop\n")

    while True:
        try:
            execute(countries=countries)
            print(f"\n  Next run in {interval_hours} hours...")
            time.sleep(interval_hours * 3600)
        except KeyboardInterrupt:
            print("\n\nStopped by user.")
            break
        except Exception as e:
            print(f"\n  ERROR: {e}")
            traceback.print_exc()
            print(f"  Retrying in {interval_hours} hours...")
            time.sleep(interval_hours * 3600)


if __name__ == "__main__":
    main()

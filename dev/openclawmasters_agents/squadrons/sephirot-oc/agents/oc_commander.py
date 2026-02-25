"""
OC Commander Agent — Pipeline orchestrator for Sephirot Agent OC.
Manages the full scan → filter → rank → synthesize → email pipeline.
Adapts the orchestration pattern from nrs_chief.py.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


# --- Paths ---

SQUADRON_DIR = Path.home() / ".openclaw" / "squadrons" / "sephirot-oc"
STATE_FILE = SQUADRON_DIR / "data" / "state.json"
HEARTBEAT_LOG_DIR = SQUADRON_DIR / "logs"
MEMORY_DIR = Path(__file__).parent.parent / "memory"
STORE_FILE = MEMORY_DIR / "oc_store.json"

# Add project root for llm import (absolute path for reliability)
_PROJECT_ROOT = Path("/Users/anp/dev/openclawmasters_agents")
sys.path.insert(0, str(_PROJECT_ROOT))


# --- State Management ---

def _load_state():
    """Load current squadron state."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        "last_run": None,
        "last_heartbeat": None,
        "total_runs": 0,
        "total_queries": 0,
        "total_signals_processed": 0,
        "total_emails_sent": 0,
        "total_cost_usd": 0.0,
        "status": "initialized",
    }


def _save_state(state):
    """Persist squadron state."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2, default=str)


# --- Memory Management ---

def _load_memory():
    """Load signal memory store."""
    if STORE_FILE.exists():
        with open(STORE_FILE) as f:
            return json.load(f)
    return {
        "entries": [],
        "metadata": {"created": None, "updated": None, "entry_count": 0},
    }


def _save_memory(memory):
    """Persist signal memory."""
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    memory["metadata"]["updated"] = datetime.now(timezone.utc).isoformat()
    memory["metadata"]["entry_count"] = len(memory.get("entries", []))
    with open(STORE_FILE, "w") as f:
        json.dump(memory, f, indent=2, default=str)


def _record_signals(signals):
    """Add processed signals to memory for future dedup."""
    memory = _load_memory()
    now = datetime.now(timezone.utc).isoformat()

    if memory["metadata"]["created"] is None:
        memory["metadata"]["created"] = now

    for s in signals:
        entry = {
            "title": s.get("title", ""),
            "url": s.get("url", ""),
            "country": s.get("country", ""),
            "industry": s.get("industry", ""),
            "opportunity_score": s.get("opportunity_score", 0),
            "confidence_score": s.get("confidence_score", 0),
            "processed_at": now,
        }
        memory["entries"].append(entry)

    # Trim to last 90 days (~2700 entries max at 30/day)
    max_entries = 3000
    if len(memory["entries"]) > max_entries:
        memory["entries"] = memory["entries"][-max_entries:]

    _save_memory(memory)


# --- Pipeline ---

def run_pipeline(countries=None):
    """
    Execute the full Sephirot OC pipeline: scan → filter → rank → email.

    Args:
        countries: Optional explicit country list. If None, uses default hot markets.

    Returns:
        Pipeline run log dict.
    """
    # Import agent modules (loaded by runner via importlib)
    import sys
    scan = sys.modules['sephirot_oc_oc_scanner'].run
    filter_signals = sys.modules['sephirot_oc_oc_signal_filter'].run
    rank = sys.modules['sephirot_oc_oc_ranker'].run

    state = _load_state()

    # Default to hot market countries for v0.1
    if countries is None:
        countries = ["US"]  # MVP: US only

    run_log = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "status": "running",
        "countries": countries,
        "signals_raw": 0,
        "signals_filtered": 0,
        "signals_top": 0,
        "signals_watchlist": 0,
        "queries_executed": 0,
        "cost_estimate": 0.0,
        "email_sent": False,
        "errors": [],
    }

    print("\n" + "=" * 60)
    print("  Sephirot Agent OC — Intelligence Pipeline")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"  Countries: {', '.join(countries)}")
    print("=" * 60)

    # Stage 1: Scan
    print(f"\n[1/4] Scanning {len(countries)} countries...")
    try:
        scan_result = scan(countries)
        signals = scan_result["signals"]
        run_log["signals_raw"] = len(signals)
        run_log["queries_executed"] = scan_result["queries_executed"]
        run_log["cost_estimate"] = scan_result["cost_estimate"]
        scan_stats = {
            "countries_scanned": countries,
            "queries_executed": scan_result["queries_executed"],
            "cost_estimate": scan_result["cost_estimate"],
            "engine": scan_result["engine"],
        }
    except Exception as e:
        print(f"  FATAL: Scanner failed: {e}")
        run_log["status"] = "failed"
        run_log["errors"].append(f"scanner: {e}")
        _save_run_state(state, run_log)
        return run_log

    if not signals:
        print("  No signals found. Pipeline complete.")
        run_log["status"] = "complete_empty"
        _save_run_state(state, run_log)
        return run_log

    # Stage 2: Filter
    print(f"\n[2/4] Filtering {len(signals)} signals...")
    try:
        filtered = filter_signals(signals)
        run_log["signals_filtered"] = len(filtered)
    except Exception as e:
        print(f"  WARNING: Filter failed: {e}")
        filtered = signals  # Continue with unfiltered
        run_log["errors"].append(f"filter: {e}")

    if not filtered:
        print("  All signals filtered out. Pipeline complete.")
        run_log["status"] = "complete_filtered"
        _save_run_state(state, run_log)
        return run_log

    # Stage 3: Rank
    print(f"\n[3/4] Ranking {len(filtered)} signals...")
    try:
        ranked = rank(filtered)
        run_log["signals_top"] = len(ranked.get("top", []))
        run_log["signals_watchlist"] = len(ranked.get("watchlist", []))
    except Exception as e:
        print(f"  WARNING: Ranker failed: {e}")
        ranked = {"top": filtered[:10], "watchlist": [], "excluded": 0}
        run_log["errors"].append(f"ranker: {e}")

    # Stage 4: Email
    print(f"\n[4/4] Composing daily brief...")
    try:
        email_synth = sys.modules['sephirot_oc_oc_email_synth'].run
        email_result = email_synth(ranked, scan_stats)
        run_log["email_sent"] = email_result.get("email_sent", False)
    except Exception as e:
        print(f"  WARNING: Email synthesis failed: {e}")
        run_log["errors"].append(f"email: {e}")

    # Record signals in memory for future dedup
    all_ranked = ranked.get("top", []) + ranked.get("watchlist", [])
    _record_signals(all_ranked)

    # Finalize
    run_log["status"] = "complete"
    run_log["finished_at"] = datetime.now(timezone.utc).isoformat()

    _save_run_state(state, run_log)

    # Summary
    print("\n" + "=" * 60)
    print("  Pipeline Complete")
    print(f"  Raw: {run_log['signals_raw']} | Filtered: {run_log['signals_filtered']} | "
          f"Top: {run_log['signals_top']} | Watchlist: {run_log['signals_watchlist']}")
    print(f"  Queries: {run_log['queries_executed']} | Cost: ${run_log['cost_estimate']:.2f}")
    print(f"  Email: {'SENT' if run_log['email_sent'] else 'NOT SENT'}")
    if run_log["errors"]:
        print(f"  Errors: {len(run_log['errors'])}")
    print("=" * 60)

    return run_log


def _save_run_state(state, run_log):
    """Update persistent state after a run."""
    state["last_run"] = run_log["started_at"]
    state["total_runs"] = state.get("total_runs", 0) + 1
    state["total_queries"] = state.get("total_queries", 0) + run_log.get("queries_executed", 0)
    state["total_signals_processed"] = (
        state.get("total_signals_processed", 0) + run_log.get("signals_raw", 0)
    )
    if run_log.get("email_sent"):
        state["total_emails_sent"] = state.get("total_emails_sent", 0) + 1
    state["total_cost_usd"] = state.get("total_cost_usd", 0) + run_log.get("cost_estimate", 0)
    state["status"] = "active"
    _save_state(state)


# --- Heartbeat ---

def heartbeat():
    """Daily heartbeat check — verify all agents and services available."""
    print("\n" + "=" * 60)
    print("  Sephirot Agent OC — Heartbeat")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)

    state = _load_state()
    hb = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "healthy",
        "agents": {},
        "services": {},
        "stats": {},
        "issues": [],
    }

    # Check agent imports
    agents = ["oc_scanner", "oc_signal_filter", "oc_ranker", "oc_email_synth"]
    for agent_name in agents:
        try:
            __import__(f"agents.{agent_name}")
            hb["agents"][agent_name] = "available"
            print(f"  {agent_name}: available")
        except ImportError as e:
            hb["agents"][agent_name] = f"error: {e}"
            hb["issues"].append(f"{agent_name} import failed: {e}")
            hb["status"] = "degraded"
            print(f"  {agent_name}: ERROR — {e}")

    # Check Tavily API key
    tavily_key = os.environ.get("TAVILY_API_KEY")
    hb["services"]["tavily"] = "configured" if tavily_key else "not configured"
    if not tavily_key:
        hb["issues"].append("TAVILY_API_KEY not set — will use Google News RSS fallback")
    print(f"  Tavily: {'configured' if tavily_key else 'NOT CONFIGURED (fallback mode)'}")

    # Check LLM
    try:
        from agents.llm import generate
        llm_ok = generate("Say OK", max_tokens=5, temperature=0) is not None
    except Exception:
        llm_ok = False
    hb["services"]["llm"] = "available" if llm_ok else "unavailable"
    if not llm_ok:
        hb["issues"].append("LLM provider unavailable")
        hb["status"] = "degraded"
    print(f"  LLM: {'available' if llm_ok else 'UNAVAILABLE'}")

    # Check email config
    email_cfg = Path.home() / ".openclaw" / "config" / "email_global.json"
    hb["services"]["email"] = "configured" if email_cfg.exists() else "not configured"
    if not email_cfg.exists():
        hb["issues"].append("Email configuration missing")
    print(f"  Email: {'configured' if email_cfg.exists() else 'NOT CONFIGURED'}")

    # Stats
    hb["stats"] = {
        "total_runs": state.get("total_runs", 0),
        "total_queries": state.get("total_queries", 0),
        "total_signals": state.get("total_signals_processed", 0),
        "total_emails": state.get("total_emails_sent", 0),
        "total_cost": state.get("total_cost_usd", 0),
        "last_run": state.get("last_run"),
    }

    print(f"\n  Total runs: {hb['stats']['total_runs']}")
    print(f"  Total queries: {hb['stats']['total_queries']}")
    print(f"  Total cost: ${hb['stats']['total_cost']:.2f}")
    print(f"  Last run: {hb['stats']['last_run'] or 'never'}")

    if hb["issues"]:
        print(f"\n  Issues: {', '.join(hb['issues'])}")
    else:
        print(f"\n  Status: HEALTHY")

    # Save heartbeat log
    HEARTBEAT_LOG_DIR.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    log_file = HEARTBEAT_LOG_DIR / f"heartbeat_{date_str}.json"
    with open(log_file, "w") as f:
        json.dump(hb, f, indent=2, default=str)

    # Update state
    state["last_heartbeat"] = hb["timestamp"]
    _save_state(state)

    print("=" * 60)
    return hb


def status():
    """Show current squadron status."""
    state = _load_state()
    memory = _load_memory()

    print("\n  Sephirot Agent OC — Status")
    print(f"  Status: {state.get('status', 'unknown')}")
    print(f"  Last run: {state.get('last_run', 'never')}")
    print(f"  Last heartbeat: {state.get('last_heartbeat', 'never')}")
    print(f"  Total runs: {state.get('total_runs', 0)}")
    print(f"  Total queries: {state.get('total_queries', 0)}")
    print(f"  Total signals: {state.get('total_signals_processed', 0)}")
    print(f"  Total emails: {state.get('total_emails_sent', 0)}")
    print(f"  Total cost: ${state.get('total_cost_usd', 0):.2f}")
    print(f"  Memory entries: {memory['metadata'].get('entry_count', 0)}")
    return state

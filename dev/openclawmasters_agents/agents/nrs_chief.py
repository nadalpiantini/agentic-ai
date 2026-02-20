"""
NRS Chief Agent — Squadron Orchestrator for NRS v2
Manages the full scan → rank → enrich → outreach pipeline.
Provides daily heartbeat and status reporting.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path


SQUADRON_DIR = Path.home() / ".openclaw" / "squadrons" / "nrs-v2"
STATE_FILE = SQUADRON_DIR / "data" / "state.json"
HEARTBEAT_LOG_DIR = SQUADRON_DIR / "logs"
TARGETS_FILE = SQUADRON_DIR / "config" / "targets.json"
QUEUE_DIR = Path("content/queue/nrs")
APPROVED_DIR = Path("content/approved/nrs")
SENT_DIR = Path("content/sent/nrs")


def _load_state():
    """Load current squadron state."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        "last_run": None,
        "last_heartbeat": None,
        "total_scans": 0,
        "total_findings": 0,
        "total_outreach_queued": 0,
        "total_outreach_sent": 0,
        "status": "initialized",
    }


def _save_state(state):
    """Persist squadron state."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2, default=str)


def _load_targets():
    """Load target companies from config (supports flat and pool formats)."""
    if TARGETS_FILE.exists():
        with open(TARGETS_FILE) as f:
            data = json.load(f)
            # Pool-based format
            if "pools" in data:
                all_targets = []
                for pool in sorted(data["pools"], key=lambda p: p.get("priority", 99)):
                    all_targets.extend(pool.get("targets", []))
                return all_targets
            # Legacy flat format
            return data.get("targets", [])
    return []


def _load_targets_config():
    """Load full targets config including settings and pools."""
    if TARGETS_FILE.exists():
        with open(TARGETS_FILE) as f:
            return json.load(f)
    return {"settings": {}, "pools": []}


def _check_llm():
    """Verify LLM availability."""
    try:
        from agents.llm import generate
        result = generate("Say OK", max_tokens=5, temperature=0)
        return result is not None
    except Exception:
        return False


def _check_email_config():
    """Verify email configuration exists."""
    config_path = Path.home() / ".openclaw" / "config" / "email_global.json"
    return config_path.exists()


def _count_queue():
    """Count pending outreach in queue."""
    if QUEUE_DIR.exists():
        return len(list(QUEUE_DIR.glob("*.json")))
    return 0


def _count_approved():
    """Count approved outreach ready to send."""
    if APPROVED_DIR.exists():
        return len(list(APPROVED_DIR.glob("*.json")))
    return 0


def _count_sent():
    """Count sent outreach."""
    if SENT_DIR.exists():
        return len(list(SENT_DIR.glob("*.json")))
    return 0


def heartbeat():
    """
    Daily heartbeat check.
    Returns status of all sub-agents and pending/sent outreach stats.
    """
    print("\n" + "=" * 60)
    print("  NRS v2 — Daily Heartbeat")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)

    state = _load_state()
    hb = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "healthy",
        "agents": {},
        "stats": {},
        "issues": [],
    }

    # Check agent availability
    agents = ["nrs_scanner", "nrs_ranker", "nrs_enricher", "nrs_outreach"]
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

    # Check LLM
    llm_ok = _check_llm()
    hb["agents"]["llm"] = "available" if llm_ok else "unavailable"
    if not llm_ok:
        hb["issues"].append("LLM provider unavailable")
        hb["status"] = "degraded"
    print(f"  LLM: {'available' if llm_ok else 'UNAVAILABLE'}")

    # Check email config
    email_ok = _check_email_config()
    hb["agents"]["email"] = "configured" if email_ok else "not configured"
    if not email_ok:
        hb["issues"].append("Email configuration missing")
    print(f"  Email: {'configured' if email_ok else 'NOT CONFIGURED'}")

    # Stats
    targets = _load_targets()
    config = _load_targets_config()
    pools = config.get("pools", [])
    pool_summary = {p["id"]: len(p.get("targets", [])) for p in pools}

    hb["stats"] = {
        "targets_total": len(targets),
        "pools": pool_summary,
        "queue_pending": _count_queue(),
        "approved_ready": _count_approved(),
        "sent_total": _count_sent(),
        "total_scans": state.get("total_scans", 0),
        "total_findings": state.get("total_findings", 0),
        "last_run": state.get("last_run"),
    }

    print(f"\n  Targets: {hb['stats']['targets_total']} across {len(pools)} pools")
    for pool_id, count in pool_summary.items():
        print(f"    {pool_id}: {count} targets")
    print(f"  Queue: {hb['stats']['queue_pending']} pending")
    print(f"  Approved: {hb['stats']['approved_ready']} ready")
    print(f"  Sent: {hb['stats']['sent_total']} total")
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
    state["status"] = hb["status"]
    _save_state(state)

    print("=" * 60)
    return hb


def run_pipeline(targets=None):
    """
    Execute the full NRS pipeline: scan → rank → enrich → outreach → queue.

    Args:
        targets: Optional explicit targets list. If None, loads from config.

    Returns:
        Pipeline run log dict.
    """
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))

    from agents.nrs_scanner import run as scan
    from agents.nrs_ranker import run as rank
    from agents.nrs_enricher import run as enrich
    from agents.nrs_outreach import run as outreach

    state = _load_state()

    run_log = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "status": "running",
        "targets_scanned": 0,
        "findings_total": 0,
        "findings_ranked": 0,
        "findings_enriched": 0,
        "outreach_queued": 0,
        "errors": [],
    }

    print("\n" + "=" * 60)
    print("  NRS v2 — Full Pipeline Execution")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)

    # Load targets
    if targets is None:
        targets = _load_targets()
    if not targets:
        print("  No targets configured. Add targets to targets.json")
        run_log["status"] = "no_targets"
        return run_log

    run_log["targets_scanned"] = len(targets)

    # Stage 1: Scan
    print(f"\n[1/4] Scanning {len(targets)} targets...")
    try:
        findings = scan(targets)
        run_log["findings_total"] = len(findings)
    except Exception as e:
        print(f"  FATAL: Scanner failed: {e}")
        run_log["status"] = "failed"
        run_log["errors"].append(f"scanner: {e}")
        return run_log

    if not findings:
        print("  No findings detected. Pipeline complete.")
        run_log["status"] = "complete_clean"
        return run_log

    # Stage 2: Rank
    print(f"\n[2/4] Ranking {len(findings)} findings...")
    try:
        ranked = rank(findings)
        run_log["findings_ranked"] = len(ranked)
    except Exception as e:
        print(f"  FATAL: Ranker failed: {e}")
        run_log["status"] = "failed"
        run_log["errors"].append(f"ranker: {e}")
        return run_log

    if not ranked:
        print("  No findings passed risk threshold. Pipeline complete.")
        run_log["status"] = "complete_filtered"
        return run_log

    # Stage 3: Enrich
    print(f"\n[3/4] Enriching {len(ranked)} findings...")
    try:
        enriched = enrich(ranked)
        run_log["findings_enriched"] = len(enriched)
    except Exception as e:
        print(f"  WARNING: Enricher failed: {e}")
        enriched = ranked  # Continue with unenriched data
        run_log["errors"].append(f"enricher: {e}")

    # Stage 4: Outreach
    print(f"\n[4/4] Composing outreach for {len(enriched)} findings...")
    try:
        outreach_results = outreach(enriched)
        run_log["outreach_queued"] = len(outreach_results)
    except Exception as e:
        print(f"  WARNING: Outreach composer failed: {e}")
        run_log["errors"].append(f"outreach: {e}")

    # Finalize
    run_log["status"] = "complete"
    run_log["finished_at"] = datetime.now(timezone.utc).isoformat()

    # Update state
    state["last_run"] = run_log["started_at"]
    state["total_scans"] = state.get("total_scans", 0) + run_log["targets_scanned"]
    state["total_findings"] = state.get("total_findings", 0) + run_log["findings_total"]
    state["total_outreach_queued"] = state.get("total_outreach_queued", 0) + run_log["outreach_queued"]
    state["status"] = "active"
    _save_state(state)

    # Summary
    print("\n" + "=" * 60)
    print("  Pipeline Complete")
    print(f"  Scanned: {run_log['targets_scanned']} | Found: {run_log['findings_total']} | "
          f"Ranked: {run_log['findings_ranked']} | Enriched: {run_log['findings_enriched']} | "
          f"Queued: {run_log['outreach_queued']}")
    if run_log["errors"]:
        print(f"  Errors: {len(run_log['errors'])}")
    print("=" * 60)

    return run_log


def status():
    """Show current squadron status."""
    state = _load_state()
    print("\n  NRS v2 Squadron Status")
    print(f"  Status: {state.get('status', 'unknown')}")
    print(f"  Last run: {state.get('last_run', 'never')}")
    print(f"  Last heartbeat: {state.get('last_heartbeat', 'never')}")
    print(f"  Total scans: {state.get('total_scans', 0)}")
    print(f"  Total findings: {state.get('total_findings', 0)}")
    print(f"  Queue: {_count_queue()} pending | {_count_approved()} approved | {_count_sent()} sent")
    return state


def run(mode="pipeline"):
    """
    Main entry point.

    Args:
        mode: "pipeline" | "heartbeat" | "status"
    """
    if mode == "heartbeat":
        return heartbeat()
    elif mode == "status":
        return status()
    else:
        return run_pipeline()

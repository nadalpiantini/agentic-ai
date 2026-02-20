"""
NRS v2 Sprint Runner
Ejecuta sprints NRS con rotacion inteligente de targets.
5 sprints/dia, 3 targets/sprint, max 2 scans por target al mes.
"""

import sys
import json
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.nrs_chief import run_pipeline, heartbeat, status, _load_targets_config


LOG_DIR = Path.home() / ".openclaw" / "squadrons" / "nrs-v2" / "logs"
MEMORY_FILE = Path("memory/nrs_store.json")


def setup():
    """Ensure directories exist."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    MEMORY_FILE.parent.mkdir(parents=True, exist_ok=True)


def log_run(run_data):
    """Log pipeline run to file."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    log_file = LOG_DIR / f"sprint_{timestamp}.json"

    with open(log_file, "w") as f:
        json.dump(run_data, f, indent=2, default=str)

    return str(log_file)


# --- Memory Management ---

def _load_memory():
    """Load sprint rotation memory."""
    if MEMORY_FILE.exists():
        with open(MEMORY_FILE) as f:
            return json.load(f)
    return {
        "current_month": None,
        "domains": {},
        "stats": {"total_runs": 0, "total_findings": 0, "total_sprints": 0},
    }


def _save_memory(memory):
    """Persist sprint rotation memory."""
    with open(MEMORY_FILE, "w") as f:
        json.dump(memory, f, indent=2, default=str)


def _reset_monthly_if_needed(memory):
    """Reset monthly counts when a new month starts."""
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    if memory.get("current_month") != current_month:
        print(f"  New month ({current_month}) — resetting monthly scan counts")
        for domain_data in memory.get("domains", {}).values():
            domain_data["monthly_count"] = 0
        memory["current_month"] = current_month
        _save_memory(memory)
    return memory


# --- Sprint Target Selection ---

def _select_sprint_targets():
    """
    Pick next batch of targets using round-robin across prioritized pools.

    Logic:
    1. Load all targets from all pools (sorted by pool priority)
    2. Filter out targets that hit monthly scan cap (2x default)
    3. Sort remaining: pool priority ASC, then oldest-scanned first
    4. Pick top `batch_size` targets

    Returns list of target dicts.
    """
    memory = _load_memory()
    memory = _reset_monthly_if_needed(memory)

    config = _load_targets_config()
    settings = config.get("settings", {})
    max_monthly = settings.get("max_scans_per_target_monthly", 2)
    batch_size = settings.get("batch_size", 3)

    # Flatten all pools sorted by priority
    all_targets = []
    for pool in sorted(config.get("pools", []), key=lambda p: p.get("priority", 99)):
        pool_id = pool.get("id", "unknown")
        for target in pool.get("targets", []):
            target["_pool"] = pool_id
            target["_pool_priority"] = pool.get("priority", 99)
            all_targets.append(target)

    if not all_targets:
        return []

    # Filter: exclude targets at monthly cap
    available = []
    capped = 0
    for t in all_targets:
        domain = t["domain"]
        domain_data = memory.get("domains", {}).get(domain, {})
        monthly_count = domain_data.get("monthly_count", 0)
        if monthly_count < max_monthly:
            t["_last_scanned"] = domain_data.get("last_scanned", "1970-01-01T00:00:00")
            t["_monthly_count"] = monthly_count
            available.append(t)
        else:
            capped += 1

    if capped:
        print(f"  {capped} targets at monthly cap ({max_monthly}x)")

    if not available:
        return []

    # Sort: pool priority ASC, then oldest-scanned first (round-robin effect)
    available.sort(key=lambda t: (t["_pool_priority"], t["_last_scanned"]))

    # Pick batch
    selected = available[:batch_size]

    # Clean internal fields before returning
    for t in selected:
        t.pop("_pool", None)
        t.pop("_pool_priority", None)
        t.pop("_last_scanned", None)
        t.pop("_monthly_count", None)

    return selected


def _record_sprint(targets, findings_count):
    """Record sprint results in memory."""
    memory = _load_memory()
    now = datetime.now(timezone.utc).isoformat()

    for t in targets:
        domain = t["domain"]
        if domain not in memory["domains"]:
            memory["domains"][domain] = {
                "monthly_count": 0,
                "total_scans": 0,
                "last_scanned": None,
                "last_findings": 0,
            }
        memory["domains"][domain]["monthly_count"] += 1
        memory["domains"][domain]["total_scans"] += 1
        memory["domains"][domain]["last_scanned"] = now

    memory["stats"]["total_sprints"] = memory["stats"].get("total_sprints", 0) + 1
    memory["stats"]["total_findings"] = (
        memory["stats"].get("total_findings", 0) + findings_count
    )
    memory["stats"]["total_runs"] = memory["stats"].get("total_runs", 0) + 1
    _save_memory(memory)


# --- Sprint Execution ---

def execute():
    """Execute a single NRS sprint (3 targets from pool rotation)."""
    setup()

    print("\n" + "-" * 50)
    print(f"  NRS v2 Sprint — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("-" * 50)

    # Select targets for this sprint
    targets = _select_sprint_targets()

    if not targets:
        print("  All targets at monthly cap. Add more targets or wait for next month.")
        return {"status": "all_capped"}

    domains = [t["domain"] for t in targets]
    print(f"  Sprint batch: {', '.join(domains)}")

    # Run pipeline with selected targets
    run_log = run_pipeline(targets=targets)

    # Record results in memory
    _record_sprint(targets, run_log.get("findings_total", 0))

    # Save run log
    log_path = log_run(run_log)
    print(f"  Log: {log_path}")

    return run_log


def _show_memory():
    """Display sprint rotation memory stats."""
    memory = _load_memory()
    config = _load_targets_config()
    settings = config.get("settings", {})
    max_monthly = settings.get("max_scans_per_target_monthly", 2)

    print("\n  NRS v2 Sprint Memory")
    print(f"  Month: {memory.get('current_month', 'none')}")
    print(f"  Total sprints: {memory['stats'].get('total_sprints', 0)}")
    print(f"  Total findings: {memory['stats'].get('total_findings', 0)}")
    print(f"  Domains tracked: {len(memory.get('domains', {}))}")

    # Pool stats
    pools = config.get("pools", [])
    total_targets = sum(len(p.get("targets", [])) for p in pools)
    domains = memory.get("domains", {})
    at_cap = sum(1 for d in domains.values() if d.get("monthly_count", 0) >= max_monthly)
    available = total_targets - at_cap

    print(f"\n  Pool capacity: {total_targets} total | {at_cap} capped | {available} available")

    # Per-pool breakdown
    for pool in sorted(pools, key=lambda p: p.get("priority", 99)):
        pool_id = pool["id"]
        pool_domains = {t["domain"] for t in pool.get("targets", [])}
        pool_capped = sum(
            1 for d in pool_domains
            if domains.get(d, {}).get("monthly_count", 0) >= max_monthly
        )
        pool_scanned = sum(1 for d in pool_domains if d in domains)
        print(f"    [{pool_id}] {len(pool_domains)} targets | "
              f"{pool_scanned} scanned | {pool_capped} capped")

    # Recent scans
    if domains:
        print(f"\n  Recent scans:")
        recent = sorted(domains.items(), key=lambda x: x[1].get("last_scanned", ""), reverse=True)
        for domain, data in recent[:10]:
            last = data.get("last_scanned", "never")
            if last and last != "never":
                last = last[:16].replace("T", " ")
            print(f"    {domain}: {data.get('monthly_count', 0)}/{max_monthly} this month | "
                  f"total: {data.get('total_scans', 0)} | last: {last}")


# --- Main ---

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

    if "--memory" in sys.argv:
        _show_memory()
        return

    # Default: run one sprint
    if "--loop" not in sys.argv:
        execute()
        return

    # Loop mode: run every N hours
    interval_hours = 4
    for arg in sys.argv:
        if arg.startswith("--interval="):
            interval_hours = int(arg.split("=")[1])

    print(f"  Loop mode: sprinting every {interval_hours} hours")
    print("  Press Ctrl+C to stop\n")

    while True:
        try:
            execute()
            print(f"\n  Next sprint in {interval_hours} hours...")
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

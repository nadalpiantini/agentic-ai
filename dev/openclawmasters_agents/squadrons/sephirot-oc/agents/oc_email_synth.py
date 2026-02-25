"""
OC Email Synthesis Agent — Daily brief composer for Sephirot Agent OC.
Composes and sends the daily intelligence brief via SMTP.
Adapts the email pattern from nrs_outreach.py.
"""

import json
import smtplib
import sys
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path


# --- Config ---

EMAIL_CONFIG_PATH = Path.home() / ".openclaw" / "config" / "email_global.json"
BRIEFS_DIR = Path(__file__).parent.parent / "briefs"

# Add project root for llm import (absolute path for reliability)
_PROJECT_ROOT = Path("/Users/anp/dev/openclawmasters_agents")
sys.path.insert(0, str(_PROJECT_ROOT))


def _load_email_config():
    """Load SMTP config from global OpenClaw config."""
    if EMAIL_CONFIG_PATH.exists():
        with open(EMAIL_CONFIG_PATH) as f:
            return json.load(f)
    return None


def _get_llm_synthesis(top_signals, anomalies):
    """Generate executive summary via LLM."""
    try:
        from agents.llm import generate

        # Build context from top signals
        signal_lines = []
        for i, s in enumerate(top_signals[:10], 1):
            signal_lines.append(
                f"{i}. [{s.get('country', '??')}|{s.get('industry', '??')}] "
                f"{s.get('title', 'Unknown')} (Opp:{s.get('opportunity_score', 0)})"
            )

        anomaly_lines = []
        for a in anomalies[:5]:
            anomaly_lines.append(f"- {a.get('country', '??')} {a.get('industry', '??')}: {a.get('description', 'unknown anomaly')}")

        prompt = f"""You are an economic intelligence analyst. Write a 2-3 sentence executive summary of today's most important global signals.

TOP SIGNALS:
{chr(10).join(signal_lines) if signal_lines else 'No significant signals today.'}

ANOMALIES:
{chr(10).join(anomaly_lines) if anomaly_lines else 'No anomalies detected.'}

Write a concise, professional summary focusing on the most actionable insights. No fluff, no hedging. State facts and implications directly."""

        result = generate(prompt, max_tokens=200, temperature=0.3, prefer="zai")
        return result or "Executive summary unavailable — LLM service unreachable."

    except ImportError:
        return "Executive summary unavailable — LLM module not found."
    except Exception as e:
        return f"Executive summary unavailable — {e}"


# --- Email Composition ---

def _format_signal(signal, index):
    """Format a single signal for the email."""
    opp = signal.get("opportunity_score", 0)
    conf = signal.get("confidence_score", 0)
    title = signal.get("title", "Unknown")
    country = signal.get("country_name", signal.get("country", "??"))
    industry = signal.get("industry_name", signal.get("industry", "??"))
    snippet = signal.get("snippet", "")[:150]
    url = signal.get("url", "")

    analysis = signal.get("analysis", snippet)
    if len(analysis) > 200:
        analysis = analysis[:197] + "..."

    return (
        f"{index}. [Opp:{opp} | Conf:{conf}] {title}\n"
        f"   {country}, {industry}\n"
        f"   {analysis}\n"
        f"   Source: {url}\n"
    )


def _format_anomaly(anomaly, index):
    """Format an anomaly for the email."""
    score = anomaly.get("anomaly_score", 0)
    country = anomaly.get("country_name", anomaly.get("country", "??"))
    industry = anomaly.get("industry_name", anomaly.get("industry", "??"))
    desc = anomaly.get("description", "Unknown anomaly")
    why = anomaly.get("why_it_matters", "")

    return (
        f"{index}. [Anomaly:{score:.2f}] {country} {industry}\n"
        f"   {desc}\n"
        f"   {why}\n"
    )


def _compose_brief(ranked_data, scan_stats, anomalies=None):
    """Compose the full daily brief text."""
    top_signals = ranked_data.get("top", [])
    watchlist = ranked_data.get("watchlist", [])
    anomalies = anomalies or []

    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    date_long = datetime.now(timezone.utc).strftime("%B %d, %Y")

    countries_scanned = scan_stats.get("countries_scanned", [])
    queries_executed = scan_stats.get("queries_executed", 0)
    cost = scan_stats.get("cost_estimate", 0)
    engine = scan_stats.get("engine", "unknown")

    n_signals = len(top_signals)
    n_anomalies = len(anomalies)

    # Executive summary via LLM
    exec_summary = _get_llm_synthesis(top_signals, anomalies)

    # Build email body
    lines = [
        "━" * 50,
        "SEPHIROT AGENT OC — Daily Intelligence Brief",
        f"{date_long} | {len(countries_scanned)} countries | {queries_executed} queries | ${cost:.2f}",
        "━" * 50,
        "",
        "EXECUTIVE SUMMARY",
        exec_summary,
        "",
    ]

    # TOP OPPORTUNITIES
    lines.append("━━ TOP OPPORTUNITIES ━━")
    if top_signals:
        for i, s in enumerate(top_signals[:10], 1):
            lines.append(_format_signal(s, i))
    else:
        lines.append("  No signals met the top opportunity threshold today.")
    lines.append("")

    # ANOMALIES
    if anomalies:
        lines.append("━━ ANOMALIES DETECTED ━━")
        for i, a in enumerate(anomalies[:10], 1):
            lines.append(_format_anomaly(a, i))
        lines.append("")

    # WATCHLIST
    if watchlist:
        lines.append("━━ WATCHLIST (Lower confidence, worth monitoring) ━━")
        for i, s in enumerate(watchlist[:10], 1):
            conf = s.get("confidence_score", 0)
            title = s.get("title", "Unknown")
            url = s.get("url", "")
            lines.append(f"{i}. [Conf:{conf}] {title}")
            lines.append(f"   {url}")
        lines.append("")

    # FOOTER
    lines.extend([
        "━" * 50,
        f"Countries: {', '.join(countries_scanned)}",
        f"Engine: {engine} | Queries: {queries_executed} | Cost: ${cost:.2f}",
        f"Generated by Sephirot Agent OC | OpenClaw Intelligence Division",
        "━" * 50,
    ])

    return "\n".join(lines)


def _send_email(subject, body, config):
    """Send email via SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = config["from_email"]
    msg["To"] = ", ".join(config["to_emails"])

    # Plain text version
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        server = smtplib.SMTP(config["smtp_host"], config["smtp_port"])
        if config.get("use_tls", True):
            server.starttls()
        server.login(config["smtp_user"], config["smtp_password"])
        server.sendmail(config["from_email"], config["to_emails"], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[oc_email_synth] SMTP error: {e}")
        return False


def _archive_brief(date_str, brief_text, ranked_data, scan_stats):
    """Save brief to briefs/ directory."""
    BRIEFS_DIR.mkdir(parents=True, exist_ok=True)

    # Save text brief
    text_file = BRIEFS_DIR / f"brief_{date_str}.txt"
    with open(text_file, "w") as f:
        f.write(brief_text)

    # Save structured JSON
    json_file = BRIEFS_DIR / f"brief_{date_str}.json"
    archive = {
        "date": date_str,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scan_stats": scan_stats,
        "top_count": len(ranked_data.get("top", [])),
        "watchlist_count": len(ranked_data.get("watchlist", [])),
        "excluded_count": ranked_data.get("excluded", 0),
        "top_signals": ranked_data.get("top", []),
        "watchlist_signals": ranked_data.get("watchlist", []),
    }
    with open(json_file, "w") as f:
        json.dump(archive, f, indent=2, default=str)

    return str(text_file), str(json_file)


# --- Main ---

def run(ranked_data, scan_stats, anomalies=None):
    """
    Compose, send, and archive the daily intelligence brief.

    Args:
        ranked_data: dict with 'top', 'watchlist', 'excluded' from oc_ranker
        scan_stats: dict with scan metadata from oc_scanner
        anomalies: optional list of anomaly dicts

    Returns:
        dict with email status and archive paths
    """
    anomalies = anomalies or []
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    date_display = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    n_signals = len(ranked_data.get("top", []))
    n_anomalies = len(anomalies)

    print(f"[oc_email_synth] Composing brief: {n_signals} signals, {n_anomalies} anomalies")

    # Compose the brief
    brief_text = _compose_brief(ranked_data, scan_stats, anomalies)

    # Archive
    text_path, json_path = _archive_brief(date_str, brief_text, ranked_data, scan_stats)
    print(f"[oc_email_synth] Archived: {text_path}")

    # Send email
    config = _load_email_config()
    email_sent = False

    if config:
        subject = (
            f"[Sephirot OC] Intelligence Brief — {date_display} "
            f"({n_signals} signals, {n_anomalies} anomalies)"
        )
        email_sent = _send_email(subject, brief_text, config)
        if email_sent:
            print(f"[oc_email_synth] Email sent to {', '.join(config['to_emails'])}")
        else:
            print("[oc_email_synth] Email send FAILED — brief archived to disk")
    else:
        print("[oc_email_synth] No email config found — brief archived only")

    return {
        "email_sent": email_sent,
        "brief_archived": True,
        "text_path": text_path,
        "json_path": json_path,
        "signals_included": n_signals,
        "anomalies_included": n_anomalies,
    }

"""
OC Scanner Agent — Tavily Search Executor for Sephirot Agent OC.
Executes search queries per country x industry and returns raw signals.
Primary: Tavily SDK. Fallback: Google News RSS (stdlib).
"""

import json
import os
import time
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote_plus


# --- Config ---

CONFIG_DIR = Path(__file__).parent.parent / "config"
REGISTRY_FILE = CONFIG_DIR / "source_registry.json"


def _load_registry():
    """Load source registry config."""
    if REGISTRY_FILE.exists():
        with open(REGISTRY_FILE) as f:
            return json.load(f)
    return {"settings": {}, "industries": [], "rotation": {}, "country_names": {}}


def _get_tavily_client():
    """Get Tavily client if available."""
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return None
    try:
        from tavily import TavilyClient
        return TavilyClient(api_key=api_key)
    except ImportError:
        print("[oc_scanner] tavily-python not installed. Using fallback.")
        return None


# --- Tavily Search ---

def _search_tavily(client, query, max_results=5, search_depth="basic"):
    """Execute a single Tavily search query."""
    try:
        response = client.search(
            query=query,
            max_results=max_results,
            search_depth=search_depth,
            include_answer=False,
            include_raw_content=False,
        )
        results = []
        for r in response.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": r.get("content", "")[:500],
                "published_date": r.get("published_date", ""),
                "score": r.get("score", 0),
                "source_engine": "tavily",
            })
        return results
    except Exception as e:
        print(f"[oc_scanner] Tavily error: {e}")
        return []


# --- Google News RSS Fallback ---

def _search_google_news_rss(query, max_results=5):
    """Fallback: search via Google News RSS feed (no API key needed)."""
    encoded_query = quote_plus(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en&gl=US&ceid=US:en"

    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; SephirotOC/0.1)"
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_data = resp.read().decode("utf-8")

        root = ET.fromstring(xml_data)
        results = []
        for item in root.findall(".//item")[:max_results]:
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pub_date = item.findtext("pubDate", "")
            description = item.findtext("description", "")

            results.append({
                "title": title,
                "url": link,
                "snippet": description[:500] if description else "",
                "published_date": pub_date,
                "score": 0,
                "source_engine": "google_news_rss",
            })
        return results

    except (urllib.error.URLError, ET.ParseError, Exception) as e:
        print(f"[oc_scanner] Google News RSS error for '{query[:50]}': {e}")
        return []


# --- Main Scanner ---

def _build_queries(countries, registry):
    """Build list of (query_string, metadata) tuples for given countries."""
    industries = registry.get("industries", [])
    country_names = registry.get("country_names", {})
    settings = registry.get("settings", {})

    # For v0.1 MVP: use all available industries
    queries = []
    for country_code in countries:
        country_name = country_names.get(country_code, country_code)
        for industry in industries:
            industry_id = industry["id"]
            industry_name = industry["name"]

            # Mainstream queries
            for template in industry.get("mainstream_queries", []):
                q = template.replace("{country}", country_name)
                queries.append({
                    "query": q,
                    "country": country_code,
                    "country_name": country_name,
                    "industry": industry_id,
                    "industry_name": industry_name,
                    "channel_type": "mainstream",
                })

            # Niche queries
            for template in industry.get("niche_queries", []):
                q = template.replace("{country}", country_name)
                queries.append({
                    "query": q,
                    "country": country_code,
                    "country_name": country_name,
                    "industry": industry_id,
                    "industry_name": industry_name,
                    "channel_type": "niche",
                })

    return queries


def run(countries, budget_remaining=None):
    """
    Execute search queries for given countries across all industries.

    Args:
        countries: List of country codes to scan (e.g., ["US", "CN"])
        budget_remaining: Optional max queries to execute

    Returns:
        dict with:
          - signals: List of signal dicts
          - queries_executed: Number of API calls made
          - cost_estimate: Estimated cost in USD
    """
    registry = _load_registry()
    settings = registry.get("settings", {})
    delay = settings.get("query_delay_seconds", 0.5)
    max_results = settings.get("tavily_max_results", 5)
    search_depth = settings.get("tavily_search_depth", "basic")
    max_queries = settings.get("max_queries_per_day", 200)

    if budget_remaining is not None:
        max_queries = min(max_queries, budget_remaining)

    # Build query list
    all_queries = _build_queries(countries, registry)

    # Respect budget
    if len(all_queries) > max_queries:
        print(f"[oc_scanner] Trimming {len(all_queries)} queries to budget limit {max_queries}")
        all_queries = all_queries[:max_queries]

    print(f"[oc_scanner] Executing {len(all_queries)} queries across "
          f"{len(countries)} countries...")

    # Get search client
    tavily = _get_tavily_client()
    use_tavily = tavily is not None
    if use_tavily:
        print(f"[oc_scanner] Using Tavily API (depth={search_depth})")
    else:
        print("[oc_scanner] Tavily unavailable — using Google News RSS fallback")

    signals = []
    queries_executed = 0

    for i, q_meta in enumerate(all_queries):
        query_str = q_meta["query"]

        # Execute search
        if use_tavily:
            results = _search_tavily(tavily, query_str, max_results, search_depth)
        else:
            results = _search_google_news_rss(query_str, max_results)

        queries_executed += 1

        # Enrich results with metadata
        for r in results:
            signal = {
                **r,
                "country": q_meta["country"],
                "country_name": q_meta["country_name"],
                "industry": q_meta["industry"],
                "industry_name": q_meta["industry_name"],
                "channel_type": q_meta["channel_type"],
                "query_used": query_str,
                "scanned_at": datetime.now(timezone.utc).isoformat(),
            }
            signals.append(signal)

        # Rate limiting
        if delay > 0 and i < len(all_queries) - 1:
            time.sleep(delay)

        # Progress report every 20 queries
        if (i + 1) % 20 == 0:
            print(f"  [{i+1}/{len(all_queries)}] {len(signals)} signals collected")

    # Cost estimate (Tavily: ~$0.01/query for basic)
    cost_per_query = 0.01 if use_tavily else 0.0
    cost_estimate = queries_executed * cost_per_query

    print(f"[oc_scanner] Complete: {len(signals)} signals from "
          f"{queries_executed} queries (est. ${cost_estimate:.2f})")

    return {
        "signals": signals,
        "queries_executed": queries_executed,
        "cost_estimate": cost_estimate,
        "engine": "tavily" if use_tavily else "google_news_rss",
    }


if __name__ == "__main__":
    # Quick test: scan US only
    result = run(["US"])
    print(f"\nTest results: {len(result['signals'])} signals")
    for s in result["signals"][:5]:
        print(f"  [{s['country']}|{s['industry']}] {s['title'][:80]}")

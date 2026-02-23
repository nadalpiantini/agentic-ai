"""
OC Signal Filter Agent — Noise removal for Sephirot Agent OC.
Removes duplicates, clickbait, propaganda, stale signals.
Adapts the Jaccard dedup pattern from memory/vector_store.py.
"""

import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlparse


# --- Config ---

MEMORY_DIR = Path(__file__).parent.parent / "memory"
STORE_FILE = MEMORY_DIR / "oc_store.json"

# Max signal age in hours
MAX_AGE_HOURS = 72

# Jaccard similarity threshold for title dedup
SIMILARITY_THRESHOLD = 0.4

# Clickbait patterns (lowercase matching)
CLICKBAIT_PATTERNS = [
    "you won't believe",
    "shocking",
    "mind-blowing",
    "insane",
    "jaw-dropping",
    "this changes everything",
    "one weird trick",
    "what happened next",
    "number \\d+ will shock",
    "experts are stunned",
    "click here",
    "subscribe now",
    "limited time",
]

# Opinion/propaganda domain blocklist
BLOCKLIST_DOMAINS = [
    "rt.com",
    "sputniknews.com",
    "infowars.com",
    "naturalnews.com",
    "breitbart.com",
    "zerohedge.com",
]

# High-authority domains (wire services — keep only the first one per story)
WIRE_SERVICES = [
    "reuters.com",
    "apnews.com",
    "bloomberg.com",
    "afp.com",
]


# --- Dedup helpers (from vector_store.py pattern) ---

def _tokenize(text):
    """Tokenize text into lowercase word set."""
    return set(re.findall(r'\w+', text.lower()))


def _jaccard_similarity(set_a, set_b):
    """Compute Jaccard similarity between two sets."""
    if not set_a or not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union) if union else 0.0


def _canonicalize_url(url):
    """Normalize URL for dedup (strip tracking params, www, trailing slash)."""
    parsed = urlparse(url)
    # Remove www prefix
    host = parsed.netloc.replace("www.", "")
    # Remove common tracking params
    path = parsed.path.rstrip("/")
    return f"{host}{path}".lower()


# --- Memory store ---

def _load_store():
    """Load historical signal memory."""
    if STORE_FILE.exists():
        with open(STORE_FILE) as f:
            return json.load(f)
    return {"entries": [], "metadata": {"created": None, "updated": None, "entry_count": 0}}


def _get_known_urls(store):
    """Get set of canonical URLs from memory store."""
    return {_canonicalize_url(e.get("url", "")) for e in store.get("entries", []) if e.get("url")}


# --- Filters ---

def _is_clickbait(title, snippet=""):
    """Check if title/snippet contains clickbait patterns."""
    text = f"{title} {snippet}".lower()
    for pattern in CLICKBAIT_PATTERNS:
        if re.search(pattern, text):
            return True
    return False


def _is_blocklisted(url):
    """Check if URL domain is on blocklist."""
    try:
        host = urlparse(url).netloc.replace("www.", "").lower()
        return any(blocked in host for blocked in BLOCKLIST_DOMAINS)
    except Exception:
        return False


def _is_stale(signal):
    """Check if signal is older than MAX_AGE_HOURS."""
    pub_date = signal.get("published_date", "")
    if not pub_date:
        return False  # Unknown date — don't filter (might be fresh)
    try:
        # Try ISO format
        if "T" in pub_date:
            dt = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
        else:
            # Try common date formats
            for fmt in ["%Y-%m-%d", "%a, %d %b %Y %H:%M:%S %Z", "%a, %d %b %Y %H:%M:%S %z"]:
                try:
                    dt = datetime.strptime(pub_date, fmt)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    break
                except ValueError:
                    continue
            else:
                return False  # Can't parse — don't filter

        cutoff = datetime.now(timezone.utc) - timedelta(hours=MAX_AGE_HOURS)
        return dt < cutoff
    except Exception:
        return False


def _dedup_signals(signals):
    """Remove duplicate signals by URL and title similarity."""
    seen_urls = set()
    seen_titles = []
    unique = []

    for s in signals:
        # URL dedup
        canonical = _canonicalize_url(s.get("url", ""))
        if canonical in seen_urls:
            continue

        # Title similarity dedup
        title_tokens = _tokenize(s.get("title", ""))
        is_dupe = False
        for seen_tokens in seen_titles:
            if _jaccard_similarity(title_tokens, seen_tokens) >= SIMILARITY_THRESHOLD:
                is_dupe = True
                break

        if is_dupe:
            continue

        seen_urls.add(canonical)
        seen_titles.append(title_tokens)
        unique.append(s)

    return unique


def _dedup_against_history(signals, store):
    """Remove signals already seen in memory store."""
    known_urls = _get_known_urls(store)
    return [s for s in signals if _canonicalize_url(s.get("url", "")) not in known_urls]


# --- Main ---

def run(signals):
    """
    Filter signals: remove noise, duplicates, clickbait, stale items.

    Args:
        signals: List of raw signal dicts from oc_scanner

    Returns:
        List of filtered signal dicts
    """
    if not signals:
        print("[oc_signal_filter] No signals to filter")
        return []

    initial_count = len(signals)
    print(f"[oc_signal_filter] Filtering {initial_count} signals...")

    # Stage 1: Remove blocklisted domains
    filtered = [s for s in signals if not _is_blocklisted(s.get("url", ""))]
    blocklisted = initial_count - len(filtered)
    if blocklisted:
        print(f"  Blocklisted domains removed: {blocklisted}")

    # Stage 2: Remove clickbait
    pre = len(filtered)
    filtered = [s for s in filtered if not _is_clickbait(s.get("title", ""), s.get("snippet", ""))]
    clickbait = pre - len(filtered)
    if clickbait:
        print(f"  Clickbait removed: {clickbait}")

    # Stage 3: Remove stale signals
    pre = len(filtered)
    filtered = [s for s in filtered if not _is_stale(s)]
    stale = pre - len(filtered)
    if stale:
        print(f"  Stale signals removed (>{MAX_AGE_HOURS}h old): {stale}")

    # Stage 4: Remove empty/invalid signals
    pre = len(filtered)
    filtered = [s for s in filtered if s.get("title") and s.get("url")]
    invalid = pre - len(filtered)
    if invalid:
        print(f"  Invalid signals removed (no title/url): {invalid}")

    # Stage 5: Dedup within batch (URL + title similarity)
    pre = len(filtered)
    filtered = _dedup_signals(filtered)
    batch_dupes = pre - len(filtered)
    if batch_dupes:
        print(f"  Batch duplicates removed: {batch_dupes}")

    # Stage 6: Dedup against history
    store = _load_store()
    pre = len(filtered)
    filtered = _dedup_against_history(filtered, store)
    history_dupes = pre - len(filtered)
    if history_dupes:
        print(f"  History duplicates removed: {history_dupes}")

    total_removed = initial_count - len(filtered)
    print(f"[oc_signal_filter] Passed: {len(filtered)}/{initial_count} "
          f"(removed {total_removed})")

    return filtered


if __name__ == "__main__":
    # Test with sample data
    test_signals = [
        {"title": "US Fed raises interest rates", "url": "https://reuters.com/fed-rates", "snippet": "The Fed...", "published_date": "2026-02-23"},
        {"title": "US Fed raises interest rates again", "url": "https://apnews.com/fed-rates-again", "snippet": "AP reports...", "published_date": "2026-02-23"},
        {"title": "You won't believe what happened to Bitcoin", "url": "https://clickbait.com/btc", "snippet": "Shocking...", "published_date": "2026-02-23"},
        {"title": "Russia propaganda piece", "url": "https://rt.com/news/article", "snippet": "...", "published_date": "2026-02-23"},
        {"title": "", "url": "", "snippet": "", "published_date": ""},
    ]
    results = run(test_signals)
    print(f"\nFiltered: {len(results)} signals")
    for r in results:
        print(f"  {r['title'][:70]}")

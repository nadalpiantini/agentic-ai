"""
OC Ranker Agent — Opportunity + Confidence Scoring for Sephirot Agent OC.
Adapts the weighted scoring pattern from signal_ranker.py.
"""

import json
import re
from pathlib import Path


# --- Config ---

CONFIG_DIR = Path(__file__).parent.parent / "config"
WEIGHTS_FILE = CONFIG_DIR / "scoring_weights.json"


def _load_weights():
    """Load scoring weights from config."""
    if WEIGHTS_FILE.exists():
        with open(WEIGHTS_FILE) as f:
            return json.load(f)
    # Defaults
    return {
        "opportunity": {
            "economic_impact": 0.30,
            "timing_advantage": 0.25,
            "information_asymmetry": 0.25,
            "actionability": 0.20,
        },
        "confidence": {
            "cross_source_validation": 0.40,
            "source_authority": 0.25,
            "evidence_quality": 0.20,
            "historical_consistency": 0.15,
        },
        "thresholds": {
            "top_opportunity_min": 50,
            "watchlist_min": 30,
            "top_confidence_min": 70,
            "watchlist_confidence_min": 50,
            "max_top_signals": 15,
            "max_email_signals": 35,
        },
    }


# --- Scoring Keywords ---

ECONOMIC_IMPACT_BOOSTERS = [
    "billion", "million", "trillion", "gdp", "recession", "growth",
    "inflation", "deflation", "unemployment", "trade deficit", "surplus",
    "merger", "acquisition", "ipo", "bankruptcy", "default", "crisis",
    "stimulus", "bailout", "tariff", "sanction", "subsidy",
    "market cap", "revenue", "profit", "loss", "dividend",
]

TIMING_BOOSTERS = [
    "today", "just", "breaking", "announced", "launching", "effective",
    "immediate", "deadline", "expires", "starting", "beginning",
    "this week", "this month", "tomorrow", "upcoming", "imminent",
    "vote", "decision", "ruling", "verdict",
]

ASYMMETRY_INDICATORS = [
    "quietly", "under the radar", "overlooked", "few realize",
    "emerging", "early stage", "pilot", "experimental",
    "little-known", "nascent", "underground", "niche",
    "sleeper", "hidden", "unreported", "unnoticed",
]

ACTIONABILITY_INDICATORS = [
    "opportunity", "invest", "buy", "sell", "trade", "short",
    "profit", "arbitrage", "hedge", "enter market", "exit market",
    "apply", "register", "eligible", "grant", "funding available",
    "tender", "contract", "bid", "procurement", "rfp",
]

# High-authority sources
AUTHORITY_DOMAINS = {
    "reuters.com": 95,
    "bloomberg.com": 95,
    "ft.com": 93,
    "wsj.com": 93,
    "economist.com": 92,
    "nytimes.com": 90,
    "bbc.com": 90,
    "bbc.co.uk": 90,
    "apnews.com": 90,
    "cnbc.com": 85,
    "marketwatch.com": 82,
    "techcrunch.com": 80,
    "arstechnica.com": 78,
    "theguardian.com": 80,
    "aljazeera.com": 78,
    "nikkei.com": 80,
    "scmp.com": 78,
}


# --- Scoring Functions ---

def _text_signal_score(text, boosters):
    """Score text against booster keywords, returns 0-1."""
    text_lower = text.lower()
    hits = sum(1 for b in boosters if b in text_lower)
    return min(1.0, hits / 3)  # 3+ hits = max score


def _get_domain(url):
    """Extract domain from URL."""
    try:
        from urllib.parse import urlparse
        host = urlparse(url).netloc.replace("www.", "").lower()
        return host
    except Exception:
        return ""


def score_economic_impact(signal):
    """Score magnitude of economic/financial effect (0-1)."""
    text = f"{signal.get('title', '')} {signal.get('snippet', '')}"
    keyword_score = _text_signal_score(text, ECONOMIC_IMPACT_BOOSTERS)

    # Niche channels get slight boost (more specific = potentially higher impact signal)
    channel_bonus = 0.1 if signal.get("channel_type") == "niche" else 0.0

    return min(1.0, keyword_score + channel_bonus)


def score_timing(signal):
    """Score time-sensitivity of the opportunity (0-1)."""
    text = f"{signal.get('title', '')} {signal.get('snippet', '')}"
    keyword_score = _text_signal_score(text, TIMING_BOOSTERS)

    # Tavily score as freshness proxy
    tavily_score = signal.get("score", 0)
    freshness = min(1.0, tavily_score) if tavily_score > 0 else 0.5

    return (keyword_score * 0.6) + (freshness * 0.4)


def score_asymmetry(signal):
    """Score information asymmetry — is this under-reported? (0-1)."""
    text = f"{signal.get('title', '')} {signal.get('snippet', '')}"
    keyword_score = _text_signal_score(text, ASYMMETRY_INDICATORS)

    # Niche channels inherently have higher asymmetry
    channel_score = 0.7 if signal.get("channel_type") == "niche" else 0.3

    return (keyword_score * 0.5) + (channel_score * 0.5)


def score_actionability(signal):
    """Score how actionable this intelligence is (0-1)."""
    text = f"{signal.get('title', '')} {signal.get('snippet', '')}"
    return _text_signal_score(text, ACTIONABILITY_INDICATORS)


def score_source_authority(signal):
    """Score source credibility (0-1)."""
    domain = _get_domain(signal.get("url", ""))
    # Check known authorities
    for auth_domain, auth_score in AUTHORITY_DOMAINS.items():
        if auth_domain in domain:
            return auth_score / 100.0
    # Unknown source: moderate score
    return 0.5


def score_evidence_quality(signal):
    """Score evidence quality — concrete data vs speculation (0-1)."""
    text = f"{signal.get('title', '')} {signal.get('snippet', '')}".lower()

    # Concrete evidence indicators
    evidence_signals = [
        r'\d+%',       # percentages
        r'\$[\d.]+',   # dollar amounts
        r'\d+ (million|billion|trillion)',
        r'according to',
        r'data shows',
        r'report finds',
        r'study reveals',
        r'official statement',
        r'announced',
    ]
    hits = sum(1 for pattern in evidence_signals if re.search(pattern, text))
    return min(1.0, hits / 3)


def calculate_opportunity_score(signal, weights):
    """Calculate OpportunityScore (0-100)."""
    w = weights.get("opportunity", {})
    score = (
        score_economic_impact(signal) * w.get("economic_impact", 0.30) +
        score_timing(signal) * w.get("timing_advantage", 0.25) +
        score_asymmetry(signal) * w.get("information_asymmetry", 0.25) +
        score_actionability(signal) * w.get("actionability", 0.20)
    )
    return round(score * 100, 1)


def calculate_confidence_score(signal, all_signals, weights):
    """
    Calculate ConfidenceScore (0-100).
    Cross-source validation counts how many other signals cover similar topic.
    """
    w = weights.get("confidence", {})

    # Cross-source validation: count signals with similar title from different domains
    title_words = set(signal.get("title", "").lower().split())
    # Remove common stop words for better matching
    stop_words = {"the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "is", "are", "was", "were", "be"}
    title_words -= stop_words

    signal_domain = _get_domain(signal.get("url", ""))
    corroboration = 0
    for other in all_signals:
        if other is signal:
            continue
        other_domain = _get_domain(other.get("url", ""))
        if other_domain == signal_domain:
            continue
        other_words = set(other.get("title", "").lower().split()) - stop_words
        # Check meaningful word overlap
        if title_words and other_words:
            overlap = len(title_words & other_words)
            overlap_ratio = overlap / min(len(title_words), len(other_words))
            if overlap >= 2 and overlap_ratio >= 0.3:
                corroboration += 1

    cross_source = min(1.0, corroboration / 2)  # 2+ sources = max validation

    authority = score_source_authority(signal)
    evidence = score_evidence_quality(signal)

    # Historical consistency: baseline for v0.1 (no history yet = assume moderate)
    history = 0.6

    # Base confidence floor: published news inherently has some confidence
    base_confidence = 0.3

    score = base_confidence + (1.0 - base_confidence) * (
        cross_source * w.get("cross_source_validation", 0.40) +
        authority * w.get("source_authority", 0.25) +
        evidence * w.get("evidence_quality", 0.20) +
        history * w.get("historical_consistency", 0.15)
    )
    return round(min(100.0, score * 100), 1)


# --- Main ---

def run(signals):
    """
    Score and rank signals by OpportunityScore + ConfidenceScore.

    Args:
        signals: List of filtered signal dicts

    Returns:
        dict with:
          - top: List of top signals (OppScore ≥ 50, ConfScore ≥ 70)
          - watchlist: List of watchlist signals (lower confidence)
          - excluded: Count of signals below thresholds
    """
    if not signals:
        print("[oc_ranker] No signals to rank")
        return {"top": [], "watchlist": [], "excluded": 0}

    weights = _load_weights()
    thresholds = weights.get("thresholds", {})
    opp_min_top = thresholds.get("top_opportunity_min", 50)
    opp_min_watch = thresholds.get("watchlist_min", 30)
    conf_min_top = thresholds.get("top_confidence_min", 70)
    conf_min_watch = thresholds.get("watchlist_confidence_min", 50)
    max_top = thresholds.get("max_top_signals", 15)

    print(f"[oc_ranker] Scoring {len(signals)} signals...")

    scored = []
    for s in signals:
        opp_score = calculate_opportunity_score(s, weights)
        conf_score = calculate_confidence_score(s, signals, weights)

        enriched = {
            **s,
            "opportunity_score": opp_score,
            "confidence_score": conf_score,
            "score_breakdown": {
                "economic_impact": round(score_economic_impact(s), 3),
                "timing_advantage": round(score_timing(s), 3),
                "information_asymmetry": round(score_asymmetry(s), 3),
                "actionability": round(score_actionability(s), 3),
                "source_authority": round(score_source_authority(s), 3),
                "evidence_quality": round(score_evidence_quality(s), 3),
            },
        }
        scored.append(enriched)

    # Sort by opportunity score descending
    scored.sort(key=lambda x: x["opportunity_score"], reverse=True)

    # Classify into top / watchlist / excluded
    top = []
    watchlist = []
    excluded = 0

    for s in scored:
        if s["opportunity_score"] >= opp_min_top and s["confidence_score"] >= conf_min_top:
            if len(top) < max_top:
                top.append(s)
            else:
                watchlist.append(s)
        elif s["opportunity_score"] >= opp_min_watch and s["confidence_score"] >= conf_min_watch:
            watchlist.append(s)
        else:
            excluded += 1

    # Cap watchlist
    watchlist = watchlist[:10]

    print(f"[oc_ranker] Results: {len(top)} top | {len(watchlist)} watchlist | {excluded} excluded")
    for s in top[:5]:
        print(f"  [Opp:{s['opportunity_score']} | Conf:{s['confidence_score']}] "
              f"{s['title'][:60]}")

    return {
        "top": top,
        "watchlist": watchlist,
        "excluded": excluded,
    }


if __name__ == "__main__":
    # Test with synthetic data
    test = [
        {
            "title": "Fed announces $2 billion stimulus package for AI industry",
            "url": "https://reuters.com/fed-ai-stimulus",
            "snippet": "According to official data, the Federal Reserve announced today...",
            "country": "US",
            "industry": "technology",
            "channel_type": "mainstream",
            "score": 0.9,
        },
        {
            "title": "Quietly emerging: small nuclear reactor pilot in Indonesia",
            "url": "https://niche-energy-blog.com/smr-indonesia",
            "snippet": "Few realize that a nascent pilot program...",
            "country": "ID",
            "industry": "energy",
            "channel_type": "niche",
            "score": 0.4,
        },
    ]
    results = run(test)
    print(f"\nTop: {len(results['top'])} | Watchlist: {len(results['watchlist'])}")

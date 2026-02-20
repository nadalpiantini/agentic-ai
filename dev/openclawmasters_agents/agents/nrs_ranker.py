"""
NRS Ranker Agent — Risk Severity Scoring for NRS v2
Scores and ranks findings by business risk severity.
Follows signal_ranker.py weighted scoring pattern.
"""

import json
from datetime import datetime, timezone


# Scoring weights
WEIGHTS = {
    "severity": 0.35,
    "business_impact": 0.30,
    "exploitability": 0.20,
    "urgency": 0.15,
}

RISK_THRESHOLD = 0.40
MAX_FINDINGS_PER_TARGET = 3

# Base severity scores (0-1)
SEVERITY_SCORES = {
    "critical": 1.0,
    "high": 0.75,
    "medium": 0.50,
    "low": 0.25,
}

# Business impact by finding type (0-1)
BUSINESS_IMPACT = {
    "ssl_expired": 0.95,
    "ssl_expiring_soon": 0.80,
    "ssl_mismatch": 0.90,
    "ssl_self_signed": 0.70,
    "ssl_weak_protocol": 0.65,
    "ssl_no_cert": 1.0,
    "ssl_verification_failed": 0.85,
    "ssl_connection_failed": 0.60,
    "headers_missing_security": 0.55,
    "headers_hsts_disabled": 0.65,
    "headers_server_exposed": 0.40,
    "headers_deprecated_hpkp": 0.30,
    "headers_csp_leak": 0.70,
    "headers_http_redirect": 0.50,
    "headers_unreachable": 0.30,
    "dns_missing_email_auth": 0.75,
    "dns_dangling_cname": 0.85,
    "dns_metadata_leak": 0.45,
    "github_abandoned": 0.35,
    "github_sensitive_description": 0.80,
    "subdomains_sensitive_exposed": 0.85,
    "subdomains_excessive": 0.40,
}

# Exploitability score by finding type (0-1)
EXPLOITABILITY = {
    "ssl_expired": 0.30,
    "ssl_expiring_soon": 0.20,
    "ssl_mismatch": 0.70,
    "ssl_self_signed": 0.50,
    "ssl_weak_protocol": 0.60,
    "ssl_no_cert": 0.80,
    "ssl_verification_failed": 0.65,
    "ssl_connection_failed": 0.10,
    "headers_missing_security": 0.55,
    "headers_hsts_disabled": 0.45,
    "headers_server_exposed": 0.40,
    "headers_deprecated_hpkp": 0.15,
    "headers_csp_leak": 0.35,
    "headers_http_redirect": 0.40,
    "headers_unreachable": 0.05,
    "dns_missing_email_auth": 0.80,
    "dns_dangling_cname": 0.90,
    "dns_metadata_leak": 0.25,
    "github_abandoned": 0.20,
    "github_sensitive_description": 0.75,
    "subdomains_sensitive_exposed": 0.85,
    "subdomains_excessive": 0.30,
}

# Industry risk multipliers
INDUSTRY_MULTIPLIER = {
    "banking": 1.3,
    "fintech": 1.25,
    "telecom": 1.1,
    "retail": 1.0,
    "marketplace": 1.0,
    "technology": 0.9,
    "unknown": 1.0,
}


def _urgency_score(finding):
    """Calculate urgency based on time-sensitive factors."""
    details = finding.get("details", {})
    ftype = finding.get("finding_type", "")

    # SSL expiring — urgency based on days left
    if "days_left" in details:
        days = details["days_left"]
        if days <= 3:
            return 1.0
        elif days <= 7:
            return 0.85
        elif days <= 14:
            return 0.70
        elif days <= 30:
            return 0.50
        return 0.30

    # Already expired
    if ftype == "ssl_expired":
        return 1.0

    # Dangling CNAME — immediate takeover risk
    if ftype == "dns_dangling_cname":
        return 0.90

    # Sensitive subdomains — immediate access risk
    if ftype == "subdomains_sensitive_exposed":
        return 0.80

    # Default urgency by severity
    severity = finding.get("severity", "medium")
    return {"critical": 0.70, "high": 0.50, "medium": 0.30, "low": 0.15}.get(severity, 0.30)


def score_finding(finding):
    """
    Calculate composite risk score for a finding.
    Returns score 0-1.
    """
    ftype = finding.get("finding_type", "")
    severity = finding.get("severity", "medium")
    industry = finding.get("industry", "unknown")

    severity_score = SEVERITY_SCORES.get(severity, 0.5)
    impact_score = BUSINESS_IMPACT.get(ftype, 0.5)
    exploit_score = EXPLOITABILITY.get(ftype, 0.5)
    urgency_score = _urgency_score(finding)

    # Weighted composite
    raw_score = (
        WEIGHTS["severity"] * severity_score
        + WEIGHTS["business_impact"] * impact_score
        + WEIGHTS["exploitability"] * exploit_score
        + WEIGHTS["urgency"] * urgency_score
    )

    # Apply industry multiplier
    multiplier = INDUSTRY_MULTIPLIER.get(industry, 1.0)
    final_score = min(raw_score * multiplier, 1.0)

    return round(final_score, 4)


def _impact_narrative(finding):
    """Generate a human-readable business impact narrative."""
    ftype = finding.get("finding_type", "")
    details = finding.get("details", {})
    company = finding.get("company_name", "the company")

    narratives = {
        "ssl_expired": f"Visitors to {company}'s website see security warnings, destroying trust and blocking transactions.",
        "ssl_expiring_soon": f"{company}'s SSL certificate is about to expire. Without renewal, their site will show browser warnings.",
        "ssl_mismatch": f"{company}'s SSL certificate belongs to a different domain, enabling potential man-in-the-middle attacks.",
        "ssl_self_signed": f"{company} uses a self-signed certificate, which browsers flag as untrusted.",
        "ssl_weak_protocol": f"{company} uses deprecated encryption that has known vulnerabilities.",
        "headers_missing_security": f"{company}'s website lacks critical security headers that protect against common web attacks.",
        "headers_hsts_disabled": f"{company} has explicitly disabled HSTS, allowing protocol downgrade attacks.",
        "headers_server_exposed": f"{company} exposes server technology details that help attackers plan targeted exploits.",
        "headers_csp_leak": f"{company}'s CSP header reveals their full infrastructure map to anyone who looks.",
        "dns_missing_email_auth": f"Anyone can send emails pretending to be from {company}'s domain, enabling phishing attacks.",
        "dns_dangling_cname": f"{company} has an unresolved DNS record that could be hijacked for subdomain takeover.",
        "github_abandoned": f"{company} has abandoned public repositories that may contain sensitive information.",
        "github_sensitive_description": f"{company} has GitHub repositories with potentially sensitive information in descriptions.",
        "subdomains_sensitive_exposed": f"{company} has administrative/sensitive subdomains accessible without authentication.",
    }

    return narratives.get(ftype, f"Security issue detected in {company}'s infrastructure.")


def run(findings):
    """
    Rank and filter findings by risk score.

    Args:
        findings: List of finding dicts from nrs_scanner

    Returns:
        List of top findings per target that pass the risk threshold,
        enriched with risk_score, severity_label, business_impact_narrative
    """
    print("[nrs_ranker] Scoring findings...")

    # Score all findings
    scored = []
    for f in findings:
        score = score_finding(f)
        f["risk_score"] = score
        f["business_impact_narrative"] = _impact_narrative(f)
        scored.append(f)

    # Filter by threshold
    passed = [f for f in scored if f["risk_score"] >= RISK_THRESHOLD]

    # Group by domain, take top N per target
    by_domain = {}
    for f in sorted(passed, key=lambda x: x["risk_score"], reverse=True):
        domain = f["domain"]
        if domain not in by_domain:
            by_domain[domain] = []
        if len(by_domain[domain]) < MAX_FINDINGS_PER_TARGET:
            by_domain[domain].append(f)

    # Flatten and sort
    ranked = []
    for domain_findings in by_domain.values():
        ranked.extend(domain_findings)
    ranked.sort(key=lambda x: x["risk_score"], reverse=True)

    print(f"[nrs_ranker] {len(ranked)} findings passed threshold ({RISK_THRESHOLD}) from {len(by_domain)} targets")
    for f in ranked[:5]:
        print(f"  [{f['severity'].upper()} {f['risk_score']:.2f}] {f['company_name']}: {f['finding_type']}")

    return ranked


if __name__ == "__main__":
    # Test with sample findings
    test_findings = [
        {
            "domain": "apap.com.do",
            "company_name": "APAP",
            "industry": "banking",
            "finding_type": "ssl_expiring_soon",
            "severity": "critical",
            "details": {"days_left": 3, "issue": "SSL expires in 3 days"},
        },
        {
            "domain": "tpago.com.do",
            "company_name": "tPago",
            "industry": "fintech",
            "finding_type": "ssl_mismatch",
            "severity": "critical",
            "details": {"issue": "SSL cert CN mismatch", "cn": "mail.admin-guin.com"},
        },
    ]
    results = run(test_findings)
    print(json.dumps(results, indent=2, default=str))

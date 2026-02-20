"""
NRS Outreach Composer Agent — Professional Letter Generation for NRS v2
Uses llm.generate() with specialized system prompt.
Generates bilingual outreach letters (Spanish primary, English secondary).
Queues to content/queue/nrs/ for Governor approval.
"""

import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Import LLM from same agents directory
from agents.llm import generate


QUEUE_DIR = Path("content/queue/nrs")
TEMPLATES_DIR = Path.home() / ".openclaw" / "squadrons" / "nrs-v2" / "config" / "templates"

# System prompt for outreach generation
SYSTEM_PROMPT = """You write cold outreach emails for OpenClaw Masters, a cybersecurity intelligence firm
based in Santo Domingo that provides silent infrastructure monitoring to enterprises across Latin America.

VOICE: You write like a senior partner at McKinsey — measured, factual, and slightly understated.
You never sell. You state a fact, offer context, and leave the door open.
Think: quiet confidence. The reader should feel like ignoring this email would be a mistake.

STRUCTURE (strict — no deviations):
1. Greeting line (Estimado/a + title, NOT first name)
2. Opening sentence: State what you found, in one line, no preamble
3. Context paragraph (3 lines max): What this means for their business — concrete, specific
4. Bridge sentence: "Ofrecemos monitoreo silencioso continuo" (or English equivalent) — ONE line
5. Close: 15-minute call offer + your availability

ABSOLUTE RULES:
- NEVER say "vulnerability", "hack", "breach", "attack", "threat", "danger"
- USE: "signal", "observation", "configuration", "exposure", "finding"
- NEVER be accusatory or imply negligence
- NEVER use exclamation marks
- NEVER use marketing language ("best-in-class", "cutting-edge", "state-of-the-art")
- Total letter: 100-130 words. Not 150. Shorter is stronger.
- Write ONLY the letter body. No headers, no JSON, no markdown.
- Sound like a person wrote this at 10pm after reviewing their notes, not like a template."""


# Finding-specific context for the LLM — business impact oriented
FINDING_CONTEXT = {
    "ssl_expired": "Their SSL certificate expired. Every visitor sees a browser warning saying the site is not secure. Online transactions stop. Trust evaporates instantly.",
    "ssl_expiring_soon": "Their SSL certificate expires within days. If not renewed, Chrome and Safari will block all visitors with a full-page security warning.",
    "ssl_mismatch": "The SSL certificate is issued for a different domain. Browsers flag this as a potential impersonation. Any customer paying attention will leave.",
    "ssl_self_signed": "They are using a self-signed certificate. Every browser flags it as untrusted. Customers see red warnings before they can even access the site.",
    "ssl_weak_protocol": "They use TLS 1.0 or 1.1 — protocols with known exploits that regulators and modern browsers are actively blocking.",
    "ssl_no_cert": "No SSL certificate at all. The entire site runs unencrypted. Any data customers submit (passwords, forms, payments) travels in plain text.",
    "ssl_verification_failed": "The SSL certificate fails standard verification. Browsers treat it as potentially compromised.",
    "headers_missing_security": "The site lacks basic HTTP security headers. It is exposed to clickjacking, XSS injection, and protocol downgrade attacks.",
    "headers_hsts_disabled": "HSTS is explicitly turned off, which means the site can be downgraded from HTTPS to HTTP — allowing traffic interception.",
    "headers_server_exposed": "Server headers reveal exactly what technology stack they run (version numbers included). This is a roadmap for anyone looking to exploit known CVEs.",
    "headers_csp_leak": "Their Content Security Policy lists dozens of internal domains. Anyone can map their entire infrastructure — CDN, APIs, internal tools — from a single HTTP header.",
    "headers_http_redirect": "The site redirects to plain HTTP instead of HTTPS. All traffic between the user and the server is readable by any intermediary.",
    "dns_missing_email_auth": "No SPF, DKIM, or DMARC records. Anyone can send emails that appear to come from their domain. This is the #1 vector for business email compromise and phishing.",
    "dns_dangling_cname": "A DNS CNAME record points to a service that no longer exists. Anyone can register that service and take control of their subdomain.",
    "dns_metadata_leak": "Their DNS TXT records leak internal infrastructure details — cloud providers, container platforms, staging environments.",
    "github_abandoned": "They have public GitHub repos that haven't been touched in over a year. Abandoned repos often contain hardcoded credentials, API keys, or internal documentation.",
    "github_sensitive_description": "Public GitHub repos have descriptions containing keywords like 'internal', 'credential', 'api key'. This is visible to anyone searching GitHub.",
    "subdomains_sensitive_exposed": "Admin panels, dashboards, or internal tools are accessible on public subdomains without authentication. Anyone with the URL can try to access them.",
    "subdomains_excessive": "They have a large number of publicly resolvable subdomains serving content. Each one is an additional attack surface.",
}


def compose_letter(finding, language="es"):
    """
    Compose a personalized outreach letter for a finding.

    Args:
        finding: Enriched finding dict from nrs_enricher
        language: "es" (Spanish) or "en" (English)

    Returns:
        Letter text string
    """
    company = finding["company_name"]
    domain = finding["domain"]
    ftype = finding.get("finding_type", "")
    severity = finding.get("severity", "medium")
    details = finding.get("details", {})
    issue = details.get("issue", "security signal detected")
    targets = finding.get("outreach_targets", [])
    risk_score = finding.get("risk_score", 0)
    narrative = finding.get("business_impact_narrative", "")

    # Get contact name for greeting
    contact_name = "Director de Tecnologia" if language == "es" else "Technology Director"
    if targets:
        escalation = targets[1] if len(targets) > 1 else targets[0]
        contact_name = escalation.get("name", escalation.get("role", contact_name))

    finding_context = FINDING_CONTEXT.get(ftype, "a security signal was detected")

    lang_name = 'Spanish' if language == 'es' else 'English'
    sign_off = 'Atentamente,\nOpenClaw Masters' if language == 'es' else 'Best regards,\nOpenClaw Masters'

    prompt = f"""Write in {lang_name}. Company: {company} ({domain}). Recipient: {contact_name}.

WHAT WE FOUND: {finding_context}
SPECIFIC: {issue}
WHY IT MATTERS: {narrative}
SEVERITY: {severity.upper()} (score {risk_score:.0%})

Write the email body only. End with:
{sign_off}

100-130 words maximum. Sound like a real person, not a template."""

    letter = generate(prompt, system=SYSTEM_PROMPT, max_tokens=512, temperature=0.6)

    if not letter:
        # Fallback to template
        letter = _fallback_template(finding, language, contact_name)

    return letter.strip()


def _fallback_template(finding, language, contact_name):
    """Fallback template when LLM is unavailable — sounds human, not templated."""
    company = finding["company_name"]
    domain = finding["domain"]
    issue = finding.get("details", {}).get("issue", "una configuracion que merece revision")
    ftype = finding.get("finding_type", "")

    # Pick a context-specific opening based on finding type
    context_es = {
        "ssl_expired": f"el certificado SSL de {domain} ha expirado",
        "ssl_expiring_soon": f"el certificado SSL de {domain} esta proximo a vencer",
        "ssl_mismatch": f"el certificado SSL de {domain} no corresponde al dominio",
        "ssl_verification_failed": f"el certificado SSL de {domain} presenta errores de verificacion",
        "headers_missing_security": f"{domain} no tiene configurados varios headers de seguridad HTTP",
        "headers_csp_leak": f"la politica de seguridad de contenido de {domain} expone detalles de su infraestructura",
        "headers_server_exposed": f"{domain} expone informacion del servidor en sus headers HTTP",
        "dns_missing_email_auth": f"{domain} no tiene registros de autenticacion de correo configurados",
        "dns_dangling_cname": f"{domain} tiene un registro DNS que apunta a un destino inexistente",
        "subdomains_sensitive_exposed": f"hay subdominios administrativos de {domain} accesibles publicamente",
    }
    context_en = {
        "ssl_expired": f"the SSL certificate for {domain} has expired",
        "ssl_expiring_soon": f"the SSL certificate for {domain} is about to expire",
        "ssl_mismatch": f"the SSL certificate for {domain} does not match the domain",
        "ssl_verification_failed": f"the SSL certificate for {domain} fails verification",
        "headers_missing_security": f"{domain} is missing several HTTP security headers",
        "headers_csp_leak": f"the content security policy on {domain} reveals infrastructure details",
        "headers_server_exposed": f"{domain} exposes server information in its HTTP headers",
        "dns_missing_email_auth": f"{domain} has no email authentication records configured",
        "dns_dangling_cname": f"{domain} has a DNS record pointing to a non-existent destination",
        "subdomains_sensitive_exposed": f"there are administrative subdomains of {domain} publicly accessible",
    }

    if language == "es":
        ctx = context_es.get(ftype, issue)
        return f"""Estimado/a {contact_name},

Identificamos que {ctx}. Es una configuracion visible publicamente que revisamos como parte de nuestro trabajo de inteligencia de infraestructura en la region.

No es urgente, pero si es el tipo de senal que conviene atender antes de que escale. Ofrecemos monitoreo silencioso continuo por iguala mensual — cuesta una fraccion de lo que costaria un incidente.

Quedo disponible para una llamada de 15 minutos cuando le convenga.

Atentamente,
OpenClaw Masters"""
    else:
        ctx = context_en.get(ftype, issue)
        return f"""Dear {contact_name},

We identified that {ctx}. This is a publicly visible configuration we flagged during our regional infrastructure intelligence work.

It is not urgent, but it is the kind of signal worth addressing before it escalates. We offer continuous silent monitoring on a monthly retainer — a fraction of what an incident would cost.

I am available for a 15-minute call at your convenience.

Best regards,
OpenClaw Masters"""


def compose_subject(finding, language="es"):
    """Generate email subject line — concise, non-spammy, curiosity-driven."""
    company = finding["company_name"]
    domain = finding["domain"]
    ftype = finding.get("finding_type", "")

    # Subject varies by finding type to avoid repetitive patterns
    SUBJECTS_ES = {
        "ssl_expired": f"Certificado SSL — {domain}",
        "ssl_expiring_soon": f"Nota sobre {domain}",
        "ssl_mismatch": f"Configuracion SSL — {domain}",
        "ssl_self_signed": f"Certificado en {domain}",
        "ssl_verification_failed": f"Certificado SSL — {domain}",
        "headers_missing_security": f"Configuracion web — {domain}",
        "headers_csp_leak": f"Exposicion de infraestructura — {domain}",
        "headers_server_exposed": f"Headers publicos — {domain}",
        "dns_missing_email_auth": f"Autenticacion de correo — {domain}",
        "dns_dangling_cname": f"Registro DNS — {domain}",
        "dns_metadata_leak": f"Metadata DNS — {domain}",
        "github_sensitive_description": f"Repositorios publicos — {company}",
        "subdomains_sensitive_exposed": f"Subdominios expuestos — {domain}",
    }
    SUBJECTS_EN = {
        "ssl_expired": f"SSL Certificate — {domain}",
        "ssl_expiring_soon": f"Note regarding {domain}",
        "ssl_mismatch": f"SSL Configuration — {domain}",
        "ssl_self_signed": f"Certificate on {domain}",
        "ssl_verification_failed": f"SSL Certificate — {domain}",
        "headers_missing_security": f"Web configuration — {domain}",
        "headers_csp_leak": f"Infrastructure exposure — {domain}",
        "headers_server_exposed": f"Public headers — {domain}",
        "dns_missing_email_auth": f"Email authentication — {domain}",
        "dns_dangling_cname": f"DNS record — {domain}",
        "dns_metadata_leak": f"DNS metadata — {domain}",
        "github_sensitive_description": f"Public repositories — {company}",
        "subdomains_sensitive_exposed": f"Exposed subdomains — {domain}",
    }

    if language == "es":
        return SUBJECTS_ES.get(ftype, f"Nota tecnica — {domain}")
    else:
        return SUBJECTS_EN.get(ftype, f"Technical note — {domain}")


def queue_outreach(finding, letter_es, letter_en, subject_es, subject_en):
    """
    Save outreach to queue for Governor approval.
    Returns path to queued file.
    """
    QUEUE_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    company_slug = finding["company_name"].lower().replace(" ", "_")
    filename = f"outreach_{company_slug}_{timestamp}.json"

    outreach = {
        "company": finding["company_name"],
        "domain": finding["domain"],
        "finding_type": finding.get("finding_type", ""),
        "severity": finding.get("severity", ""),
        "risk_score": finding.get("risk_score", 0),
        "outreach_targets": finding.get("outreach_targets", []),
        "letter_es": letter_es,
        "letter_en": letter_en,
        "subject_es": subject_es,
        "subject_en": subject_en,
        "follow_up_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "status": "queued",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    filepath = QUEUE_DIR / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(outreach, f, indent=2, ensure_ascii=False)

    return str(filepath)


def run(enriched_findings):
    """
    Compose outreach letters for each enriched finding.

    Args:
        enriched_findings: Findings from nrs_enricher

    Returns:
        List of outreach dicts with letters and queue paths
    """
    print("[nrs_outreach] Composing outreach letters...")
    outreach_results = []

    # Group findings by company to send one letter per company
    by_company = {}
    for f in enriched_findings:
        company = f["company_name"]
        if company not in by_company:
            by_company[company] = []
        by_company[company].append(f)

    for company, findings in by_company.items():
        # Use the highest severity finding as the primary
        primary = findings[0]  # Already sorted by risk_score
        print(f"  [nrs_outreach] Composing for {company} ({len(findings)} finding(s))...")

        # Compose bilingual letters
        letter_es = compose_letter(primary, language="es")
        letter_en = compose_letter(primary, language="en")
        subject_es = compose_subject(primary, language="es")
        subject_en = compose_subject(primary, language="en")

        # Queue for Governor approval
        queue_path = queue_outreach(primary, letter_es, letter_en, subject_es, subject_en)

        outreach_results.append({
            "company": company,
            "domain": primary["domain"],
            "finding_count": len(findings),
            "primary_finding": primary["finding_type"],
            "risk_score": primary["risk_score"],
            "letter_es_preview": letter_es[:100] + "...",
            "letter_en_preview": letter_en[:100] + "...",
            "queue_path": queue_path,
            "status": "queued_for_approval",
        })

        print(f"    Queued: {queue_path}")

    print(f"[nrs_outreach] {len(outreach_results)} outreach letters queued for approval")
    return outreach_results


if __name__ == "__main__":
    test = [{
        "domain": "apap.com.do",
        "company_name": "APAP",
        "industry": "banking",
        "finding_type": "ssl_expiring_soon",
        "severity": "critical",
        "risk_score": 0.92,
        "details": {"days_left": 3, "issue": "SSL certificate expires in 3 days"},
        "business_impact_narrative": "Visitors will see security warnings, destroying trust.",
        "outreach_targets": [
            {"role": "IT Director", "emails": ["tecnologia@apap.com.do"]},
            {"role": "CTO", "emails": ["cto@apap.com.do"]},
        ],
    }]
    results = run(test)
    for r in results:
        print(f"\n  {r['company']}: {r['status']}")
        print(f"  ES preview: {r['letter_es_preview']}")

"""
NRS Enricher Agent — Company Contact Discovery for NRS v2
Discovers contacts for dual targeting: responsible dept + dept above.
Sources: WHOIS/RDAP, company website, email pattern discovery.
"""

import json
import re
import urllib.request
import urllib.error
from datetime import datetime, timezone


USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
TIMEOUT = 8

# Contact hierarchy by finding type
# Maps finding_type -> (responsible_role, escalation_role)
CONTACT_HIERARCHY = {
    "ssl_expired": ("IT Director", "CTO"),
    "ssl_expiring_soon": ("IT Director", "CTO"),
    "ssl_mismatch": ("IT Director", "CTO"),
    "ssl_self_signed": ("IT Director", "CTO"),
    "ssl_weak_protocol": ("IT Director", "CTO"),
    "ssl_no_cert": ("IT Director", "CTO"),
    "ssl_verification_failed": ("IT Director", "CTO"),
    "ssl_connection_failed": ("IT Director", "CTO"),
    "headers_missing_security": ("IT Director", "CTO"),
    "headers_hsts_disabled": ("IT Director", "CTO"),
    "headers_server_exposed": ("IT Director", "CTO"),
    "headers_deprecated_hpkp": ("IT Director", "CTO"),
    "headers_csp_leak": ("CISO", "CTO"),
    "headers_http_redirect": ("IT Director", "CTO"),
    "dns_missing_email_auth": ("IT Director", "CTO"),
    "dns_dangling_cname": ("CISO", "CTO"),
    "dns_metadata_leak": ("DevOps Lead", "CTO"),
    "github_abandoned": ("VP Engineering", "CEO"),
    "github_sensitive_description": ("CTO", "CEO"),
    "subdomains_sensitive_exposed": ("CISO", "CTO"),
    "subdomains_excessive": ("IT Director", "CTO"),
}

# Common email patterns for LATAM companies
EMAIL_PATTERNS = [
    "{first}.{last}@{domain}",
    "{first}{last}@{domain}",
    "{f}.{last}@{domain}",
    "{f}{last}@{domain}",
    "{first}_{last}@{domain}",
    "{first}@{domain}",
    "{last}@{domain}",
    "info@{domain}",
    "contacto@{domain}",
    "contactenos@{domain}",
    "informacion@{domain}",
    "atencion@{domain}",
    "servicio@{domain}",
    "tecnologia@{domain}",
    "seguridad@{domain}",
    "rrhh@{domain}",
    "gerencia@{domain}",
    "ventas@{domain}",
]

# Common department email addresses (LATAM-optimized)
DEPARTMENT_EMAILS = {
    "IT Director": [
        "it@{domain}", "tecnologia@{domain}", "soporte@{domain}", "sistemas@{domain}",
        "ti@{domain}", "informatica@{domain}", "helpdesk@{domain}", "mesa.ayuda@{domain}",
        "director.ti@{domain}", "director.sistemas@{domain}",
    ],
    "CTO": [
        "cto@{domain}", "tecnologia@{domain}", "direccion.tecnologia@{domain}",
        "director.tecnologia@{domain}", "chief.technology@{domain}", "tech@{domain}",
    ],
    "CISO": [
        "seguridad@{domain}", "ciso@{domain}", "infosec@{domain}",
        "seguridad.informatica@{domain}", "security@{domain}",
        "riesgos@{domain}", "cumplimiento@{domain}", "compliance@{domain}",
    ],
    "CEO": [
        "ceo@{domain}", "direccion@{domain}", "presidencia@{domain}", "gerencia@{domain}",
        "director.general@{domain}", "gerencia.general@{domain}",
        "presidente@{domain}", "oficina.presidente@{domain}",
    ],
    "VP Engineering": [
        "ingenieria@{domain}", "desarrollo@{domain}", "engineering@{domain}",
        "dev@{domain}", "director.ingenieria@{domain}",
    ],
    "DevOps Lead": [
        "devops@{domain}", "infraestructura@{domain}", "operaciones@{domain}",
        "infra@{domain}", "ops@{domain}", "plataforma@{domain}",
    ],
}


def _fetch_page(url, timeout=TIMEOUT):
    """Fetch webpage content as text."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception:
        return ""


def _whois_lookup(domain):
    """
    Lookup domain WHOIS via RDAP (JSON-based, stdlib compatible).
    Returns dict with registrant info.
    """
    # Try RDAP first (JSON API)
    rdap_url = f"https://rdap.org/domain/{domain}"
    req = urllib.request.Request(rdap_url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = json.loads(resp.read().decode())

        info = {
            "registrant": None,
            "admin_contact": None,
            "tech_contact": None,
            "registrar": None,
            "created": None,
            "expires": None,
        }

        # Extract entities
        for entity in data.get("entities", []):
            roles = entity.get("roles", [])
            vcard = entity.get("vcardArray", [None, []])[1] if entity.get("vcardArray") else []

            name = None
            email = None
            org = None
            for field in vcard:
                if field[0] == "fn":
                    name = field[3]
                elif field[0] == "email":
                    email = field[3]
                elif field[0] == "org":
                    org = field[3] if isinstance(field[3], str) else str(field[3])

            contact = {"name": name, "email": email, "org": org}

            if "registrant" in roles:
                info["registrant"] = contact
            if "administrative" in roles:
                info["admin_contact"] = contact
            if "technical" in roles:
                info["tech_contact"] = contact
            if "registrar" in roles:
                info["registrar"] = entity.get("handle", name)

        # Extract dates
        for event in data.get("events", []):
            if event.get("eventAction") == "registration":
                info["created"] = event.get("eventDate")
            elif event.get("eventAction") == "expiration":
                info["expires"] = event.get("eventDate")

        return info

    except Exception:
        return {}


def _scrape_about_page(domain):
    """
    Attempt to find team/about page and extract names and titles.
    Returns list of contact dicts.
    """
    contacts = []
    about_paths = [
        "/about", "/about-us", "/nosotros", "/quienes-somos", "/sobre-nosotros",
        "/equipo", "/team", "/nuestro-equipo", "/directivos", "/liderazgo", "/leadership",
        "/contacto", "/contact", "/contactenos", "/contactanos",
        "/gobierno-corporativo", "/corporate-governance", "/junta-directiva",
        "/ejecutivos", "/management", "/our-team", "/staff",
    ]

    for path in about_paths:
        url = f"https://{domain}{path}"
        html = _fetch_page(url)
        if not html or len(html) < 500:
            continue

        # Extract email addresses from page
        emails = re.findall(r'[\w.+-]+@[\w-]+\.[\w.]+', html)
        for email in set(emails):
            if domain in email or domain.split(".")[0] in email:
                contacts.append({"email": email, "source": f"website{path}"})

        # Look for common title patterns (CEO, CTO, Director, etc.)
        title_patterns = [
            r'(?:CEO|Chief Executive|Presidente|Director General|Director Ejecutivo|Gerente General)',
            r'(?:CTO|Chief Technology|Director de Tecnolog[ií]a|VP Tecnolog[ií]a|Vicepresidente de Tecnolog)',
            r'(?:CISO|Chief Information Security|Director de Seguridad|Oficial de Seguridad)',
            r'(?:CFO|Chief Financial|Director Financiero|Vicepresidente Financiero)',
            r'(?:COO|Chief Operating|Director de Operaciones|Gerente de Operaciones)',
            r'(?:VP|Vice President|Vicepresidente)',
            r'(?:Director de TI|IT Director|Director de Sistemas|Gerente de TI|Gerente de Sistemas)',
            r'(?:Director de Infraestructura|Infrastructure Director|Head of IT)',
            r'(?:Gerente de Riesgos|Risk Manager|Director de Cumplimiento|Compliance)',
        ]
        for pattern in title_patterns:
            matches = re.findall(rf'([A-Z][a-z]+ [A-Z][a-z]+)[\s,]*(?:{pattern})', html)
            for name in matches:
                contacts.append({"name": name, "source": f"website{path}"})

        break  # Only process first successful page

    return contacts


def _generate_department_emails(domain, role):
    """Generate likely department email addresses for a role."""
    patterns = DEPARTMENT_EMAILS.get(role, ["info@{domain}"])
    return [p.format(domain=domain) for p in patterns]


def enrich_finding(finding):
    """
    Enrich a single finding with company contact information.
    Returns finding dict with added contact fields.
    """
    domain = finding["domain"]
    company = finding["company_name"]
    ftype = finding.get("finding_type", "")

    # Determine target roles
    responsible_role, escalation_role = CONTACT_HIERARCHY.get(ftype, ("IT Director", "CTO"))

    # Gather intel
    whois_info = _whois_lookup(domain)
    website_contacts = _scrape_about_page(domain)

    # Build company info
    company_info = {
        "name": company,
        "domain": domain,
        "industry": finding.get("industry", "unknown"),
        "registrant": whois_info.get("registrant"),
        "admin_contact": whois_info.get("admin_contact"),
        "tech_contact": whois_info.get("tech_contact"),
        "domain_created": whois_info.get("created"),
        "domain_expires": whois_info.get("expires"),
        "website_contacts": website_contacts[:5],
    }

    # Build outreach targets
    responsible_contact = {
        "role": responsible_role,
        "department": _role_to_department(responsible_role),
        "hierarchy_level": _role_hierarchy(responsible_role),
        "emails": _generate_department_emails(domain, responsible_role),
    }

    escalation_contact = {
        "role": escalation_role,
        "department": _role_to_department(escalation_role),
        "hierarchy_level": _role_hierarchy(escalation_role),
        "emails": _generate_department_emails(domain, escalation_role),
    }

    # Try to enrich with actual names/emails from WHOIS or website
    if whois_info.get("tech_contact", {}) and responsible_role in ("IT Director", "CTO"):
        tc = whois_info["tech_contact"]
        if tc.get("name"):
            responsible_contact["name"] = tc["name"]
        if tc.get("email"):
            responsible_contact["emails"].insert(0, tc["email"])

    if whois_info.get("admin_contact", {}) and escalation_role in ("CTO", "CEO"):
        ac = whois_info["admin_contact"]
        if ac.get("name"):
            escalation_contact["name"] = ac["name"]
        if ac.get("email"):
            escalation_contact["emails"].insert(0, ac["email"])

    # Add enrichment to finding
    finding["company_info"] = company_info
    finding["outreach_targets"] = [responsible_contact, escalation_contact]
    finding["enriched_at"] = datetime.now(timezone.utc).isoformat()

    return finding


def _role_to_department(role):
    """Map role to department name."""
    mapping = {
        "CEO": "Executive / Presidencia",
        "CTO": "Technology / Tecnologia",
        "CISO": "Information Security / Seguridad",
        "IT Director": "IT / Sistemas",
        "VP Engineering": "Engineering / Ingenieria",
        "DevOps Lead": "Operations / Operaciones",
    }
    return mapping.get(role, "Technology")


def _role_hierarchy(role):
    """Map role to hierarchy level (1=CEO, 5=Manager)."""
    levels = {
        "CEO": 1,
        "CTO": 2,
        "CISO": 2,
        "VP Engineering": 3,
        "IT Director": 3,
        "DevOps Lead": 4,
    }
    return levels.get(role, 4)


def run(ranked_findings):
    """
    Enrich findings with company contact info.

    Args:
        ranked_findings: Ranked findings from nrs_ranker

    Returns:
        Findings enriched with company_info, outreach_targets
    """
    print("[nrs_enricher] Enriching findings with contact data...")
    enriched = []

    # Group by domain to avoid duplicate lookups
    domains_processed = set()
    domain_cache = {}

    for finding in ranked_findings:
        domain = finding["domain"]

        if domain not in domains_processed:
            print(f"  [nrs_enricher] Enriching {finding['company_name']} ({domain})...")
            domains_processed.add(domain)

        enriched_finding = enrich_finding(finding)
        enriched.append(enriched_finding)

    print(f"[nrs_enricher] Enriched {len(enriched)} findings across {len(domains_processed)} companies")
    return enriched


if __name__ == "__main__":
    test = [{
        "domain": "apap.com.do",
        "company_name": "APAP",
        "industry": "banking",
        "finding_type": "ssl_expiring_soon",
        "severity": "critical",
        "details": {"days_left": 3},
        "risk_score": 0.92,
    }]
    results = run(test)
    for r in results:
        targets = r.get("outreach_targets", [])
        for t in targets:
            print(f"  {t['role']} ({t['department']}): {t['emails'][:2]}")

"""
NRS Scanner Agent — Network Risk Scanner v2
Scans target domains for externally detectable security issues.
Zero external deps (stdlib only: ssl, socket, urllib).
All scans are passive/non-intrusive — no exploitation.
"""

import json
import ssl
import socket
import urllib.request
import urllib.error
import time
from datetime import datetime, timezone
from pathlib import Path


USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
SCAN_TIMEOUT = 8

# Security headers that should be present
EXPECTED_HEADERS = {
    "strict-transport-security": {
        "severity": "high",
        "label": "HSTS",
        "desc": "Protects against protocol downgrade attacks",
    },
    "content-security-policy": {
        "severity": "high",
        "label": "CSP",
        "desc": "Protects against XSS and injection attacks",
    },
    "x-frame-options": {
        "severity": "medium",
        "label": "X-Frame-Options",
        "desc": "Protects against clickjacking",
    },
    "x-content-type-options": {
        "severity": "medium",
        "label": "X-Content-Type-Options",
        "desc": "Prevents MIME type sniffing",
    },
}

# Headers that should NOT be exposed
DANGEROUS_HEADERS = [
    "x-powered-by",
    "server",
    "x-aspnet-version",
    "x-aspnetmvc-version",
    "x-generator",
    "x-drupal-cache",
    "x-varnish",
    "via",
    "x-amz-cf-id",
    "x-debug-token",
    "x-runtime",
]

# Common subdomains to probe
SUBDOMAIN_WORDLIST = [
    # Admin & management
    "admin", "panel", "portal", "dashboard", "console", "manage", "cpanel", "webadmin",
    # Development & staging
    "dev", "staging", "test", "beta", "qa", "uat", "sandbox", "demo", "pre", "preprod",
    # API & services
    "api", "api2", "api-v2", "gateway", "graphql", "ws", "websocket", "rpc", "grpc",
    # Internal & infra
    "internal", "intranet", "corp", "private", "local", "office",
    # Email & comms
    "mail", "webmail", "smtp", "imap", "pop3", "exchange", "owa", "autodiscover",
    # Remote access
    "vpn", "remote", "rdp", "ssh", "bastion", "jump", "proxy", "socks",
    # CI/CD & DevOps
    "git", "gitlab", "github", "bitbucket", "jenkins", "ci", "cd", "deploy", "build",
    "drone", "argo", "harbor", "registry", "docker", "containers", "k8s", "kubernetes",
    # Monitoring & logging
    "monitor", "grafana", "kibana", "elastic", "prometheus", "datadog", "sentry",
    "nagios", "zabbix", "splunk", "logs", "metrics", "status", "uptime",
    # Databases
    "db", "mysql", "postgres", "postgresql", "mongo", "mongodb", "redis",
    "phpmyadmin", "pgadmin", "adminer", "dynamo",
    # Storage & CDN
    "minio", "s3", "storage", "files", "assets", "cdn", "media", "uploads", "ftp",
    # CMS & web
    "cms", "blog", "wordpress", "wp", "drupal", "joomla",
    # Legacy & backup
    "backup", "bak", "old", "legacy", "v1", "v2", "archive", "temp", "tmp",
    # Cloud & SaaS
    "cloud", "aws", "azure", "gcp", "heroku", "app", "saas",
    # Security
    "sso", "auth", "login", "oauth", "idp", "ldap", "ad",
    # Misc infra
    "ns1", "ns2", "dns", "ntp", "radius", "wiki", "docs", "help", "support", "ticket",
]


def _fetch_headers(domain, timeout=SCAN_TIMEOUT):
    """Fetch HTTP response headers from a domain."""
    url = f"https://{domain}"
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return dict(resp.headers), resp.status, resp.url
    except urllib.error.HTTPError as e:
        return dict(e.headers) if hasattr(e, "headers") else {}, e.code, url
    except Exception:
        # Try HTTP fallback
        try:
            url_http = f"http://{domain}"
            req = urllib.request.Request(url_http, method="HEAD", headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return dict(resp.headers), resp.status, resp.url
        except Exception:
            return {}, 0, url


def scan_ssl(domain):
    """
    Check SSL certificate validity, expiration, and configuration.
    Returns list of finding dicts.
    """
    findings = []
    ctx = ssl.create_default_context()

    try:
        with socket.create_connection((domain, 443), timeout=SCAN_TIMEOUT) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()

                if not cert:
                    findings.append({
                        "finding_type": "ssl_no_cert",
                        "severity": "critical",
                        "details": {"issue": "No SSL certificate presented"},
                    })
                    return findings

                # Check expiration
                not_after = ssl.cert_time_to_seconds(cert["notAfter"])
                now = time.time()
                days_left = (not_after - now) / 86400

                if days_left <= 0:
                    findings.append({
                        "finding_type": "ssl_expired",
                        "severity": "critical",
                        "details": {
                            "issue": "SSL certificate has expired",
                            "expired_on": cert["notAfter"],
                            "days_expired": abs(int(days_left)),
                        },
                    })
                elif days_left <= 7:
                    findings.append({
                        "finding_type": "ssl_expiring_soon",
                        "severity": "critical",
                        "details": {
                            "issue": f"SSL certificate expires in {int(days_left)} days",
                            "expires_on": cert["notAfter"],
                            "days_left": int(days_left),
                        },
                    })
                elif days_left <= 30:
                    findings.append({
                        "finding_type": "ssl_expiring_soon",
                        "severity": "high",
                        "details": {
                            "issue": f"SSL certificate expires in {int(days_left)} days",
                            "expires_on": cert["notAfter"],
                            "days_left": int(days_left),
                        },
                    })

                # Check subject mismatch
                subject = dict(x[0] for x in cert.get("subject", []))
                cn = subject.get("commonName", "")
                san_list = []
                for ext_type, ext_val in cert.get("subjectAltName", []):
                    if ext_type == "DNS":
                        san_list.append(ext_val)

                if domain not in san_list and not cn.endswith(domain) and f"*.{domain.split('.', 1)[-1]}" not in san_list:
                    # Check if wildcard covers it
                    wildcard_match = any(
                        domain.endswith(s.lstrip("*")) for s in san_list if s.startswith("*.")
                    )
                    if not wildcard_match and domain != cn:
                        findings.append({
                            "finding_type": "ssl_mismatch",
                            "severity": "critical",
                            "details": {
                                "issue": f"SSL certificate CN={cn} does not match domain {domain}",
                                "cn": cn,
                                "san": san_list[:5],
                                "domain": domain,
                            },
                        })

                # Check issuer
                issuer = dict(x[0] for x in cert.get("issuer", []))
                issuer_org = issuer.get("organizationName", "Unknown")

                # Self-signed check
                if issuer_org == subject.get("organizationName", ""):
                    findings.append({
                        "finding_type": "ssl_self_signed",
                        "severity": "high",
                        "details": {
                            "issue": "SSL certificate appears to be self-signed",
                            "issuer": issuer_org,
                        },
                    })

                # Protocol version
                protocol = ssock.version()
                if protocol and protocol in ("TLSv1", "TLSv1.1"):
                    findings.append({
                        "finding_type": "ssl_weak_protocol",
                        "severity": "high",
                        "details": {
                            "issue": f"Using deprecated TLS protocol: {protocol}",
                            "protocol": protocol,
                        },
                    })

    except ssl.SSLCertVerificationError as e:
        findings.append({
            "finding_type": "ssl_verification_failed",
            "severity": "critical",
            "details": {
                "issue": f"SSL certificate verification failed: {str(e)[:200]}",
                "error": str(e)[:200],
            },
        })
    except (socket.timeout, socket.gaierror, ConnectionRefusedError, OSError) as e:
        findings.append({
            "finding_type": "ssl_connection_failed",
            "severity": "high",
            "details": {
                "issue": f"Cannot establish SSL connection to {domain}",
                "error": str(e)[:200],
            },
        })

    return findings


def scan_headers(domain):
    """
    Check for missing security headers and exposed server information.
    Returns list of finding dicts.
    """
    findings = []
    headers, status, final_url = _fetch_headers(domain)

    if not headers:
        findings.append({
            "finding_type": "headers_unreachable",
            "severity": "medium",
            "details": {"issue": f"Cannot fetch headers from {domain}", "status": status},
        })
        return findings

    headers_lower = {k.lower(): v for k, v in headers.items()}

    # Check for missing security headers
    missing = []
    for header, info in EXPECTED_HEADERS.items():
        if header not in headers_lower:
            missing.append(info["label"])

    if missing:
        severity = "high" if len(missing) >= 3 else "medium"
        findings.append({
            "finding_type": "headers_missing_security",
            "severity": severity,
            "details": {
                "issue": f"Missing security headers: {', '.join(missing)}",
                "missing_headers": missing,
                "count": len(missing),
            },
        })

    # Check HSTS with max-age=0 (disabled)
    hsts = headers_lower.get("strict-transport-security", "")
    if hsts and "max-age=0" in hsts:
        findings.append({
            "finding_type": "headers_hsts_disabled",
            "severity": "high",
            "details": {
                "issue": "HSTS is explicitly disabled (max-age=0)",
                "header_value": hsts,
            },
        })

    # Check for exposed server information
    exposed = []
    for header in DANGEROUS_HEADERS:
        val = headers_lower.get(header, "")
        if val:
            exposed.append({"header": header, "value": val})

    if exposed:
        findings.append({
            "finding_type": "headers_server_exposed",
            "severity": "medium",
            "details": {
                "issue": f"Server technology exposed via headers: {', '.join(h['header'] + '=' + h['value'] for h in exposed)}",
                "exposed_headers": exposed,
            },
        })

    # Check for deprecated headers
    if "public-key-pins" in headers_lower:
        findings.append({
            "finding_type": "headers_deprecated_hpkp",
            "severity": "medium",
            "details": {
                "issue": "Deprecated HPKP (HTTP Public Key Pinning) header present",
                "header_value": headers_lower["public-key-pins"][:200],
            },
        })

    # Check CSP for infrastructure leaks (overly verbose CSP)
    csp = headers_lower.get("content-security-policy", "")
    if csp and len(csp) > 500:
        # Extract domain references from CSP
        domains_in_csp = [w for w in csp.split() if "." in w and not w.startswith("'")]
        if len(domains_in_csp) > 10:
            findings.append({
                "finding_type": "headers_csp_leak",
                "severity": "high",
                "details": {
                    "issue": f"CSP header exposes {len(domains_in_csp)} infrastructure domains",
                    "domains_exposed": domains_in_csp[:15],
                    "csp_length": len(csp),
                },
            })

    # Check redirect chain
    if final_url and "http://" in final_url:
        findings.append({
            "finding_type": "headers_http_redirect",
            "severity": "medium",
            "details": {
                "issue": f"Final redirect lands on HTTP (not HTTPS): {final_url}",
                "final_url": final_url,
            },
        })

    return findings


def scan_dns(domain):
    """
    Check DNS configuration for email auth (SPF/DKIM/DMARC) and misconfigs.
    Uses DNS-over-HTTPS via Google's API (stdlib urllib).
    Returns list of finding dicts.
    """
    findings = []

    def _dns_query(name, record_type):
        """Query DNS via Google DNS-over-HTTPS API."""
        url = f"https://dns.google/resolve?name={name}&type={record_type}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=SCAN_TIMEOUT) as resp:
                data = json.loads(resp.read().decode())
                return [a.get("data", "") for a in data.get("Answer", [])]
        except Exception:
            return []

    # Check SPF
    txt_records = _dns_query(domain, "TXT")
    has_spf = any("v=spf1" in r for r in txt_records)

    # Check DMARC
    dmarc_records = _dns_query(f"_dmarc.{domain}", "TXT")
    has_dmarc = any("v=DMARC1" in r for r in dmarc_records)

    # Check DKIM (common selectors)
    has_dkim = False
    for selector in ["default", "google", "selector1", "selector2", "k1", "k2", "s1", "s2", "dkim", "mail", "email", "mandrill", "mailgun", "sendgrid", "ses"]:
        dkim_records = _dns_query(f"{selector}._domainkey.{domain}", "TXT")
        if any("v=DKIM1" in r or "k=rsa" in r for r in dkim_records):
            has_dkim = True
            break

    missing_email_auth = []
    if not has_spf:
        missing_email_auth.append("SPF")
    if not has_dmarc:
        missing_email_auth.append("DMARC")
    if not has_dkim:
        missing_email_auth.append("DKIM")

    if missing_email_auth:
        severity = "high" if "DMARC" in missing_email_auth else "medium"
        findings.append({
            "finding_type": "dns_missing_email_auth",
            "severity": severity,
            "details": {
                "issue": f"Missing email authentication records: {', '.join(missing_email_auth)}",
                "missing": missing_email_auth,
                "risk": "Anyone can send emails appearing to come from this domain",
            },
        })

    # Check for dangling CNAME
    cname_records = _dns_query(domain, "CNAME")
    for cname in cname_records:
        # Try to resolve the CNAME target
        target_a = _dns_query(cname.rstrip("."), "A")
        if not target_a:
            findings.append({
                "finding_type": "dns_dangling_cname",
                "severity": "high",
                "details": {
                    "issue": f"Dangling CNAME: {domain} -> {cname} (target does not resolve)",
                    "cname_target": cname,
                    "risk": "Potential subdomain takeover",
                },
            })

    # Check for interesting TXT records (leaked metadata)
    for txt in txt_records:
        txt_lower = txt.lower()
        if any(kw in txt_lower for kw in [
            "kubernetes", "k8s", "docker", "internal", "staging", "dev", "test",
            "aws", "azure", "gcp", "heroku", "cloudflare", "terraform",
            "jenkins", "gitlab", "ci/cd", "deploy", "container", "registry",
            "vpc", "subnet", "10.0.", "172.16.", "192.168.", "localhost",
        ]):
            findings.append({
                "finding_type": "dns_metadata_leak",
                "severity": "medium",
                "details": {
                    "issue": f"DNS TXT record contains infrastructure metadata",
                    "txt_record": txt[:200],
                },
            })

    return findings


def scan_github(company_name):
    """
    Check for exposed GitHub repos associated with the company.
    Returns list of finding dicts.
    """
    findings = []

    # Search GitHub for repos — try company name and domain variations
    search_term = company_name.replace(" ", "+")
    query = urllib.request.quote(f"{search_term}")
    url = f"https://api.github.com/search/repositories?q={query}+in:name,description,readme&sort=updated&per_page=15"
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/vnd.github.v3+json",
    })

    try:
        with urllib.request.urlopen(req, timeout=SCAN_TIMEOUT) as resp:
            data = json.loads(resp.read().decode())
    except Exception:
        return findings

    repos = data.get("items", [])
    if not repos:
        return findings

    for repo in repos[:5]:
        name = repo.get("full_name", "")
        desc = repo.get("description", "") or ""
        pushed_at = repo.get("pushed_at", "")
        archived = repo.get("archived", False)
        stars = repo.get("stargazers_count", 0)

        # Check for abandoned repos (no push in >1 year)
        if pushed_at:
            try:
                last_push = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
                days_since = (datetime.now(timezone.utc) - last_push).days
                if days_since > 365:
                    findings.append({
                        "finding_type": "github_abandoned",
                        "severity": "medium",
                        "details": {
                            "issue": f"Abandoned GitHub repo: {name} (last push {days_since} days ago)",
                            "repo": name,
                            "days_inactive": days_since,
                            "url": repo.get("html_url", ""),
                        },
                    })
            except (ValueError, TypeError):
                pass

        # Check for potential sensitive keywords in repo description
        sensitive_keywords = [
            "api key", "api_key", "apikey", "secret", "password", "credential",
            "token", "internal", "private", "confidential", "database", "db_password",
            "aws_access", "aws_secret", "ssh_key", "private_key", "encryption_key",
            "smtp_password", "ftp_password", "admin_password", "root_password",
            "connection_string", "jwt_secret", "oauth_secret", "client_secret",
            ".env", "config.yml", "credentials.json", "service_account",
        ]
        desc_lower = desc.lower()
        hits = [kw for kw in sensitive_keywords if kw in desc_lower]
        if hits:
            findings.append({
                "finding_type": "github_sensitive_description",
                "severity": "high",
                "details": {
                    "issue": f"GitHub repo with sensitive keywords in description: {name}",
                    "repo": name,
                    "keywords_found": hits,
                    "description": desc[:200],
                    "url": repo.get("html_url", ""),
                },
            })

    return findings


def scan_subdomains(domain):
    """
    Probe common subdomains for exposed services.
    Uses DNS resolution (socket.getaddrinfo).
    Returns list of finding dicts.
    """
    findings = []
    exposed = []

    for sub in SUBDOMAIN_WORDLIST:
        fqdn = f"{sub}.{domain}"
        try:
            socket.getaddrinfo(fqdn, 443, socket.AF_INET, socket.SOCK_STREAM)
            # Subdomain resolves — check if it serves HTTP
            try:
                url = f"https://{fqdn}"
                req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req, timeout=4) as resp:
                    exposed.append({
                        "subdomain": fqdn,
                        "status": resp.status,
                        "type": sub,
                    })
            except urllib.error.HTTPError as e:
                # 401/403 = exists but protected (less concerning)
                # 200/301/302 = open
                if e.code not in (401, 403):
                    exposed.append({
                        "subdomain": fqdn,
                        "status": e.code,
                        "type": sub,
                    })
            except Exception:
                pass
        except (socket.gaierror, socket.timeout, OSError):
            pass  # Subdomain doesn't resolve — good

    # Only report admin/sensitive subdomains
    sensitive_types = {
        "admin", "panel", "dashboard", "console", "manage", "cpanel", "webadmin",
        "internal", "intranet", "corp", "private",
        "jenkins", "ci", "cd", "deploy", "drone", "argo", "harbor", "registry",
        "grafana", "kibana", "elastic", "prometheus", "sentry", "nagios", "zabbix", "splunk",
        "db", "mysql", "postgres", "postgresql", "mongo", "mongodb", "redis", "phpmyadmin", "pgadmin", "adminer",
        "backup", "bak", "old", "legacy", "archive",
        "git", "gitlab", "bitbucket",
        "vpn", "rdp", "ssh", "bastion", "jump",
        "minio", "s3", "ftp",
        "sso", "auth", "ldap", "ad", "oauth", "idp",
        "staging", "test", "qa", "uat", "sandbox", "preprod",
    }
    sensitive_exposed = [s for s in exposed if s["type"] in sensitive_types]

    if sensitive_exposed:
        findings.append({
            "finding_type": "subdomains_sensitive_exposed",
            "severity": "high",
            "details": {
                "issue": f"Sensitive subdomains exposed: {', '.join(s['subdomain'] for s in sensitive_exposed)}",
                "subdomains": sensitive_exposed,
                "count": len(sensitive_exposed),
            },
        })

    if len(exposed) > 10:
        findings.append({
            "finding_type": "subdomains_excessive",
            "severity": "medium",
            "details": {
                "issue": f"{len(exposed)} subdomains resolved and serve HTTP",
                "count": len(exposed),
                "sample": [s["subdomain"] for s in exposed[:10]],
            },
        })

    return findings


def run(targets):
    """
    Main entry point: scan all targets for vulnerabilities.

    Args:
        targets: List of dicts with 'domain', 'company_name', 'industry'

    Returns:
        List of finding dicts with domain, company_name, finding_type,
        severity, details, raw_data, scanned_at
    """
    print("[nrs_scanner] Iniciando scan de seguridad...")
    all_findings = []

    for target in targets:
        domain = target["domain"]
        company = target.get("company_name", domain)
        industry = target.get("industry", "unknown")

        print(f"\n  [nrs_scanner] Scanning {company} ({domain})...")
        target_findings = []

        # Run all scan modules
        print(f"    SSL...")
        target_findings.extend(scan_ssl(domain))

        print(f"    Headers...")
        target_findings.extend(scan_headers(domain))

        print(f"    DNS...")
        target_findings.extend(scan_dns(domain))

        print(f"    GitHub...")
        target_findings.extend(scan_github(company))

        print(f"    Subdomains...")
        target_findings.extend(scan_subdomains(domain))

        # Enrich each finding with target metadata
        for f in target_findings:
            f["domain"] = domain
            f["company_name"] = company
            f["industry"] = industry
            f["scanned_at"] = datetime.now(timezone.utc).isoformat()
            f["raw_data"] = json.dumps(f.get("details", {}))

        all_findings.extend(target_findings)
        print(f"    Found {len(target_findings)} signal(s)")

        time.sleep(1)  # Rate limit courtesy between targets

    # Sort by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    all_findings.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 4))

    print(f"\n[nrs_scanner] Total: {len(all_findings)} findings across {len(targets)} targets")
    return all_findings


if __name__ == "__main__":
    # Test with a single domain
    test_targets = [
        {"domain": "apap.com.do", "company_name": "APAP", "industry": "banking"},
    ]
    results = run(test_targets)
    for r in results:
        print(f"  [{r['severity'].upper()}] {r['company_name']}: {r['finding_type']} — {r['details'].get('issue', '')[:80]}")

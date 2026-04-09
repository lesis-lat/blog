# Security Assessment Report

## Executive Summary

**Target:** https://blog.lesis.lat
**Assessment Date:** 2026-04-09
**Scope:** Authentication, Authorization, XSS, SQL and Command Injection, SSRF testing

### Summary by Vulnerability Type

**Authentication Vulnerabilities:**
No authentication vulnerabilities were found. The application is a fully static Jekyll blog with no authentication system, no user accounts, no session management, and no authentication endpoints. There are no authentication mechanisms to exploit.

**Authorization Vulnerabilities:**
No authorization vulnerabilities were found. The application is a static site with no role hierarchy, no access controls, and no server-side authorization logic. All content is publicly accessible by design, with no user-specific resources or permission enforcement.

**Cross-Site Scripting (XSS) Vulnerabilities:**
No exploitable XSS vulnerabilities were found. While seven code-level XSS patterns were identified in the codebase (unescaped Liquid variables in JavaScript contexts, unsanitized innerHTML assignments, and unescaped author data), all identified patterns require repository write access to exploit. No runtime user-controlled input reaches any vulnerable sink through the public application interface.

**SQL/Command Injection Vulnerabilities:**
No SQL or command injection vulnerabilities were found. The application's fully static architecture eliminates all server-side injection attack surfaces. There is no database, no server-side runtime execution, no shell command processing, and no template evaluation occurring during HTTP request handling.

**Server-Side Request Forgery (SSRF) Vulnerabilities:**
No SSRF vulnerabilities were found. The application contains no server-side HTTP client and no server-side request processing. All outbound requests are client-side browser requests to hardcoded, legitimate third-party services (Kit.com, Google Analytics, applause-button.com).

---

## Network Reconnaissance

### Open Ports & Services

- **Port 443 (HTTPS):** Primary application port. HTTP/2 enforced. Cloudflare CDN edge.
- **Port 80 (HTTP):** Redirects to HTTPS via 301 at Cloudflare edge. No plaintext traffic fallback.
- **No additional exposed ports:** Static hosting model; no SSH, FTP, admin interfaces, or management ports exposed.

### CDN & Infrastructure Stack

- **Cloudflare Edge:** Provides DDoS protection, HTTP/2 enforcement, HSTS header delivery, and RUM telemetry.
- **Fastly/Varnish Layer:** Secondary CDN layer; caches static assets with `max-age=600` (10 minutes). Identified via `x-fastly-request-id` and `via: 1.1 varnish` headers.
- **GitHub Pages Origin:** Static file hosting; serves pre-built Jekyll `_site/` directory. No custom server-side code execution.

### Security Headers Assessment

**Present & Enforced:**
- **HSTS:** `max-age=2592000; includeSubDomains; preload` — Delivered via CDN HTTP header (30-day enforcement, includes subdomains, preload list eligible).
- **X-Content-Type-Options:** `nosniff` — Prevents MIME-type sniffing attacks.

**Security Concerns:**
- **Wildcard CORS:** `Access-Control-Allow-Origin: *` — All responses allow cross-origin resource sharing from any origin. Increases XSS impact if exploitation occurs.
- **Missing X-Frame-Options:** No `X-Frame-Options` or `frame-ancestors` CSP directive. All pages can be embedded in iframes (clickjacking risk, though impact limited on static content).
- **Missing Referrer-Policy:** Full URL referrer sent by default; no privacy protection.
- **Missing Permissions-Policy:** No control over browser features (geolocation, microphone, camera).
- **Ineffective CSP on Home Page:** `<meta http-equiv="Content-Security-Policy">` tag injects policy with `'unsafe-inline'`, rendering it ineffective for XSS protection.
- **No CSP on Post Pages:** Post pages, about pages, and 404 page have zero Content-Security-Policy coverage. Inline scripts and external scripts execute unrestricted.

### Identified Subdomains

- **blog.lesis.lat** — Primary target (static blog).
- **lesis.lat** — Main company website (out of scope).
- **api.applause-button.com** — Third-party engagement widget service (out of scope).
- **app.kit.com** — Third-party newsletter subscription service (out of scope).

### Third-Party Service Integrations

- **Kit.com (ConvertKit):** Newsletter subscription form. Collects email addresses. Endpoint: `https://app.kit.com/forms/9200442/subscriptions`.
- **applause-button.com:** Engagement tracking widget. Receives page URLs. Endpoints: `/get-claps?url=`, `/update-claps?url=`.
- **Google Analytics / Google Tag Manager:** GA4 and Universal Analytics. Collects pageview, device, referrer, User-Agent data. Loaded unconditionally without SRI (Subresource Integrity).

### Summary

The target application is a fully static Jekyll blog with no server-side runtime, no database, and no authentication system. The dual CDN stack (Cloudflare + Fastly) provides good transport security (HTTPS enforcement, HSTS) but lacks comprehensive security header coverage (missing X-Frame-Options, Referrer-Policy, Permissions-Policy, and effective CSP). The wildcard CORS policy increases the blast radius of any successful XSS exploitation. From an application architecture perspective, the static site model eliminates entire classes of vulnerabilities (SQLi, command injection, authentication bypass, SSRF) but does not provide strong client-side XSS defenses.

---

*End of Security Assessment Report*

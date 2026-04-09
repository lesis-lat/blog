# Reconnaissance Deliverable: blog.lesis.lat

## 0) HOW TO READ THIS

This reconnaissance report provides a comprehensive map of the application's attack surface for blog.lesis.lat, a static Jekyll blog operated by LESIS (Laboratory of Engineering Studies in Information Security).

**Key Sections for Authorization Analysis:**
- **Section 4 (API Endpoint Inventory):** This is a static site with no authentication — all endpoints/pages are publicly accessible. No authorization controls exist.
- **Section 6.4 (Guards Directory):** No authentication or authorization guards exist in the application itself; CDN-level controls only.
- **Section 7 (Role & Privilege Architecture):** No role system exists — single anonymous access tier.
- **Section 8 (Authorization Vulnerability Candidates):** N/A for traditional authz testing; focus shifts to client-side and third-party trust boundary abuse.

**How to Use the Network Mapping (Section 6):** The entity/flow mapping shows system boundaries between the static site, CDN layers, and third-party external services. Pay special attention to flows to external third-party services (Kit.com, applause-button.com) and the wildcard CORS policy.

**Priority Order for Testing:** Start with Section 5's XSS input vectors (innerHTML sinks, unescaped Liquid template variables in JavaScript event handlers), then Section 9 for injection sources. Authorization testing is not applicable. Focus on client-side trust boundary violations, third-party supply chain risks, and CORS exploitation.

---

## 1. Executive Summary

**blog.lesis.lat** is the public-facing publication platform for LESIS (Laboratory of Engineering Studies in Information Security), a Brazilian cybersecurity research organization. The application is a **fully static Jekyll 4.4.x blog** hosted on **GitHub Pages** as the origin, fronted by a **dual CDN stack** consisting of **Fastly** (with Varnish cache) and **Cloudflare** (providing DDoS protection, RUM telemetry, and edge caching).

As a static site, the application has **no server-side dynamic processing, no database, no authentication system, and no backend API**. All HTML is pre-rendered at build time from Markdown source files. This architecture eliminates entire classes of server-side vulnerabilities (SQLi, command injection, SSRF, authentication bypass, session hijacking). However, the client-side JavaScript and third-party service integrations constitute a meaningful attack surface.

**Core attack surface components:**
- Client-side JavaScript sinks (innerHTML in `post-toc.js`, unescaped Liquid variables in `onclick` event handlers)
- Third-party integrations: Kit.com newsletter (PII collection), applause-button.com (engagement tracking), Google Analytics GA4
- Wildcard CORS policy (`Access-Control-Allow-Origin: *`) delivered by the CDN
- Ineffective Content-Security-Policy (delivered via JavaScript-injected meta tags with `unsafe-inline` directives)
- Missing security headers: no `X-Frame-Options`, no `Referrer-Policy`, no `Permissions-Policy`, no real CSP
- Multilingual content in Portuguese (default), English (`/en/`), and Spanish (`/es/`)

---

## 2. Technology & Service Map

- **Frontend:** Jekyll 4.4.x static site generator; Minima 2.5.2 theme; Kramdown 2.5.2 Markdown parser with GFM; Rouge 4.7.0 syntax highlighting; Sass via jekyll-sass-converter 3.1.0; custom JavaScript (home-search.js, post-toc.js, securityHeaders.js); third-party applause-button.js (~29.5KB minified)
- **Backend:** None — fully static site, no server-side processing at request time. Ruby 3.2.0 / Jekyll used only at build time.
- **Infrastructure:**
  - **Origin:** GitHub Pages (identified via `x-github-request-id` response header)
  - **CDN Layer 1:** Fastly with Varnish cache (identified via `via: 1.1 varnish` and `x-fastly-request-id` headers; `x-served-by: cache-gig2250025-GIG`)
  - **CDN Layer 2:** Cloudflare (identified via `server: cloudflare`, `cf-ray`, `cf-cache-status` headers, and `/cdn-cgi/rum?` RUM endpoint)
  - **Protocol:** HTTP/2 enforced; HSTS with `max-age=2592000; includeSubDomains; preload` (delivered via CDN HTTP headers)
  - **Database:** None
- **Third-Party Services:**
  - Kit.com (ConvertKit) — newsletter subscription PII collection
  - api.applause-button.com — engagement tracking widget (minified, unauditable JS)
  - Google Tag Manager / Google Analytics GA4 (`G-BF7S2MHBGH`) + Universal Analytics (`UA-167519399-1`)
  - Cloudflare Network Error Logging (NEL)
- **Identified Subdomains:**
  - `blog.lesis.lat` — primary target (static blog)
  - `lesis.lat` — main company website (linked from footer; out of scope)
  - `api.applause-button.com` — third-party service (out of scope)
  - `app.kit.com` — third-party service (out of scope)
- **Open Ports & Services:**
  - `:443` — HTTPS (Cloudflare edge, HTTP/2) — primary application port
  - `:80` — HTTP (redirects to HTTPS via CDN)
  - No additional ports exposed (static hosting; no SSH, FTP, or management ports)

---

## 3. Authentication & Session Management Flow

**No authentication or session management exists in this application.** The site is a fully public static blog with no login forms, no user registration, no password handling, no JWT tokens, no OAuth flows, no API keys for access control, and no session management. All pages are publicly accessible without any authentication requirement.

- **Entry Points:** None — no login, register, or auth endpoints exist
- **Mechanism:** N/A
- **Code Pointers:** N/A

### 3.1 Role Assignment Process

**No role assignment exists.** The application has a single access tier: anonymous public visitor.

- **Role Determination:** N/A
- **Default Role:** Anonymous (all visitors)
- **Role Upgrade Path:** N/A
- **Code Implementation:** N/A

### 3.2 Privilege Storage & Validation

**No privilege storage or validation exists.**

- **Storage Location:** N/A
- **Validation Points:** N/A
- **Cache/Session Persistence:** No session state; only third-party analytics cookies (Google Analytics `_ga`, `_gid`) may be set
- **Code Pointers:** N/A

### 3.3 Role Switching & Impersonation

**No role switching or impersonation features exist.**

- **Impersonation Features:** None
- **Role Switching:** None
- **Audit Trail:** None (no application-level logging)
- **Code Implementation:** N/A

---

## 4. API Endpoint Inventory

**Network Surface Focus:** All pages are statically generated and publicly accessible. The only dynamic interactions are client-side JavaScript operations and third-party external API calls initiated from the browser. No server-side API endpoints exist.

### Static Pages (Network-Accessible)

| Method | Endpoint Path | Required Role | Object ID Parameters | Authorization Mechanism | Description & Code Pointer |
|--------|--------------|--------------|---------------------|------------------------|---------------------------|
| GET | `/` | anon | None | None | Portuguese home page with post list and search. `_layouts/home.html` |
| GET | `/en/` | anon | None | None | English home page with post list. `en/index.md` + `_layouts/home.html` |
| GET | `/es/` | anon | None | None | Spanish home page with post list. `es/index.md` + `_layouts/home.html` |
| GET | `/about.html` | anon | None | None | Portuguese about page. `about.md` + `_layouts/default.html` |
| GET | `/en/about.html` | anon | None | None | English about page. `en/about.md` |
| GET | `/es/about.html` | anon | None | None | Spanish about page. `es/about.md` |
| GET | `/feed.xml` | anon | None | None | RSS/Atom feed (Atom 1.0). Generated by jekyll-feed plugin. Contains full post content. `Content-Type: application/xml` |
| GET | `/pesquisa/2026/02/08/vulnerability-price.html` | anon | None | None | PT blog post. `_layouts/post.html` — includes newsletter form + share buttons |
| GET | `/guias/2026/01/15/considerations-for-writing-security-reports.html` | anon | None | None | PT blog post. `_layouts/post.html` |
| GET | `/comunidade/2026/01/14/commitiment-to-strengthening-community.html` | anon | None | None | PT blog post. `_layouts/post.html` |
| GET | `/comunidade/2025/11/30/sposoring-events.html` | anon | None | None | PT blog post. `_layouts/post.html` |
| GET | `/vulnerabilidade/2025/10/04/rocking-gift-card.html` | anon | None | None | PT blog post. `_layouts/post.html` |
| GET | `/research/2026/02/08/vulnerability-price-en.html` | anon | None | None | EN blog post. `_layouts/post.html` |
| GET | `/investigacion/2026/02/08/vulnerability-price-es.html` | anon | None | None | ES blog post. `_layouts/post.html` |
| GET | `/<any-path>` | anon | None | None | 404 page with client-side redirect logic. `404.html` |

### Third-Party External API Calls (Initiated from Browser)

| Method | External Endpoint | Triggered By | User Input | Description |
|--------|------------------|-------------|-----------|-------------|
| POST | `https://app.kit.com/forms/9200442/subscriptions` | Newsletter form submit | Email address | Email newsletter subscription. `_layouts/post.html` lines 110-114 |
| GET | `https://api.applause-button.com/get-claps?url=<PAGE_URL>` | Page load | None (build-time page URL) | Fetch clap count for page. `assets/applause-button.js` |
| POST | `https://api.applause-button.com/update-claps?url=<PAGE_URL>` | Applause button click | None (build-time page URL) | Increment clap count. `assets/applause-button.js` |
| GET | `https://www.googletagmanager.com/gtag/js?id=G-BF7S2MHBGH` | Page load | None | Load Google Analytics GA4 script. `_includes/footer.html` line 47 |
| POST | `https://www.google-analytics.com/g/collect` | Page load / engagement | Pageview, device, referrer | GA4 analytics collection. Initiated by GTM script |
| POST | `https://www.google-analytics.com/j/collect` | Page load | Pageview, device, UA | Universal Analytics (UA-167519399-1) collection |
| POST | `https://blog.lesis.lat/cdn-cgi/rum?` | Page load | Network timing data | Cloudflare Real User Monitoring telemetry |

---

## 5. Potential Input Vectors for Vulnerability Analysis

**Network Surface Focus:** Only input vectors reachable through the deployed application's network interface are listed. All vectors are client-side (browser-executed) since there is no server-side processing.

### URL Parameters

- **`window.location.pathname`** — Read by `404.html` (lines 25-85) to perform client-side redirects. The pathname is used as a dictionary key lookup against a build-time hardcoded redirect map. Not directly writable to DOM, but drives `window.location.replace()` navigation.
- **URL hash/fragment** — Not directly consumed by application code (no fragment-based routing observed).

### POST Body Fields (Form Submissions)

- **`email_address`** (type: email, required) — Newsletter subscription form. `_layouts/post.html` lines 57-70 (form HTML), lines 110-114 (JavaScript fetch handler). Submitted as `FormData` via `fetch()` with `mode: 'no-cors'` to `https://app.kit.com/forms/9200442/subscriptions`. Only HTML5 `type="email"` and `required` attribute validation applied client-side. **No server-side validation by the application** (Kit.com handles server-side).

### HTTP Headers

- **`User-Agent`** — Transmitted to Google Analytics (GA4 and UA). Not consumed by application code, but forwarded to third-party analytics.
- **`Referer`** — Transmitted to Google Analytics. No `Referrer-Policy` header set — full URL referrer sent by default.

### Cookie Values

- **No application-set cookies.** Third-party cookies only:
  - `_ga`, `_ga_BF7S2MHBGH` — Google Analytics GA4 persistence cookies (set by GTM script)
  - `_gid` — Google Analytics session cookie
  - These cookies are set by third-party scripts and not consumed by application code.

### JavaScript-Consumed Inputs (Indirect Attack Vectors)

- **Search input** (`id="home-post-search"`, type="search") — `assets/home-search.js` lines 52-60. Input is normalized via `normalizeText()` (lowercase, diacritics stripped) and used only for string comparison. **No DOM write of user input.** Safe pattern — uses `element.hidden` toggle only.
- **Category filter buttons** — `_layouts/home.html` lines 37-55. Category data read from `data-category` attributes (build-time values). Client-side toggling only.
- **`applause-button` `api` attribute** — `_includes/share-buttons.html` line 45. The `api` attribute on the `<applause-button>` web component can override the default `api.applause-button.com` endpoint. If DOM clobbering or attribute injection were possible, this could redirect POST requests to an attacker-controlled endpoint.

### Build-Time Author/Content Variables (Stored Input Vectors)

These are not runtime user inputs but represent stored content that flows into security-sensitive sinks. If the Jekyll build pipeline accepts untrusted post front matter or content, these become injection vectors:

- **`page.title`** — Injected unescaped into JavaScript `onclick` string context in share buttons. `_includes/share-buttons.html` line 36. **Critical stored XSS vector.**
- **`page.image`** — Injected unescaped into JavaScript `onclick` string context for Pinterest share. `_includes/share-buttons.html` line 40.
- **`page.author`** — Injected unescaped as raw HTML in post layout. `_layouts/post.html` line 29.
- **`include.author.linkedin`** — Injected unescaped into `href` attribute. `_includes/author.html` line 8. `javascript:` URL possible.
- **`include.author.image`** — Injected unescaped into CSS `url()` in inline style. `_includes/author.html` line 3. CSS injection possible.
- **`include.author.name`**, **`include.author.description`** — Injected as raw HTML. `_includes/author.html` lines 8, 10.
- **`category`** (post front matter) — Injected unescaped into `data-category` attribute and as HTML text. `_layouts/home.html` lines 42, 44, 61.
- **`.section-footer-note` content** — Blog post HTML content from Markdown. Re-inserted via `innerHTML` in `assets/post-toc.js` lines 188-196 and line 204 without sanitization.

---

## 6. Network & Interaction Map

### 6.1 Entities

| Title | Type | Zone | Tech | Data | Notes |
|-------|------|------|------|------|-------|
| UserBrowser | Identity | Internet | Browser (Chrome/Firefox/Safari) | Public | Visitor accessing the blog |
| CloudflareEdge | ExternAsset | Edge | Cloudflare (HTTP/2, CDN, RUM, NEL) | Public | Outermost edge; provides DDoS protection, RUM telemetry, edge caching |
| FastlyCDN | ExternAsset | Edge | Fastly + Varnish cache | Public | CDN layer; caches static assets with `max-age=600`; `x-fastly-request-id` present |
| GitHubPages | Service | App | GitHub Pages (static file hosting) | Public | Origin server; serves pre-built Jekyll `_site/` directory; `x-github-request-id` present |
| StaticSite | Service | App | Jekyll 4.4.x / Ruby 3.2.0 (build-time only) | Public | Static HTML/CSS/JS files; NO runtime server-side processing |
| KitCom | ThirdParty | ThirdParty | ConvertKit/Kit.com SaaS | PII | Email newsletter subscription service; receives email addresses |
| ApplauseButtonAPI | ThirdParty | ThirdParty | api.applause-button.com (REST API) | Public | Engagement tracking; receives page URLs; minified JS with full DOM access |
| GoogleAnalytics | ThirdParty | ThirdParty | Google Tag Manager + GA4 + UA | PII | Analytics; receives page views, IP, device, referrer, user agent |
| CloudflareRUM | ThirdParty | ThirdParty | Cloudflare RUM (`/cdn-cgi/rum?`) | Public | Real User Monitoring telemetry endpoint |

### 6.2 Entity Metadata

| Title | Metadata Key: Value |
|-------|-------------------|
| CloudflareEdge | Hosts: `blog.lesis.lat:443`; Headers: `server: cloudflare`, `cf-ray`, `cf-cache-status`; Features: DDoS mitigation, HTTP/2, NEL reporting; CORS: `Access-Control-Allow-Origin: *` (wildcard) |
| FastlyCDN | Hosts: edge cache; Headers: `x-fastly-request-id`, `x-served-by: cache-gig*`, `via: 1.1 varnish`; Cache-Control: `max-age=600`; `x-cache: HIT/MISS` |
| GitHubPages | Hosts: GitHub Pages origin; Headers: `x-github-request-id`; TLS: Let's Encrypt; HSTS: `max-age=2592000; includeSubDomains; preload` (CDN-delivered); `x-content-type-options: nosniff` |
| StaticSite | Build: Jekyll 4.4.x, Ruby 3.2.0, Minima 2.5.2; Pages: 18+ static HTML files; Languages: PT (default), EN (`/en/`), ES (`/es/`); Feed: `/feed.xml` (Atom 1.0); No runtime backend |
| KitCom | Endpoint: `https://app.kit.com/forms/9200442/subscriptions`; Form ID: `9200442` (public); Data: email addresses; Mode: `fetch()` with `mode: 'no-cors'`; No CSRF token |
| ApplauseButtonAPI | Endpoints: `/get-claps?url=`, `/update-claps?url=`; JS: `assets/applause-button.js` (~29.5KB minified, no SRI); Version: 3.3.0; Overridable via `api` HTML attribute |
| GoogleAnalytics | GA4 ID: `G-BF7S2MHBGH`; UA ID: `UA-167519399-1`; Script: `https://www.googletagmanager.com/gtag/js`; No SRI; No cookie consent; Loaded unconditionally in `_includes/footer.html` lines 47-53 |
| CloudflareRUM | Endpoint: `https://blog.lesis.lat/cdn-cgi/rum?`; Returns: 204; Sends: network timing, errors |

### 6.3 Flows (Connections)

| FROM → TO | Channel | Path/Port | Guards | Touches |
|-----------|---------|-----------|--------|---------|
| UserBrowser → CloudflareEdge | HTTPS | `:443 /*` | None | Public |
| CloudflareEdge → FastlyCDN | HTTPS | `:443 /*` | None | Public |
| FastlyCDN → GitHubPages | HTTPS | `:443 /*` | None | Public |
| GitHubPages → FastlyCDN | HTTPS | Response | None | Public |
| UserBrowser → KitCom | HTTPS | `app.kit.com:443 /forms/9200442/subscriptions` | None (no-cors mode) | PII (email) |
| UserBrowser → ApplauseButtonAPI | HTTPS | `api.applause-button.com:443 /get-claps` | None | Public (page URL) |
| UserBrowser → ApplauseButtonAPI | HTTPS | `api.applause-button.com:443 /update-claps` | None | Public (page URL) |
| UserBrowser → GoogleAnalytics | HTTPS | `googletagmanager.com:443`, `google-analytics.com:443` | None | PII (IP, device, referrer) |
| UserBrowser → CloudflareRUM | HTTPS | `blog.lesis.lat:443 /cdn-cgi/rum?` | None | Public (timing data) |

### 6.4 Guards Directory

| Guard Name | Category | Statement |
|-----------|----------|-----------|
| None | N/A | No authentication or authorization guards exist in this application. All content is publicly accessible. |
| hsts:cdn | Protocol | HSTS (`max-age=2592000; includeSubDomains; preload`) delivered via CDN HTTP header — forces HTTPS for all subsequent requests |
| x-content-type-options | Protocol | `nosniff` header prevents MIME-type sniffing attacks — delivered via CDN |
| cors:wildcard | Network | `Access-Control-Allow-Origin: *` — Wildcard CORS allows any origin to make cross-origin requests and read responses. Applies to all static assets. |
| csp:meta-ineffective | Protocol | CSP attempted via JavaScript-injected `<meta http-equiv="Content-Security-Policy">` tag in `securityHeaders.js`. Contains `'unsafe-inline'` and `'unsafe-eval'`. Loaded only on home layout; absent on post pages, about pages, and 404. Effectively provides no XSS protection. |
| no-csp:posts | Protocol | No Content-Security-Policy on post pages, about pages, or 404 page. All inline scripts and external scripts execute unrestricted. |
| no-xfo | Protocol | No `X-Frame-Options` or `frame-ancestors` CSP directive on any page. All pages can be embedded in iframes (clickjacking risk). |
| cache:cdn | Network | Static assets cached by Fastly/Cloudflare with `max-age=600` (10 minutes). Ensures fast delivery but limits ability to push emergency updates. |

---

## 7. Role & Privilege Architecture

### 7.1 Discovered Roles

| Role Name | Privilege Level | Scope/Domain | Code Implementation |
|----------|----------------|-------------|-------------------|
| anon | 0 | Global | All pages publicly accessible; no authentication required; no role checks implemented |

### 7.2 Privilege Lattice

```
Privilege Ordering:
anon (only tier — all visitors are equal)

No role hierarchy exists. No privilege escalation paths exist within the application.
```

**Note:** No role switching, impersonation, or sudo mode exists. The only "privileged" actions (publishing blog posts) occur via git push to the repository — completely outside the running application's network interface.

### 7.3 Role Entry Points

| Role | Default Landing Page | Accessible Route Patterns | Authentication Method |
|------|--------------------|--------------------------|--------------------|
| anon | `/` | `/*` (all pages) | None — no authentication |

### 7.4 Role-to-Code Mapping

| Role | Middleware/Guards | Permission Checks | Storage Location |
|------|-----------------|-------------------|----------------|
| anon | None | None | N/A |

---

## 8. Authorization Vulnerability Candidates

### 8.1 Horizontal Privilege Escalation Candidates

**None.** No user-specific data, object IDs, or ownership concepts exist in this application. All content is equally public. No IDOR attack surface exists.

### 8.2 Vertical Privilege Escalation Candidates

**None.** No privileged endpoints or admin interfaces exist in this application. No role hierarchy to escalate through.

### 8.3 Context-Based Authorization Candidates

**None applicable via standard authz testing.** However, the following client-side workflow assumption violations are relevant:

| Workflow | Endpoint | Expected Prior State | Bypass Potential |
|---------|---------|---------------------|-----------------|
| Newsletter Subscription | `https://app.kit.com/forms/9200442/subscriptions` (POST) | Valid email input in form | Direct POST with arbitrary email/data; no CSRF token; `mode: 'no-cors'` — third-party controls server-side validation |
| Applause Button Click | `https://api.applause-button.com/update-claps?url=<PAGE_URL>` | User clicked applause button | Direct POST to API with arbitrary `url` parameter — clap count manipulation |

---

## 9. Injection Sources

### 9.1 XSS Injection Sources (Client-Side)

**Source 1: Unescaped `page.title` in JavaScript `onclick` String Context — CRITICAL**
- **File:** `_includes/share-buttons.html`, line 36
- **Sink Type:** JavaScript string literal within HTML `onclick` event handler attribute
- **Code:** `onclick="window.open('https://www.linkedin.com/shareArticle?mini=false&url={{ site.url }}{{ pageurl }}&title={{page.title}}&summary=&source=');"`
- **Input Source:** Post front matter `title` field in Markdown files (e.g., `_posts/portuguese/*.md`)
- **Dangerous Sink:** `window.open()` called from `onclick` attribute; if `page.title` breaks out of the JS string (e.g., `');alert(1)//`), arbitrary JS executes
- **Filters Applied:** NONE — `{{page.title}}` has no Liquid escape filter
- **Data Flow:** Post Markdown front matter → Jekyll build → rendered HTML `onclick` attribute → browser executes on button click
- **Exploitability:** Requires ability to commit malicious post front matter. Results in stored XSS on all post pages with share buttons.

**Source 2: `note.innerHTML` Re-inserted via `innerHTML` — Medium**
- **File:** `assets/post-toc.js`, lines 188-196 (primary sink) and line 204 (secondary sink)
- **Sink Type:** `element.innerHTML` assignment
- **Code:**
  ```javascript
  sideItem.innerHTML = '<p class="post-side-note-title">' + noteLabel + ' ' + noteIndex + '</p>' +
    '<div class="post-side-note-content">' + note.innerHTML + '</div>';
  // (line 204)
  footerContent.innerHTML = note.innerHTML;
  ```
- **Input Source:** `.section-footer-note` elements in rendered blog post HTML content
- **Data Flow:** Post Markdown content → Jekyll Kramdown parsing → rendered HTML → DOM element → `note.innerHTML` read → `innerHTML` assigned without sanitization
- **Exploitability:** Requires ability to include raw HTML in a blog post with `.section-footer-note` class containing event handler attributes (e.g., `<img src=x onerror="alert(1)">`). Kramdown with GFM input may allow raw HTML blocks.

**Source 3: `include.author.linkedin` in `href` attribute — Medium**
- **File:** `_includes/author.html`, line 8
- **Sink Type:** HTML `href` attribute — `javascript:` URL injection possible
- **Code:** `href="https://www.linkedin.com/in/{{ include.author.linkedin }}"`
- **Input Source:** `linkedin` field in `_data/authors.yml` or post front matter `author` definition
- **Filters Applied:** NONE
- **Data Flow:** Author data YAML → Jekyll template → rendered HTML `href` → browser navigates on click

**Source 4: `include.author.image` in CSS `url()` — Low-Medium**
- **File:** `_includes/author.html`, line 3
- **Sink Type:** CSS `url()` within inline `style` attribute
- **Code:** `style="background: url('/assets/authors/{{ include.author.image }}');"`
- **Input Source:** `image` field in author data
- **Filters Applied:** NONE

**Source 5: Unescaped Liquid variables in Pinterest/Email share buttons — Low**
- **File:** `_includes/share-buttons.html`, lines 40, 42
- **Pinterest:** `onclick="window.open('https://pinterest.com/pin/create/button/?url=&media={{ site.url }}{{ page.image }}&description=');"`
- **Email:** `onclick="window.open('mailto:?&body={{ site.url }}{{ pageurl }}');"`
- **Input Source:** `page.image` from post front matter; `pageurl` from post URL
- **Filters Applied:** NONE

### 9.2 SSRF/Request Forgery Sources (Client-Side)

**No traditional server-side SSRF exists.** Client-side request manipulation only:

**Source 1: Newsletter Form Action URL — Low**
- **File:** `_layouts/post.html`, lines 110-114
- **Code:** `fetch(form.action, { method: 'POST', mode: 'no-cors', body: formData })`
- **Input:** `form.action` is read from the DOM form element's `action` attribute (hardcoded to Kit.com URL). If DOM manipulation could modify this attribute at runtime, the fetch target could be redirected to an attacker-controlled endpoint. `mode: 'no-cors'` prevents reading the response but allows the request.
- **Exploitability:** Requires prior XSS or DOM clobbering to change `form.action`

**Source 2: Applause Button `api` Attribute Override — Low**
- **File:** `_includes/share-buttons.html`, line 45; `assets/applause-button.js`
- **Code:** `<applause-button ... url="{{ page.url | relative_url }}"/>`
- **Input:** The `api` HTML attribute on the `<applause-button>` element can override the default `api.applause-button.com` API endpoint. The widget reads this attribute and uses it as the base URL for both GET and POST requests.
- **Exploitability:** Requires ability to inject/modify the `api` attribute via prior XSS or template injection. Would redirect clap API calls (including POST with JSON body) to attacker endpoint.

### 9.3 Command Injection / SQL Injection / LFI / Path Traversal / SSTI / Deserialization

**None applicable.** This is a static site with no server-side runtime execution. No shell commands, database queries, file inclusion, template engine execution, or deserialization occur during request processing. All such operations occur only at build time in the local development environment (out of scope per scope boundaries).

---

*End of Reconnaissance Deliverable*

# Code Analysis Deliverable — blog.lesis.lat

**Target:** LESIS Blog (Laboratory of Engineering Studies in Information Security)
**Domain:** blog.lesis.lat
**Assessment Date:** 2026-04-09
**Analyst Role:** Pre-Recon Code Intelligence Gatherer

---

# Penetration Test Scope & Boundaries

**Primary Directive:** This analysis is strictly limited to the **network-accessible attack surface** of the application.

### In-Scope: Network-Reachable Components
- All statically generated public web pages served by the Jekyll site (blog posts, about pages, home pages in PT/EN/ES)
- The newsletter subscription form submitting to `https://app.kit.com/forms/9200442/subscriptions`
- Client-side JavaScript executing in the user's browser context (search, TOC, applause button, share buttons, analytics)
- The RSS/Atom feed generated at `/feed.xml`
- The custom 404 error page with client-side redirect logic
- Security headers delivered via client-side meta tags (`securityHeaders.js`)

### Out-of-Scope: Locally Executable Only
- Jekyll build process (`bundle exec jekyll build`) — build-time only
- Ruby/Bundler dependency management (`Gemfile`, `Gemfile.lock`) — local development tooling
- Local development server (WEBrick) — not deployed
- Git version control operations
- The `_site/` build output directory (git-ignored, not source of truth)
- `.jekyll-cache/` directory (build cache)

---

## 1. Executive Summary

The target application is a **static Jekyll blog** hosted at `blog.lesis.lat`, serving as the publication platform for LESIS (Laboratory of Engineering Studies in Information Security). The site is built with Jekyll 4.4.x using the Minima theme, generates static HTML/CSS/JS at build time, and is deployed via GitHub Pages. As a static site, it has **no server-side dynamic processing, no database, no authentication system, and no backend API**. This fundamentally limits the attack surface compared to dynamic web applications.

The most significant security concerns center around **client-side vulnerabilities and third-party integrations**. The site integrates with three external services: Kit.com (newsletter email collection), applause-button.com (engagement tracking), and Google Analytics (visitor tracking). The newsletter form collects user email addresses and submits them to Kit.com using `fetch()` with `mode: 'no-cors'`, which lacks CSRF protection. The applause button widget is a minified third-party JavaScript library that makes API calls to `api.applause-button.com`, presenting a supply chain risk that is difficult to audit.

From a defensive posture perspective, the site implements security headers (HSTS, CSP, X-Content-Type-Options) but critically delivers them via **client-side meta tags** rather than HTTP headers, significantly reducing their effectiveness. The CSP policy includes `'unsafe-inline'` and `'unsafe-eval'` directives that effectively neutralize XSS protection. There is a confirmed `innerHTML` sink in `post-toc.js` where blog post content is injected without sanitization, and the social share buttons use inline `onclick` handlers with Liquid-templated variables in a JavaScript string context, creating potential XSS vectors. Mixed HTTP/HTTPS usage in social share URLs (Facebook, Twitter) presents downgrade attack opportunities.

---

## 2. Architecture & Technology Stack

### Framework & Language
The application is built on **Jekyll 4.4.x**, a Ruby-based static site generator, running on **Ruby 3.2.0**. The theme is **Minima 2.5.2**, a minimal Jekyll theme that provides base layouts and includes. CSS is preprocessed with **Sass** via `jekyll-sass-converter 3.1.0`, markdown is parsed by **Kramdown 2.5.2** with GitHub Flavored Markdown (GFM) support, and syntax highlighting uses **Rouge 4.7.0**. Dependencies are managed via Bundler with a locked `Gemfile.lock`. The only Jekyll plugin is `jekyll-feed (~> 0.12)` for RSS/Atom feed generation; the `jekyll-seo-tag` plugin is included transitively through the Minima theme.

From a security perspective, the static site architecture means there is **no server-side code execution at request time**, no database queries, no session management, and no authentication logic. All content is pre-rendered at build time into static HTML files. This eliminates entire categories of server-side vulnerabilities (SQL injection, command injection, SSRF, authentication bypass). However, the client-side JavaScript introduces browser-based attack vectors. The site loads three custom JavaScript files (`home-search.js`, `post-toc.js`, `securityHeaders.js`) and one third-party minified library (`applause-button.js` at ~29.5KB minified), plus Google Analytics via Google Tag Manager.

### Architectural Pattern
The architecture follows the **JAMstack pattern** (JavaScript, APIs, Markup): pre-built markup served from a CDN/static host, enhanced with client-side JavaScript, and integrated with external APIs (Kit.com, applause-button.com, Google Analytics). The deployment target is **GitHub Pages** as indicated by the `CNAME` file mapping to `blog.lesis.lat`. Trust boundaries exist between the static site and each external service. The site supports **internationalization** with content in Portuguese (default), English, and Spanish, using `_data/translations.yml` for UI strings and separate post directories per language.

### Critical Security Components
- **Security Headers**: `securityHeaders.js` — delivers CSP, HSTS, X-Content-Type-Options via client-side meta tags
- **Newsletter Form**: `_layouts/post.html` — collects email, submits to Kit.com
- **Third-party Widget**: `assets/applause-button.js` — minified engagement tracking widget
- **Analytics**: `_includes/footer.html` — Google Analytics GA4 (G-BF7S2MHBGH)
- **Social Sharing**: `_includes/share-buttons.html` — inline onclick handlers with window.open()

---

## 3. Authentication & Authorization Deep Dive

### Authentication Mechanisms
**No authentication mechanisms exist in this application.** The site is a fully public static blog with no login forms, no user registration, no password handling, no JWT tokens, no OAuth flows, no API keys for access control, and no session management. All pages are publicly accessible without any authentication requirement. There are no authentication-related API endpoints (no login, logout, token refresh, or password reset endpoints).

### Session Management and Token Security
**No session management exists.** There are no session cookies, no cookie flags to configure (HttpOnly, Secure, SameSite), no session tokens, no localStorage/sessionStorage usage for session state, and no server-side session stores. The only cookies that may be set come from third-party services (Google Analytics) which are outside the application's direct control. The absence of session management means there are no session fixation, session hijacking, or session expiration vulnerabilities within the application itself.

### Authorization Model
**No authorization model exists.** All content is equally accessible to all visitors. There is no multi-tenancy, no role-based access control, no permission system, and no admin panel. The only "privileged" action is content creation, which occurs at build time through the git repository — not through the running application. There are no authorization bypass scenarios because there are no authorization checks to bypass.

### SSO/OAuth/OIDC Flows
**Not applicable.** No SSO, OAuth, or OIDC flows are implemented. No callback endpoints exist.

---

## 4. Data Security & Storage

### Database Security
**No database exists.** This is a static site with no database backend, no ORM, no SQL queries, and no data persistence layer within the application. All content is stored as static files (Markdown, YAML, HTML) in the git repository and rendered at build time.

### Data Flow Security
The application has three distinct data flows that transmit information to external services:

1. **Email Collection → Kit.com**: The newsletter form (`_layouts/post.html`, lines 57-127) collects the user's email address and submits it via `fetch()` POST to `https://app.kit.com/forms/9200442/subscriptions`. The submission uses `mode: 'no-cors'`, which means the browser cannot read the response but the request is sent. The email is transmitted as FormData over HTTPS (TLS encrypted in transit) but there is no client-side encryption, no CSRF token protection, and no rate limiting. The privacy statement is minimal: "We respect your privacy. Unsubscribe at any time." (line 20 of `_layouts/post.html`).

2. **Page Analytics → Google**: Google Analytics GA4 (`_includes/footer.html`, lines 47-53) collects page views, user agent, IP address, device information, referrer data, and interaction patterns. The tracking ID `G-BF7S2MHBGH` is public. There is no cookie consent banner, no analytics opt-out mechanism, and no GDPR compliance statements found in the codebase. A legacy Universal Analytics ID (`UA-167519399-1`) is also configured in `_config.yml` line 24.

3. **Engagement Tracking → Applause Button**: The applause button widget (`assets/applause-button.js`) communicates with `https://api.applause-button.com` via two endpoints: `/get-claps?url=<PAGE_URL>` and `/update-claps?url=<PAGE_URL>`. Page URLs are transmitted to this third-party service. The minified nature of the code (~29.5KB) makes it difficult to audit exactly what data is collected and transmitted.

### Multi-tenant Data Isolation
**Not applicable.** Single-tenant static site with no user data storage.

### Compliance Concerns
- No privacy policy document found in the repository
- No GDPR/CCPA compliance mechanisms
- No cookie consent management
- No data retention policies documented
- No data processing agreements referenced
- No `/.well-known/security.txt` file for vulnerability disclosure

---

## 5. Attack Surface Analysis

### External Entry Points (In-Scope, Network-Accessible)

**1. Newsletter Subscription Form**
- **Location:** `_layouts/post.html` (lines 57-70 for form, lines 79-127 for JavaScript handler)
- **Method:** POST to `https://app.kit.com/forms/9200442/subscriptions`
- **Input:** Email address field (`name="email_address"`, `type="email"`, required)
- **Security Concerns:**
  - No CSRF token protection — any site can craft a form that submits to this endpoint
  - `mode: 'no-cors'` fetch disables response inspection but allows the request
  - Only HTML5 `type="email"` and `required` validation on the input
  - No rate limiting visible in client-side code
  - Kit.com form ID `9200442` is publicly exposed

**2. Client-Side Search**
- **Location:** `_layouts/home.html` (lines 22-30), `assets/home-search.js` (81 lines)
- **Input:** Search text input (`id="home-post-search"`, `type="search"`)
- **Security:** Pure client-side filtering with safe DOM methods (no innerHTML, no network calls). Uses `textContent` for reading, `hidden` property and `classList` for toggling visibility. **Low risk.**

**3. Social Share Buttons**
- **Location:** `_includes/share-buttons.html` (lines 36-42)
- **Method:** `onclick` handlers with `window.open()`
- **Targets:** LinkedIn (HTTPS), Facebook (HTTP), Twitter (HTTP), Pinterest (HTTPS), Email (mailto:)
- **Security Concerns:**
  - Inline onclick handlers with Liquid-templated variables (`{{ site.url }}`, `{{ pageurl }}`, `{{ page.title }}`, `{{ page.image }}`) rendered into JavaScript string context
  - Mixed HTTP/HTTPS — Facebook and Twitter share URLs use `http://` instead of `https://`, enabling potential MITM on those share links
  - No URL encoding of parameters in share URLs

**4. Applause Button Widget**
- **Location:** `_includes/share-buttons.html` (line 45), loaded via `_includes/header.html` (lines 2-3)
- **API Endpoints:** `https://api.applause-button.com/get-claps` and `/update-claps`
- **Input:** Page URL passed as `url` attribute (`{{ page.url | relative_url }}`)
- **Security Concerns:**
  - Third-party minified JavaScript executes in the page context with full DOM access
  - The `api` attribute can override the default endpoint (potential abuse if attribute injection is possible)
  - No Subresource Integrity (SRI) hash on the script
  - Supply chain risk from unauditable minified code

**5. 404 Error Page with Redirect Logic**
- **Location:** `404.html` (lines 25-85)
- **Functionality:** Maps old URL patterns (`/YYYY/MM/DD/slug/`) to new blog post URLs using `window.location.replace()`
- **Input:** `window.location.pathname` (user-controlled URL path)
- **Security Concerns:**
  - Redirect targets are hardcoded from build-time post URLs (Jekyll-generated)
  - Uses `window.location.replace()` — if a post slug could be crafted to contain a `javascript:` protocol, it could lead to XSS (mitigated by build-time generation)
  - No protocol validation on target paths

**6. RSS/Atom Feed**
- **Location:** Generated by `jekyll-feed` plugin at `/feed.xml`
- **Security:** Auto-generated XML feed of blog content. Low risk as it's read-only output.

**7. Google Analytics**
- **Location:** `_includes/footer.html` (lines 47-53)
- **Script Source:** `https://www.googletagmanager.com/gtag/js?id=G-BF7S2MHBGH`
- **Data Sent:** Page views, user agent, referrer, device info, IP address
- **Security:** External script executing with full page context access

### Notable Out-of-Scope Components
- **Jekyll build process** (`Gemfile`, `Gemfile.lock`, Ruby toolchain) — local development/CI only
- **WEBrick development server** — not deployed in production
- **_site/ directory** — build output, git-ignored
- **_config.yml modifications** — require repository access, not network-accessible

### Input Validation Patterns
Input validation is minimal, consistent with a static site:
- Newsletter email: HTML5 `type="email"` and `required` attribute only
- Search: Client-side text normalization via `normalizeText()` function (accent-insensitive)
- No server-side input validation (no server-side processing)
- Liquid template filters: `| jsonify` used for safe JavaScript embedding in `post.html` (lines 80-88); `| cgi_escape | escape` used for social URLs in `social.html`

### Background Processing
**None.** No async jobs, no worker processes, no background task queues. All functionality is synchronous client-side JavaScript.

---

## 6. Infrastructure & Operational Security

### Secrets Management
No application secrets exist in the codebase. The following identifiers are present but are designed to be public:
- Google Analytics GA4 ID: `G-BF7S2MHBGH` (`_includes/footer.html`, line 52)
- Google Analytics UA ID: `UA-167519399-1` (`_config.yml`, line 24)
- Kit.com Form ID: `9200442` (`_layouts/post.html`, line 57)
- Contact email: `contact@lesis.lat` (`_config.yml`, line 8)
- Social media handles: `lesis-lat` (LinkedIn), `lesis_lat` (Twitter), `lesis.lat` (Instagram), `lesis-lat` (GitHub)

No private API keys, tokens, credentials, or environment variable references were found in any tracked file. Third-party service credentials (Kit.com account) are managed externally.

### Configuration Security
**Security Headers** are implemented in `securityHeaders.js` but delivered via **client-side meta tags**, which is significantly less effective than HTTP response headers:

- **Content-Security-Policy (CSP):** `worker-src 'self' 'unsafe-eval' blob:; object-src 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src * 'unsafe-inline' 'unsafe-eval'; script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;`
  - **Critical weakness:** `'unsafe-inline'` and `'unsafe-eval'` effectively neutralize CSP protection against XSS
  - `style-src *` allows any stylesheet source
- **Strict-Transport-Security (HSTS):** `max-age=31536000; includeSubDomains; preload` — Strong configuration, but HSTS via meta tag is **not honored by browsers** (RFC 6797 Section 5.4). HSTS must be delivered as an HTTP header to be effective. If GitHub Pages delivers HSTS headers natively, this meta tag is redundant.
- **X-Content-Type-Options:** `nosniff` — Properly configured, but meta tag delivery for this header is also not standard.
- **Missing headers:** No `X-Frame-Options` or `frame-ancestors` CSP directive (clickjacking risk), no `Referrer-Policy`, no `Permissions-Policy`.

No Nginx, Kubernetes Ingress, CDN, or infrastructure configuration files were found in the repository. GitHub Pages handles infrastructure-level security headers, TLS termination, and caching.

### External Dependencies
| Service | Purpose | Data Shared | Risk Level |
|---------|---------|-------------|------------|
| Kit.com (ConvertKit) | Newsletter subscriptions | Email addresses | High — PII collection |
| api.applause-button.com | Engagement tracking | Page URLs | Medium — Third-party tracking |
| Google Analytics (GTM) | Visitor analytics | Page views, IP, device info | Medium — Extensive tracking |
| GitHub Pages | Hosting | All site content | Low — Trusted infrastructure |
| LinkedIn, Facebook, Twitter, Pinterest | Social sharing | Page URLs, titles | Low — User-initiated |

### Monitoring & Logging
No application-level logging or monitoring was found in the codebase. Security event visibility is limited to:
- Google Analytics page view data (not security-focused)
- GitHub Pages access logs (if available, not in codebase)
- Kit.com subscription logs (external service)
- No error tracking (no Sentry, Datadog, etc.)
- No security event alerting

---

## 7. Overall Codebase Indexing

The codebase follows standard Jekyll conventions with a clean, well-organized directory structure. The root contains Jekyll configuration (`_config.yml`), dependency management (`Gemfile`, `Gemfile.lock`), and a few standalone files (`securityHeaders.js`, `CNAME`, `404.html`, `favicon.png`). Content is organized under `_posts/` with subdirectories by language (`english/`, `portuguese/`, `spanish/`), each containing 6 blog posts in Markdown format. Layouts in `_layouts/` define three page types: `default.html` (base wrapper), `home.html` (homepage with search/filter), and `post.html` (article pages with newsletter form and TOC). Reusable HTML fragments in `_includes/` handle the header, footer, share buttons, author bio, social links, language selector, and date formatting. Styling is in `_sass/` with the Minima theme base plus custom components. Static assets in `assets/` include three JavaScript files (`applause-button.js`, `home-search.js`, `post-toc.js`), CSS files, fonts (Gotham, IBM Plex Sans in WOFF2 format), author photos, and publication images. Internationalization support is provided by `en/` and `es/` directories with their own `index.md` and `about.md` files, plus `_data/translations.yml` for UI string translations. The `_site/` directory (git-ignored) contains the build output, and `.jekyll-cache/` is the build cache. The total tracked codebase is small — approximately 30-40 files — making security review straightforward. No build orchestration tools (Makefile, Dagger, CI config), no code generation, and no testing frameworks are present in the repository.

---

## 8. Critical File Paths

### Configuration
- `_config.yml` — Jekyll site configuration, analytics ID, social handles
- `Gemfile` — Ruby dependency specification
- `Gemfile.lock` — Locked dependency versions
- `CNAME` — Custom domain mapping (blog.lesis.lat)
- `.ruby-version` — Ruby version pin (3.2.0)
- `.gitignore` — Excludes `_site/` directory

### Authentication & Authorization
- **None** — No authentication or authorization components exist

### API & Routing
- `_layouts/home.html` — Homepage route with search functionality
- `_layouts/post.html` — Blog post route with newsletter form (lines 57-127)
- `_layouts/default.html` — Base layout wrapper
- `404.html` — Custom 404 page with redirect logic (lines 25-85)
- `index.md` — Root Portuguese homepage
- `en/index.md` — English homepage
- `es/index.md` — Spanish homepage
- `about.md` — Portuguese about page
- `en/about.md` — English about page
- `es/about.md` — Spanish about page

### Data Models & DB Interaction
- `_data/translations.yml` — i18n translation strings
- `_posts/english/` — English blog posts (6 files)
- `_posts/portuguese/` — Portuguese blog posts (6 files)
- `_posts/spanish/` — Spanish blog posts (6 files)

### Dependency Manifests
- `Gemfile` — Ruby gems specification
- `Gemfile.lock` — Locked dependency tree

### Sensitive Data & Secrets Handling
- `_config.yml` (line 24) — Google Analytics UA ID: `UA-167519399-1`
- `_includes/footer.html` (line 52) — Google Analytics GA4 ID: `G-BF7S2MHBGH`
- `_layouts/post.html` (line 57) — Kit.com Form ID: `9200442`

### Middleware & Input Validation
- `securityHeaders.js` — Client-side security header injection (CSP, HSTS, X-Content-Type-Options)
- `assets/home-search.js` — Client-side search with text normalization

### JavaScript (Security-Critical)
- `assets/applause-button.js` — Third-party minified widget (~29.5KB), calls `api.applause-button.com`
- `assets/home-search.js` — Client-side post filtering (81 lines)
- `assets/post-toc.js` — TOC generation with innerHTML sinks (238 lines, critical: lines 188-204)
- `securityHeaders.js` — Security meta tag injection (25 lines)

### Includes (Template Components)
- `_includes/header.html` — Loads applause-button.js/css (lines 2-3)
- `_includes/footer.html` — Google Analytics script (lines 47-53)
- `_includes/share-buttons.html` — Social share onclick handlers (lines 36-42), applause button (line 45)
- `_includes/social.html` — Social media profile links
- `_includes/author.html` — Author bio with LinkedIn link (line 8)
- `_includes/language-selector.html` — Multi-language navigation
- `_includes/date.html` — Date formatting

### Logging & Monitoring
- **None** — No application logging or monitoring configuration

### Infrastructure & Deployment
- `CNAME` — GitHub Pages custom domain
- `.ruby-version` — Runtime version specification
- No Dockerfile, docker-compose, Kubernetes, Nginx, or CI/CD configuration found

---

## 9. XSS Sinks and Render Contexts

### Critical XSS Sinks

**Sink 1: innerHTML Assignment in post-toc.js (CRITICAL)**

- **File:** `assets/post-toc.js`, lines 188-196 and line 204
- **Sink Type:** `element.innerHTML` assignment
- **Render Context:** HTML Body Context
- **Code (lines 188-196):**
  ```javascript
  sideItem.innerHTML =
    '<p class="post-side-note-title">' +
    noteLabel +
    ' ' +
    noteIndex +
    '</p>' +
    '<div class="post-side-note-content">' +
    note.innerHTML +
    '</div>';
  ```
- **Code (line 204):**
  ```javascript
  footerContent.innerHTML = note.innerHTML;
  ```
- **Source:** HTML elements with class `.section-footer-note` in rendered blog post content
- **User Input Reach:** YES — blog post authors/contributors control markdown content. If malicious content is injected into a `.section-footer-note` block (e.g., `<img src=x onerror="alert(1)">`), it will be rendered via innerHTML without sanitization
- **Exploitability:** Requires ability to contribute blog post content (stored XSS). Kramdown markdown may sanitize some HTML, but raw HTML blocks are supported in Jekyll posts.

**Sink 2: Inline onclick Handlers with Liquid Variables (HIGH)**

- **File:** `_includes/share-buttons.html`, lines 36-42
- **Sink Type:** Event Handler Attribute (onclick) — HTML Attribute Context (JavaScript string)
- **Render Context:** JavaScript Context within HTML Attribute
- **Code (line 36 — LinkedIn):**
  ```html
  onclick="window.open('https://www.linkedin.com/shareArticle?mini=false&url={{ site.url }}{{ pageurl }}&title={{page.title}}&summary=&source=');"
  ```
- **Code (line 37 — Facebook):**
  ```html
  onclick="window.open('http://www.facebook.com/share.php?u={{ site.url }}{{ pageurl }}');"
  ```
- **Code (line 38 — Twitter):**
  ```html
  onclick="window.open('http://twitter.com/home?status={{ site.url }}{{ pageurl }}');"
  ```
- **Code (line 40 — Pinterest):**
  ```html
  onclick="window.open('https://pinterest.com/pin/create/button/?url=&media={{ site.url }}{{ page.image }}&description=');"
  ```
- **Code (line 42 — Email):**
  ```html
  onclick="window.open('mailto:?&body={{ site.url }}{{ pageurl }}');"
  ```
- **Source:** Liquid template variables `{{ page.title }}`, `{{ page.image }}`, `{{ pageurl }}`, `{{ site.url }}`
- **User Input Reach:** YES — post titles (`page.title`) and image paths (`page.image`) are author-controlled. If a post title contains characters that break out of the JavaScript string context (e.g., single quotes), XSS is possible. Liquid's default `escape` filter HTML-encodes, but this is insufficient for JavaScript string context.
- **Attack Example:** A post title of `Test'); alert('XSS` would produce: `onclick="window.open('...&title=Test'); alert('XSS&summary=...');"` — though Liquid may HTML-escape the single quote to `&#39;`, which the browser would decode in the attribute context before JavaScript execution.

**Sink 3: window.open() URL Context (MEDIUM)**

- **File:** `_includes/share-buttons.html`, lines 36-42
- **Sink Type:** URL Context (`window.open()`)
- **Render Context:** URL Context
- **User Input Reach:** Same as Sink 2. The URLs constructed include page URLs and titles that flow into external social media endpoints.

**Sink 4: window.location.replace() in 404 Handler (MEDIUM)**

- **File:** `404.html`, line 82
- **Sink Type:** URL Context (`window.location.replace()`)
- **Render Context:** URL Context
- **Code:**
  ```javascript
  window.location.replace(targetPath);
  ```
- **Source:** `targetPath` from a hardcoded redirects map populated by Jekyll at build time from `post.url` values
- **User Input Reach:** LOW — redirect targets are build-time generated. However, if a post URL could contain a `javascript:` protocol string, it could execute. Mitigated by Jekyll's URL generation conventions.

### CSP Weakness Amplifying XSS Risk

- **File:** `securityHeaders.js`, line 4
- **Issue:** CSP includes `script-src 'self' 'unsafe-inline'` — this allows all inline scripts and event handlers to execute, meaning the CSP provides **no protection** against the XSS sinks identified above
- **Additionally:** CSP is delivered via meta tag which may not be fully honored by all browsers, and HSTS via meta tag is explicitly not supported per RFC 6797

### Safe Patterns (No XSS Risk)

- `assets/home-search.js` — Uses safe DOM methods: `hidden` property, `classList`, `getAttribute`, `textContent` (not innerHTML)
- `_layouts/post.html` lines 80-88 — Uses `| jsonify` Liquid filter for safe JavaScript embedding
- `_includes/social.html` — Uses `| cgi_escape | escape` filters for URL construction

---

## 10. SSRF Sinks

### Important Context
This is a **static site with no server-side processing**. Traditional SSRF (Server-Side Request Forgery) vulnerabilities require server-side code that makes HTTP requests based on user input. Since this application has no backend server processing requests, **there are no server-side SSRF vulnerabilities**. However, the following **client-side request patterns** are documented for completeness, as they represent data flows to external services.

### Client-Side External Request Sinks

**Sink 1: Newsletter Form Submission (fetch POST)**

- **File:** `_layouts/post.html`, lines 110-114
- **Sink Type:** HTTP Client (`fetch()`)
- **Code:**
  ```javascript
  fetch(form.action, {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  })
  ```
- **External Endpoint:** `https://app.kit.com/forms/9200442/subscriptions`
- **User Input:** Email address (`email_address` form field)
- **SSRF Relevance:** The `form.action` is read from the form element's `action` attribute, which is hardcoded in HTML. If DOM manipulation could change this attribute, the fetch target could be redirected. The `no-cors` mode means no response data is accessible, but the request is still sent.

**Sink 2: Applause Button API Requests (fetch)**

- **File:** `assets/applause-button.js` (minified)
- **Sink Type:** HTTP Client (`fetch()`)
- **External Endpoints:**
  - `https://api.applause-button.com/get-claps?url=<PAGE_URL>` (GET)
  - `https://api.applause-button.com/update-claps?url=<PAGE_URL>` (POST with JSON body)
- **User Input:** The `url` attribute of the `<applause-button>` element, set to `{{ page.url | relative_url }}` (build-time value)
- **SSRF Relevance:** The `api` attribute on the `<applause-button>` element can override the default API endpoint. If an attacker could inject HTML attributes (e.g., via DOM clobbering or template injection), they could redirect API calls to an arbitrary endpoint. The widget sends POST requests with `Content-Type: text/plain` and a JSON body containing version info (`3.3.0`).

**Sink 3: Google Analytics Script Loading**

- **File:** `_includes/footer.html`, line 47
- **Sink Type:** External Script Loading (`<script src="...">`)
- **Code:**
  ```html
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-BF7S2MHBGH"></script>
  ```
- **External Endpoint:** `https://www.googletagmanager.com/gtag/js`
- **User Input:** None — script URL is hardcoded
- **SSRF Relevance:** No user input influences the URL. The script itself may make additional requests to Google's analytics endpoints based on page content.

**Sink 4: Social Share window.open() Redirects**

- **File:** `_includes/share-buttons.html`, lines 36-42
- **Sink Type:** Redirect / URL Handler (`window.open()`)
- **External Endpoints:** LinkedIn, Facebook (HTTP), Twitter (HTTP), Pinterest, mailto:
- **User Input:** Page URLs and titles are embedded in the share URLs at build time
- **SSRF Relevance:** These are client-side redirects opening new browser windows/tabs. No server-side request is made. However, the constructed URLs could be manipulated if Liquid template variables contain injection payloads.

**Sink 5: 404 Redirect Handler**

- **File:** `404.html`, line 82
- **Sink Type:** Redirect Handler (`window.location.replace()`)
- **Code:**
  ```javascript
  window.location.replace(targetPath);
  ```
- **User Input:** `window.location.pathname` is matched against a hardcoded redirects map
- **SSRF Relevance:** Client-side redirect only. Targets are hardcoded at build time. No server-side request forging possible.

### Summary
No traditional SSRF vulnerabilities exist in this application due to the absence of server-side request processing. All external requests originate from the client browser. The primary concern is client-side request manipulation through DOM/attribute injection, particularly the applause button widget's overridable `api` attribute.

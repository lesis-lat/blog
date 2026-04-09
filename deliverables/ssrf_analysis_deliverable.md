# SSRF Analysis Report

## 1. Executive Summary

- **Analysis Status:** Complete
- **Target:** https://blog.lesis.lat
- **Assessment Date:** 2026-04-09
- **Key Outcome:** **Zero server-side request forgery vulnerabilities identified.** The target application is a fully static Jekyll 4.4.x blog hosted on GitHub Pages with no server-side runtime processing. All five potential SSRF sinks documented in the pre-recon code analysis were systematically traced and confirmed to be client-side browser requests, not server-side HTTP requests. No source-to-sink data flow exists that allows an external internet attacker to force the *server* to make outbound HTTP requests.
- **Purpose of this Document:** This report provides strategic context on the application's outbound request mechanisms, confirms the absence of server-side HTTP clients, and formally documents the five analyzed flows as architecturally safe. The exploitation queue has been generated with zero entries.

---

## 2. Dominant Vulnerability Patterns

**No SSRF vulnerability patterns were identified.**

The application's architecture fundamentally precludes server-side request forgery:

- **No server-side runtime code:** All pages are pre-rendered at build time by Jekyll. GitHub Pages serves only static files — HTML, CSS, JavaScript, and XML. There is no Ruby on Rails application server, no Node.js runtime, no PHP interpreter, no Python WSGI, and no other dynamic backend executing at request time.
- **No server-side HTTP client:** The application contains no uses of `Net::HTTP`, `HTTParty`, `Faraday`, `axios` (server-side), `requests`, `urllib`, `HttpClient`, `curl`, or any other server-side HTTP library. The only HTTP clients are browser-side `fetch()` calls and `<script>` tag loads executed in the visitor's browser.
- **No user-controlled URL routing to HTTP client:** No endpoint accepts a URL parameter, webhook URL, callback URL, or file path that is subsequently consumed by a server-side HTTP request.

The following patterns, while present in the client-side code, do **not** constitute SSRF because they execute entirely within the visitor's browser:

| Pattern | Location | Verdict |
|---|---|---|
| `fetch()` POST to hardcoded Kit.com URL | `_layouts/post.html:110-114` | Client-side only — NOT SSRF |
| `fetch()` GET/POST to applause-button API | `assets/applause-button.js` | Client-side only — NOT SSRF |
| `<script src="...">` tag to Google Tag Manager | `_includes/footer.html:47` | Client-side only — NOT SSRF |
| `window.open()` social share redirects | `_includes/share-buttons.html:36-42` | Client-side only — NOT SSRF |
| `window.location.replace()` 404 redirect | `404.html:82` | Client-side only — NOT SSRF |

---

## 3. Strategic Intelligence for Exploitation

- **HTTP Client Library:** None — the application has no server-side HTTP client library. The blog is served as static files by GitHub Pages.
- **Request Architecture:** All outbound HTTP requests originate exclusively from the visitor's browser (client-side JavaScript). The CDN stack (Cloudflare → Fastly → GitHub Pages) serves pre-built static assets only. No server-side request dispatching exists at any layer of the application.
- **Internal Services:** No internal services are reachable via the application. GitHub Pages enforces a strict static-file-serving model. No internal metadata endpoints, no internal APIs, and no management interfaces are exposed through the application's network surface.
- **Outbound Request Inventory (Client-Side Only):**
  - `POST https://app.kit.com/forms/9200442/subscriptions` — newsletter subscription, browser `fetch()`, `mode: 'no-cors'`
  - `GET https://api.applause-button.com/get-claps?url=<page_url>` — engagement tracking, browser `fetch()`
  - `POST https://api.applause-button.com/update-claps?url=<page_url>` — clap increment, browser `fetch()`
  - `GET https://www.googletagmanager.com/gtag/js?id=G-BF7S2MHBGH` — analytics script load, `<script>` tag
  - `POST https://www.google-analytics.com/g/collect` — GA4 data collection, browser JS
  - `POST https://blog.lesis.lat/cdn-cgi/rum?` — Cloudflare RUM telemetry, browser JS

---

## 4. Detailed Sink Analysis

### Sink 1: Newsletter Form Submission (`fetch()` POST)

- **File:** `_layouts/post.html`, lines 110–114
- **Code:**
  ```javascript
  fetch(form.action, {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  })
  ```
- **Backward Taint Trace:**
  - `form.action` ← HTML `action` attribute on `<form>` element (line 57) ← hardcoded Liquid template value `https://app.kit.com/forms/9200442/subscriptions`
  - `formData` ← `new FormData(form)` ← only field is `email_address` (HTML input)
  - No server-side code processes this request; the browser sends it directly to Kit.com
- **Execution Context:** Client-side browser JavaScript
- **User Input Influence on Request Destination:** None — the URL is hardcoded in the HTML template at build time
- **Verdict:** **SAFE** — No SSRF. Client-side browser request to hardcoded, legitimate third-party endpoint.

### Sink 2: Applause Button API Requests (`fetch()`)

- **File:** `assets/applause-button.js` (minified, ~29.5KB)
- **Code (extracted):**
  ```javascript
  // api attribute getter
  { key:"api", get: function(){ return this.getAttribute("api") || "https://api.applause-button.com" } }
  // GET request
  fetch(i + "/get-claps" + (a ? "?url=" + a : ""), { headers: {"Content-Type":"text/plain"} })
  // POST request
  fetch(n + "/update-claps" + (o ? "?url=" + o : ""), { method:"POST", headers:{"Content-Type":"text/plain"}, body: JSON.stringify(r+",3.3.0") })
  ```
- **Backward Taint Trace:**
  - API base URL (`i`/`n`) ← `getAttribute("api")` ← `<applause-button api="...">` HTML attribute ← template in `_includes/share-buttons.html` line 45 ← no `api` attribute set (uses default `https://api.applause-button.com`)
  - `url` param (`a`/`o`) ← `getAttribute("url")` ← `{{ page.url | relative_url }}` ← Jekyll build-time relative URL
- **Execution Context:** Client-side browser JavaScript (Web Component)
- **User Input Influence on Request Destination:** None at runtime — both the `api` base URL and `url` parameter are fixed at Jekyll build time. An attacker would need repository commit access to alter the `api` attribute; no runtime injection path exists for an internet-facing attacker without prior XSS exploitation.
- **Verdict:** **SAFE** — No SSRF. Client-side browser request with build-time fixed endpoints.

### Sink 3: Google Analytics Script Loading (`<script>` tag)

- **File:** `_includes/footer.html`, line 47
- **Code:**
  ```html
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-BF7S2MHBGH"></script>
  ```
- **Backward Taint Trace:**
  - `src` ← hardcoded Liquid template value ← no user input path
- **Execution Context:** Client-side browser HTML parsing / script loading
- **User Input Influence on Request Destination:** None
- **Verdict:** **SAFE** — No SSRF. Client-side browser request to hardcoded legitimate CDN.

### Sink 4: Social Share `window.open()` Redirects

- **File:** `_includes/share-buttons.html`, lines 36–42
- **Code (LinkedIn example):**
  ```javascript
  onclick="window.open('https://www.linkedin.com/shareArticle?mini=false&url={{ site.url }}{{ pageurl }}&title={{page.title}}&summary=&source=');"
  ```
- **Backward Taint Trace:**
  - All Liquid variables (`{{ site.url }}`, `{{ pageurl }}`, `{{ page.title }}`, `{{ page.image }}`) are resolved at Jekyll build time into static HTML
  - At request time, the `onclick` attribute contains a fully resolved, static string — no runtime user influence
- **Execution Context:** Client-side browser JavaScript (`window.open()`)
- **User Input Influence on Request Destination:** None at request time. Build-time authorship of post front matter (`page.title`, `page.image`) could influence these values, but this is a build-time stored vector, not an internet-attacker-accessible runtime vector.
- **Verdict:** **SAFE** — No SSRF. Client-side browser redirect with build-time fixed URLs.

### Sink 5: 404 Redirect Handler (`window.location.replace()`)

- **File:** `404.html`, line 82
- **Code:**
  ```javascript
  var currentPath = normalizePath(window.location.pathname);
  var targetPath = redirects[currentPath];
  if (targetPath) {
    window.location.replace(targetPath);
  }
  ```
- **Backward Taint Trace:**
  - `targetPath` ← `redirects[currentPath]` ← `redirects` object ← Jekyll template loop over `site.posts` at build time ← all values are Jekyll-generated relative URLs (`/yyyy/mm/dd/slug/`)
  - `currentPath` (user-controlled via URL path) is only used as a **lookup key** in the hardcoded `redirects` map — it never becomes the redirect target value
- **Execution Context:** Client-side browser JavaScript
- **User Input Influence on Request Destination:** None — user input controls the lookup key, not the redirect value. If no match is found, no redirect occurs.
- **Verdict:** **SAFE** — No SSRF. Client-side browser redirect with build-time fixed target values.

---

## 5. Secure by Design: Validated Components

All five documented client-side request flows were analyzed and confirmed safe. No server-side HTTP client exists in the application. The table below summarizes the full analysis outcome.

| Component / Flow | Endpoint / File Location | Defense Mechanism Implemented | Verdict |
|---|---|---|---|
| Newsletter Form Submission | `_layouts/post.html:110-114` | No server-side processing; `form.action` is hardcoded to `https://app.kit.com/forms/9200442/subscriptions` in static HTML template; browser-only `fetch()` with `mode: 'no-cors'`. | SAFE |
| Applause Button API Requests | `assets/applause-button.js` | Client-side Web Component; `api` attribute defaults to `https://api.applause-button.com`; `url` parameter is build-time Jekyll relative URL; no server-side request dispatching. | SAFE |
| Google Analytics Script Loading | `_includes/footer.html:47` | Hardcoded `<script src="...">` tag to Google CDN; no user input in URL; browser-loaded only. | SAFE |
| Social Share `window.open()` Redirects | `_includes/share-buttons.html:36-42` | All Liquid variables resolved at build time; `onclick` attributes contain static strings at runtime; browser-executed only. | SAFE |
| 404 Redirect Handler | `404.html:82` | `window.location.replace()` is client-side; redirect targets are build-time generated from Jekyll `site.posts`; user-controlled pathname used only as a lookup key, never as a target value. | SAFE |

### Architecture-Level Defense

The most significant defense is **architectural**: the application is a fully static site (JAMstack pattern). GitHub Pages serves only pre-built static files. There is no application server, no dynamic request handler, and no server-side HTTP client library in the entire stack. This architectural choice eliminates SSRF as a vulnerability class for this application entirely.

---

## 6. Methodology Checklist Results

| SSRF Check | Result | Notes |
|---|---|---|
| 1. HTTP Client Usage Patterns | ✅ No server-side HTTP clients found | All fetch() calls are browser-side |
| 2. Protocol and Scheme Validation | N/A | No server-side URL processing exists |
| 3. Hostname and IP Address Validation | N/A | No server-side outbound requests |
| 4. Port Restriction and Service Access Controls | N/A | No server-side outbound requests |
| 5. URL Parsing and Validation Bypass | N/A | No server-side URL validation layer |
| 6. Request Modification and Headers | N/A | No server-side proxy or header forwarding |
| 7. Response Handling and Information Disclosure | N/A | No server-side response proxying |

*End of SSRF Analysis Report*


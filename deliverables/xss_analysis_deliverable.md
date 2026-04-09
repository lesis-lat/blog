# Cross-Site Scripting (XSS) Analysis Report

## 1. Executive Summary

- **Analysis Status:** Complete
- **Target:** https://blog.lesis.lat
- **Key Outcome:** Seven (7) insecure code-level XSS patterns were identified across six source files. All vulnerable sinks lack context-appropriate output encoding. **However, zero (0) vulnerabilities are externally exploitable via the public internet.** The application is a fully static Jekyll blog where all content originates from build-time source files (post front matter, author data, template code) committed to a GitHub repository. No runtime user-controlled input is rendered into the DOM. An external attacker from the internet has no mechanism to inject untrusted content into any identified sink.
- **Purpose of this Document:** This report provides the full taint-analysis record — source-to-sink traces, encoding decisions, and render context evaluations — for every injection vector identified by the reconnaissance phase. It also documents the security posture deficiencies (absent CSP on post pages, ineffective meta-CSP on home page) relevant to any future scenarios where dynamic content is introduced.

---

## 2. Dominant Vulnerability Patterns

**Pattern 1: Unescaped Liquid Variables in JavaScript `onclick` String Context**
- **Description:** Multiple `onclick` event handler attributes in `_includes/share-buttons.html` embed Liquid template variables (`{{page.title}}`, `{{page.image}}`, `{{pageurl}}`) directly into JavaScript string literals without any Liquid escape filter. The string delimiter used in the JS string is a single quote `'`, so any single quote in these variables breaks out of the string context.
- **Implication:** If these values were ever user-controlled at runtime, this would represent a trivially exploitable stored XSS with no defenses. As a static site, exploitation requires repository commit access to inject malicious front matter (e.g., `title: "');alert(1)//"`).
- **Representative Findings:** XSS-CODE-01, XSS-CODE-05.

**Pattern 2: `innerHTML` Assignment Without Sanitization (DOM-Based Pattern in Static Context)**
- **Description:** `assets/post-toc.js` reads `.section-footer-note` elements from the already-rendered DOM and re-inserts their `.innerHTML` value into new DOM elements via `sideItem.innerHTML` and `footerContent.innerHTML`. No sanitization (e.g., DOMPurify) is applied.
- **Implication:** If raw HTML with event handlers were present in `.section-footer-note` elements (e.g., `<img src=x onerror="alert(1)">`), it would execute when post-toc.js processes the page. In a static site, this content is fully controlled by the repository. In any future scenario where user content is rendered into the post body, this sink would become immediately dangerous.
- **Representative Finding:** XSS-CODE-02.

**Pattern 3: Unescaped Author Data in Multiple HTML Contexts**
- **Description:** `_includes/author.html` injects four author fields without Liquid escape filters: `author.linkedin` into an `href` attribute, `author.image` into a CSS `url()` within a `style` attribute, `author.name` into anchor link text (HTML_BODY), and `author.description` into a `<p>` tag (HTML_BODY). Author data is inlined directly in post front matter (`author-info` block).
- **Implication:** Each field targets a different HTML context and requires a different encoding strategy (attribute encoding, CSS encoding, HTML entity encoding). None is applied. Exploitation requires modifying post front matter.
- **Representative Findings:** XSS-CODE-03, XSS-CODE-04, XSS-CODE-06.

---

## 3. Strategic Intelligence for Exploitation

**Content Security Policy (CSP) Analysis**
- **Home Page CSP:** A `<meta http-equiv="Content-Security-Policy">` tag is injected via `/securityHeaders.js` (loaded deferred on the home layout only). The policy contains `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com` and `style-src * 'unsafe-inline' 'unsafe-eval'`. The presence of `'unsafe-inline'` in `script-src` renders the entire policy ineffective for XSS protection — any injected inline script would be permitted.
- **Post Pages CSP:** **None.** The `post.html` layout does not load `securityHeaders.js`. Live HTTP response headers confirm no `Content-Security-Policy` header is delivered at the CDN/server level. All inline scripts and external scripts execute with no restrictions on post pages.
- **404 Page CSP:** None (uses `default` layout).
- **Critical Bypass:** If XSS were achieved on any page, no CSP stands in the way of arbitrary script execution. On post pages (where the most dangerous sinks reside), there is zero CSP coverage.

**Cookie Security**
- **Observation:** No application-set session cookies exist. The site has no authentication system. Third-party analytics cookies (`_ga`, `_gid`) are set by Google Tag Manager but are not `HttpOnly` by default.
- **Implication:** Cookie theft via `document.cookie` is not a viable primary objective since there are no session tokens. However, `_ga` / `_gid` Google Analytics identifiers could be exfiltrated to correlate visitor identity.

**No WAF Evidence**
- Cloudflare edge provides DDoS protection but no Web Application Firewall (WAF) product was identified in headers or behavior. No request blocking was observed during testing.

**CORS Policy**
- `Access-Control-Allow-Origin: *` is present on all responses. If XSS were achieved, cross-origin data fetches from attacker-controlled endpoints would be trivially possible.

**Static Site Architecture — Core Exploitation Constraint**
- The application is fully pre-built by Jekyll at build time. GitHub Pages serves static HTML. There is no server-side runtime, no database, no user content submission that feeds back into rendered HTML. All dynamic content visible in the browser originates from the committed repository source files. **An attacker without repository write access cannot inject content into any identified sink at runtime.**

---

## 4. Vectors Analyzed and Confirmed Secure

These input vectors were fully traced and confirmed to have no exploitable injection path (either correctly defended or having no user-controlled source reachable at runtime).

| Source (Parameter/Key) | Endpoint/File Location | Defense Mechanism | Render Context | Verdict |
|---|---|---|---|---|
| `window.location.pathname` | `404.html` lines 78-82 | Used only as dictionary key in build-time hardcoded `redirects` map; target written to `window.location.replace()` is a build-time value, not user input | URL_PARAM (navigation only) | SAFE |
| Search input `#home-post-search` | `assets/home-search.js` lines 52-60 | Normalized via `normalizeText()` and used for string comparison only; controls `element.hidden` toggle — no DOM write of user input | N/A (no DOM sink) | SAFE |
| `category` (home page filter buttons) | `_layouts/home.html` line 35 | "All categories" button is hardcoded. Individual category buttons iterate build-time data (no runtime user input). `data-category` attributes in `<li>` elements (line 51) correctly use `\| escape`. Button text at line 44 is unescaped but value is build-time only | HTML_ATTRIBUTE / HTML_BODY | SAFE (code flaw, not externally exploitable) |
| `note_label`, `back_to_section_label` | `_layouts/post.html` lines 81-83 | Output via Liquid `\| jsonify` filter, which properly JSON-encodes the string (escaping `"`, `\`, and control characters) before placing it in a JavaScript string context | JAVASCRIPT_STRING | SAFE |
| `newsletter_button` | `_layouts/post.html` line 122 | Output via Liquid `\| jsonify` filter; value is a build-time translation string | JAVASCRIPT_STRING | SAFE |
| `post.title` (post list heading) | `_layouts/home.html` line 58 | Correctly uses `\| escape` Liquid filter | HTML_BODY | SAFE |
| `post.category` (post list `<li>` data attribute) | `_layouts/home.html` line 51 | Correctly uses `\| escape` Liquid filter for the `data-category` attribute | HTML_ATTRIBUTE | SAFE |
| `page.title` (post header `<h1>`) | `_layouts/post.html` line 23 | Correctly uses `\| escape` Liquid filter | HTML_BODY | SAFE |
| `include.author.linkedin` (JavaScript: URL vector) | `_includes/author.html` line 8 | Hardcoded URL prefix `https://www.linkedin.com/in/` prepended to value — `javascript:` URI injection not possible since the prefix dominates the URL scheme. (Attribute breakout via `"` remains a code-level flaw.) | HTML_ATTRIBUTE (href) | SAFE for javascript: injection; attribute breakout is a code flaw not externally exploitable |
| `email_address` form field | `_layouts/post.html` lines 57-70 | Submitted via `fetch()` to external Kit.com API with `mode: 'no-cors'`; response not rendered back into the DOM | External API | SAFE |

---

## 5. Full Sink Analysis — Vulnerable Code Paths (Not Externally Exploitable)

The following paths are vulnerable at the code level (absent or mismatched encoding) but require GitHub repository write access to exploit. They are documented for completeness and supply-chain risk awareness.

### XSS-CODE-01: `page.title` → `onclick` JavaScript String (LinkedIn Share Button)

- **File:** `_includes/share-buttons.html` line 36
- **Sink:** `onclick` event handler attribute — JavaScript string literal
- **Code:** `onclick="window.open('...&title={{page.title}}&summary=...');"`
- **Source:** Post front matter `title:` field in `_posts/**/*.md`
- **Data Flow:** `_posts/**.md` front matter `title` → Jekyll Liquid render → HTML `onclick` attribute string → browser JS engine on click
- **Encoding Observed:** None. `{{page.title}}` has no Liquid escape filter. No JavaScript string escaping is applied.
- **Mismatch:** The value is placed inside a JavaScript string delimited by single quotes (`'`). Context requires JavaScript String Escaping (escaping `'`, `\`, and special chars). HTML attribute encoding alone would be insufficient. Neither is applied.
- **Witness Payload (if title were controlled):** `');alert(document.domain)//`
- **Live Confirmed:** Rendered live as `onclick="window.open('...&title=Economic taxonomy of vulnerabilities&...`' — unescaped. Current titles happen to be safe strings.
- **Verdict:** Vulnerable (code), NOT externally exploitable (requires repository access)

### XSS-CODE-02: `note.innerHTML` → `innerHTML` (post-toc.js Side Notes)

- **File:** `assets/post-toc.js` lines 188-196 (sideItem.innerHTML) and line 204 (footerContent.innerHTML)
- **Sink:** `innerHTML` assignment
- **Code:** `sideItem.innerHTML = '...<div class="post-side-note-content">' + note.innerHTML + '</div>'; footerContent.innerHTML = note.innerHTML;`
- **Source:** `.section-footer-note` elements in rendered blog post HTML content. Post Markdown content (with Kramdown allowing raw HTML blocks) → Jekyll build → served HTML → DOM
- **Data Flow:** `_posts/**.md` post body HTML → Kramdown parse → Jekyll render → served HTML `<div class="section-footer-note">` element → `note.innerHTML` read → concatenated into `sideItem.innerHTML` / assigned to `footerContent.innerHTML`
- **Encoding Observed:** None. No DOMPurify or equivalent sanitization applied between `note.innerHTML` read and `innerHTML` write.
- **Mismatch:** `innerHTML` sink requires HTML-safe content or prior sanitization. Raw `innerHTML` re-insertion of `.section-footer-note` content (which can include event handler attributes from raw HTML blocks in Markdown) bypasses any upstream rendering safety.
- **Witness Payload (if post content were controlled):** `<div class="section-footer-note"><img src=x onerror="alert(document.domain)"></div>` in a Markdown post body
- **Verdict:** Vulnerable (code), NOT externally exploitable (requires repository access)

### XSS-CODE-03: `author.linkedin` → `href` HTML Attribute Breakout

- **File:** `_includes/author.html` line 8
- **Sink:** HTML `href` attribute within anchor tag
- **Code:** `<a href="https://www.linkedin.com/in/{{ include.author.linkedin }}">`
- **Source:** `author-info.linkedin` in post front matter (e.g., `linkedin: htrgouvea`)
- **Data Flow:** Post front matter `author-info.linkedin` → Jekyll include → rendered HTML `href` attribute
- **Encoding Observed:** None. No `| escape`, `| url_encode`, or `| xml_escape` applied.
- **Mismatch:** HTML_ATTRIBUTE context requires attribute encoding. An injected `"` character closes the attribute prematurely. The URL prefix `https://www.linkedin.com/in/` prevents `javascript:` URI injection (scheme is overridden by the prefix), but attribute breakout to inject event handlers remains possible.
- **Witness Payload (if linkedin value were controlled):** `htrgouvea" onmouseover="alert(document.domain)` → renders as `href="https://www.linkedin.com/in/htrgouvea" onmouseover="alert(document.domain)"`
- **Verdict:** Vulnerable (code — attribute injection), NOT externally exploitable (requires repository access)

### XSS-CODE-04: `author.image` → CSS `url()` in `style` Attribute

- **File:** `_includes/author.html` line 3
- **Sink:** CSS `url()` value within inline `style` HTML attribute
- **Code:** `style="background: url('/assets/authors/{{ include.author.image }}'); background-size: ..."`
- **Source:** `author-info.image` in post front matter
- **Data Flow:** Post front matter `author-info.image` → Jekyll include → rendered HTML `style` attribute
- **Encoding Observed:** None. No CSS encoding or HTML attribute encoding applied.
- **Mismatch:** CSS_VALUE context within an HTML_ATTRIBUTE. Injection of `')` closes the CSS `url()` and quote. Further injection of `" onmouseover="alert(1)` would close the `style` attribute and add an event handler. Modern browsers don't support CSS `expression()`, but the attribute breakout path is valid.
- **Witness Payload (if image value were controlled):** `heitor.jpg'); } " onmouseover="alert(document.domain)` → style attribute broken, event handler injected
- **Verdict:** Vulnerable (code — CSS context / attribute breakout), NOT externally exploitable (requires repository access)

### XSS-CODE-05: `page.image` → `onclick` JavaScript String (Pinterest Share Button)

- **File:** `_includes/share-buttons.html` line 40
- **Sink:** `onclick` event handler attribute — JavaScript string literal
- **Code:** `onclick="window.open('https://pinterest.com/pin/create/button/?url=&media={{ site.url }}{{ page.image }}&description=');"`
- **Source:** Post front matter `image:` (or `og_image:`) field
- **Data Flow:** Post front matter `image` → Jekyll Liquid render → HTML `onclick` attribute JS string → browser JS engine on click
- **Encoding Observed:** None. `{{page.image}}` has no Liquid filter applied.
- **Mismatch:** Same as XSS-CODE-01 — JavaScript string context requires JS string escaping; none applied.
- **Witness Payload:** `');alert(document.domain)//`
- **Verdict:** Vulnerable (code), NOT externally exploitable (requires repository access)

### XSS-CODE-06: `author.name` and `author.description` → HTML_BODY Raw Injection

- **File:** `_includes/author.html` lines 8 (anchor text) and 10 (paragraph)
- **Sink:** HTML body content (text node context in `<a>` and `<p>`)
- **Code:** `<a href="...">{{ include.author.name }}</a>` and `<p class="author-description">{{ include.author.description }}</p>`
- **Source:** `author-info.name` and `author-info.description` in post front matter
- **Data Flow:** Post front matter `author-info.name/description` → Jekyll include → rendered HTML body text
- **Encoding Observed:** None. Neither value has a `| escape` or `| xml_escape` Liquid filter.
- **Mismatch:** HTML_BODY context requires HTML Entity Encoding. Raw tag injection (e.g., `<script>`, `<img onerror>`) is possible.
- **Witness Payload (if name were controlled):** `Heitor<img src=x onerror=alert(document.domain)>` as `author.name` value
- **Verdict:** Vulnerable (code), NOT externally exploitable (requires repository access)

### XSS-CODE-07: `category` → HTML_BODY Text (Home Page Category Buttons)

- **File:** `_layouts/home.html` lines 42-44 and 61
- **Sink:** HTML_ATTRIBUTE (`data-category` on `<button>`) and HTML_BODY (button text content, span text content)
- **Code:** `data-category="{{ category }}"` (line 42), `{{ category }}` as button inner text (line 44), `{{ post.category }}` as span inner text (line 61)
- **Source:** Post front matter `category:` field
- **Data Flow:** Post front matter `category` → Jekyll build → rendered `<button data-category>` and text nodes
- **Encoding Observed:** None at lines 42, 44, 61. (Note: line 51 correctly uses `| escape` for the `<li>` element's `data-category`, demonstrating inconsistent application of the filter.)
- **Mismatch:** HTML_ATTRIBUTE at line 42 requires attribute encoding; HTML_BODY at lines 44/61 requires HTML entity encoding. A `"` in category value would break out of the data-category attribute; HTML tags in category value would be rendered as markup in the button/span text.
- **Witness Payload (if category were controlled):** `Research" onmouseover="alert(document.domain)` for attribute breakout at line 42; `Research<script>alert(1)</script>` for HTML_BODY injection at lines 44/61
- **Verdict:** Vulnerable (code), NOT externally exploitable (requires repository access)

---

## 6. Analysis Constraints and Blind Spots

- **Static Architecture:** The fully static nature of the application eliminates runtime injection paths entirely. All findings are supply-chain / repository-compromise scenarios.
- **Third-Party Scripts:** `applause-button.js` (~29.5KB minified, no Subresource Integrity) is loaded from a CDN. If this script were compromised at the CDN level, it would execute arbitrary JavaScript with full DOM access on all post pages. This was not analyzed for internal sinks due to its minified/unauditable nature and out-of-scope CDN origin.
- **Google Tag Manager:** GTM is loaded without SRI. A compromised GTM container could inject arbitrary scripts. Out of scope (third-party control plane).
- **Jekyll Build Pipeline:** While build-time injection was documented as a theoretical vector, the actual GitHub Actions workflow and build environment were not reviewed (out of scope — server access required).
- **No DOM Fragment Routing:** No `location.hash`-based routing was identified. The 404 redirect logic reads only `location.pathname` and performs pure dictionary key lookup with build-time values as redirect targets.

---

*End of XSS Analysis Report*

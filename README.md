# LESIS Blog

Laboratory of Engineering Studies in Information Security - Research and Development Blog

## Overview

This is the official blog for LESIS, a research laboratory focused on information security, offensive technologies, and vulnerability research. The site features articles on security research, penetration testing, and defensive strategies.

## Technology Stack

- Jekyll 4.4+ - Static site generator
- Ruby 3.0+
- SCSS - Stylesheet language
- Visual identity shared with [lesis.lat](https://lesis.lat) (IBM Plex Sans and Mono)
- Jekyll Feed for RSS support

## Project Structure

```
├── _includes/          # HTML components (header, footer, etc)
├── _layouts/           # Page layouts (default, post, home)
├── _posts/             # Blog posts organized by language
│   ├── english/
│   ├── portuguese/
│   └── spanish/
├── _sass/              # Stylesheets
│   ├── lesis/          # Fonts and tokens from the lesis.lat design
│   └── blog/           # Layout, home, post and syntax styles
├── assets/             # Static assets (CSS, images, fonts)
├── _data/              # Translation and configuration data
├── _config.yml         # Site configuration
└── _site/              # Generated static site (build output)
```

## Features

- Multi-language support (English, Portuguese, Spanish)
- Responsive design with mobile optimization
- SEO optimized with meta tags and structured data
- Social media preview with OG tags
- Author profiles with social links
- Post categorization and filtering
- RSS feed generation

## Getting Started

### Prerequisites

- Ruby 3.0 or higher
- Bundler

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blog
```

2. Install dependencies:
```bash
bundle install
```

### Development

Run the local development server:

```bash
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`

For verbose output:
```bash
bundle exec jekyll serve --verbose
```

### Build for Production

Generate the static site:

```bash
bundle exec jekyll build
```

Output will be in the `_site` directory.

## Configuration

Edit `_config.yml` to customize:

- Site title and description
- Author information
- Social media accounts
- Base URL and site URL
- Analytics tracking
- Default OG image for social sharing

## Writing Posts

Create posts in the appropriate language folder under `_posts/`:

```yaml
---
layout: post
lang: en
translation_key: post-topic
category: research
title: Post Title
date: 2026-02-14
author: author_name
image: author_image.jpg
og_image: /path/to/preview-image.png
excerpt: Brief post excerpt
permalink: /blog/post-title/
---

Post content in Markdown...
```

- `translation_key` must be the same in the PT, EN and ES versions of a post. It links the versions for the language selector and the `hreflang` tags.
- `category` is a key shared by all languages: `research`, `vulnerability`, `community`, `guides` or `case-study`. Its label in each language lives under `categories` in `_data/translations.yml`.
- `permalink` keeps the URL independent of the category. Do not change the permalink of a published post.

## Styling

The site uses SCSS with a modular component architecture:

The blog keeps its own structure and uses the visual identity of [lesis.lat](https://lesis.lat): IBM Plex Sans and Mono, black and white with the `#f4f3ef` paper tone, mono uppercase labels, 1px rules and square controls.

- `_sass/lesis/` - IBM Plex font faces and colour tokens taken from the lesis.lat stylesheet (`lesis-lat.github.io/assets/css/style.css`).
- `_sass/blog/_layout.scss` - Page wrapper, header and footer.
- `_sass/blog/_home.scss` - Post list, search, categories and pagination.
- `_sass/blog/_post.scss` - Article typography, sidebar (ask AI, table of contents, notes), share bar, newsletter box and author.
- `_sass/blog/_syntax.scss` - Code highlighting.
- `assets/main.scss` - Entry point that loads them.

## Languages

The blog supports three languages:

- English (en)
- Portuguese (pt)
- Spanish (es)

The language of a page comes from its `lang` front matter (pages under `/en/` and `/es/` fall back to the URL prefix, everything else to Portuguese). `_includes/i18n.html` resolves it once per layout and exposes `current_lang` and `translations`; interface strings, date formats and locale codes live in `_data/translations.yml`.

Each language has its own Atom feed at `/feed/pt.xml`, `/feed/en.xml` and `/feed/es.xml`. `/feed.xml` keeps all languages together and is read by the post sync of lesis.lat (English entries, `<category term>` as the topic).

## Deployment

The site is designed to be deployed to any static hosting platform:

- GitHub Pages
- Netlify
- Vercel
- Traditional web servers

Simply upload the contents of the `_site` directory.

## Dependency Management

Dependencies are automatically updated via [Dependabot](https://docs.github.com/en/code-security/dependabot):

- **Ruby gems** (Bundler) - Weekly updates on Mondays at 03:00, separated by type and severity
- **GitHub Actions** - Weekly updates on Mondays at 04:00 with major/minor-patch control

Pull requests are automatically created and require review before merging. Updates are organized into groups:
- Production minor/patch updates (lower risk)
- Production major updates (requires attention)
- Development dependencies

## Performance

Recent optimizations include:

- Modular CSS architecture for better maintainability
- Unused CSS removal
- Responsive image implementation
- Self-hosted IBM Plex Sans and Mono subsets in WOFF2
- Lazy loading support for images

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers

## Contributing

For contributions, please:

1. Create a new branch from `main`
2. Make your changes
3. Test locally with `bundle exec jekyll serve`
4. Create a pull request with a descriptive message

## License

All content and code in this repository are owned by LESIS.

## Contact

- Website: https://lesis.lat
- Email: contact@lesis.lat
- LinkedIn: lesis-lat
- Twitter: lesis_lat
- Instagram: lesis.lat
- GitHub: lesis-lat

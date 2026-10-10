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
├── assets/             # Static assets (CSS, images, fonts, narrated audio)
├── script/             # Audio narration generator
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
- AI-narrated audio version of every post, in every language

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
- `audio: false` leaves a post without the narrated version.

## Audio Narration

Every post gets an MP3 narrated with ElevenLabs `eleven_v4` (through the Text to Dialogue API, the endpoint ElevenLabs documents for that model, with a single voice), in North American English, Brazilian Portuguese and Argentine Spanish, shown as a player under the post title. The player and the narration itself say that the voice is AI-generated.

- **Only new or edited posts are narrated.** A post is narrated when it has no audio yet, or when its own title, author or body changed since its audio was made. Changing the voices, settings, pronunciations, the spoken notes in `_data/translations.yml` or the script never narrates anything again by itself; to redo a post with the new settings, run the workflow by hand with its `translation_key` in `only` and `force` checked.
- **The player appears only after the audio exists.** A post enters `_data/audio.yml` only once its MP3 is complete, and `_includes/audio-player.html` also checks that the MP3 is part of the site. A failed narration publishes nothing (an edited post keeps its previous audio); re-running the failed workflow run, or running the workflow by hand, tries it again.
- **Every run has a ceiling.** If more than `max` posts (default 6: two articles in three languages) need narration, the run stops before calling the API. Narrating the archive for the first time is done on purpose: run the workflow by hand with a higher `max`.
- `script/narration.yml` holds the model, the voice ID for each language, optional generation settings (`stability`, `similarity`) and pronunciation fixes. Pick voices in the ElevenLabs Voice Library (filter by language and accent, "Add to my voices") and paste their IDs; the run logs each voice's name and accent before narrating.
- `.github/workflows/generate-audio.yml` runs on every push to `main` that touches `_posts/` and narrates only the posts that push changed (`--since` with the commit before the push), so posts still waiting for audio, like the archive, never ride along. Since `main` only takes reviewed pull requests, it puts the audio and the manifest in a pull request from `audio/narration`: listen to the files linked there, approve and merge it to publish. While that pull request is open, later runs add to it and never narrate again what it already holds; the code always comes from `main`, and only plain MP3 files and the manifest are taken from that branch. Run it by hand to narrate anything else: `only` takes translation_keys, and leaving it empty narrates every post without current audio, within `max`.
- `script/generate_audio.rb` turns the Markdown into spoken text: it opens with the title, the author and the AI notice, reads links by their label, drops images and citation markers like `[1]`, and replaces code blocks, tables and bare URLs with a short note pointing to the text version. Posts are sent in chunks of a few paragraphs (at most 2,000 characters, the reliable size for Text to Dialogue), stitched together with `previous_request_ids` and the words on either side of each join (`previous_text`, `future_text`) so the delivery carries across the joins.
- Each chunk comes back as 192 kbps MP3 and is decoded before the joins. The audio is normalized to -16 LUFS (two-pass `loudnorm`) and stored at `assets/audio/<translation_key>/<lang>.mp3` as mono 44.1 kHz MP3 at 128 kbps, about 1 MB per minute. Both the MP3s and `_data/audio.yml` are generated: do not edit them by hand.

### API key

This repository is public, so the ElevenLabs key must never appear in the code, in a commit or in a log.

- In *Settings → Actions → General → Workflow permissions*, allow GitHub Actions to create pull requests, so the workflow can open the audio pull request.
- Store it as the `ELEVENLABS_API_KEY` secret of a GitHub environment named `elevenlabs` (*Settings → Environments*), with *Deployment branches* limited to `main`. A workflow edited on another branch then cannot read it. The Creator plan is enough: the script asks for 192 kbps MP3, and only 44.1 kHz PCM would need Pro.
- Create a key used only by this workflow, restricted to the endpoints it calls (text to speech and reading voices) and with a credit quota, so a leaked key can do little. Keep third-party disabling allowed: ElevenLabs takes part in GitHub secret scanning and disables a key committed to a public repository.
- Only the narration step receives the key. The script keeps it in memory, removes it from the environment before starting `ffmpeg`, sends it only to `api.elevenlabs.io` (or a mock on localhost) and redacts it from any error message.
- Never add `pull_request` or `pull_request_target` triggers to that workflow, and keep its actions pinned to commit SHAs.
- Locally, keep the key in a file outside the repository and point `ELEVENLABS_API_KEY_FILE` at it, so it never shows up in the command line or the shell history:

```bash
install -D -m 600 /dev/null ~/.config/lesis/elevenlabs.key   # then paste the key into it
ELEVENLABS_API_KEY_FILE=~/.config/lesis/elevenlabs.key bundle exec ruby script/generate_audio.rb --only <translation_key>
```

Review what will be read before spending credits (no key needed):

```bash
bundle exec ruby script/generate_audio.rb --dry-run --max 999 --text-dir /tmp/lesis-speech
```

## Styling

The site uses SCSS with a modular component architecture:

The blog keeps its own structure and uses the visual identity of [lesis.lat](https://lesis.lat): IBM Plex Sans and Mono, black and white with the `#f4f3ef` paper tone, mono uppercase labels, 1px rules and square controls.

- `_sass/lesis/` - IBM Plex font faces and colour tokens taken from the lesis.lat stylesheet (`lesis-lat.github.io/assets/css/style.css`).
- `_sass/blog/_layout.scss` - Page wrapper, header and footer.
- `_sass/blog/_home.scss` - Post list, search, categories and pagination.
- `_sass/blog/_post.scss` - Article typography, audio player, sidebar (ask AI, table of contents, notes), share bar, newsletter box and author.
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

# vtnam207 — blog của Vũ Thành Nam

Blog cá nhân của **Vũ Thành Nam**, sinh viên **UIT — VNUHCM**. Write-up CTF, reverse engineering, crypto và ghi chú lập trình tầng thấp.

- GitHub Pages: https://vtnam207.github.io/
- Vercel: https://vtnam207.vercel.app/

Built with [Astro](https://astro.build). The design is custom: no theme.

## Features

- **Generated cover art for every post**: a deterministic hexdump-style image tinted by category, plus a 1200×630 social card (OG/Twitter).
- **Command-palette search** (`Ctrl/⌘ K` or `/`) over titles, tags and full post text. It ignores Vietnamese diacritics, so `ma hoa` finds "mã hóa".
- **Blog index with live filters** by category, tag and text. Filters are deep-linkable (`/blog/?category=Crypto&tag=RSA`).
- **Write-ups grouped by CTF**, a **year-by-year archive**, and tag and category pages.
- **Post pages**: sticky TOC with scroll-spy, reading progress bar, click-to-zoom screenshots, KaTeX math, copy-link and share buttons, author card, previous/next and related posts.
- **Dark/light themes** with no flash on load. Each category has its own accent colour.
- RSS (full content), sitemap, robots.txt, JSON-LD, and a custom 404 page.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # outputs to dist/
```

## Write a post

```bash
pnpm new-post my-post --ctf "Some CTF 2026" --category "Reverse Engineering"
```

This creates `src/content/posts/my-post.md` (as a draft) and generates its cover art. Frontmatter:

```yaml
title: "Some CTF 2026"
published: 2026-10-29
description: "One-line summary shown on cards and in search."
ctf: "Some CTF 2026"          # optional; makes it a write-up
category: "Reverse Engineering"  # Reverse Engineering | Crypto | Pwn | Web | Forensics | Notes
tags: [CTF, Windows]
draft: false
cover: ""                     # optional custom image; generated art is used when empty
featured: false               # pin to the top of the home page
```

Put screenshots in `public/assets/posts/<slug>/` and reference them as `/assets/posts/<slug>/x.png`.

### Cover art

`pnpm covers` regenerates the art for every post into `public/assets/covers/`. `pnpm build` only fills in missing art, so committed covers never change. The art looks best with **JetBrains Mono** installed locally.

## Where things live

| What | File |
| --- | --- |
| Name, school, bio, socials, nav | `src/config.ts` |
| About page long-form text | `src/content/spec/about.md` |
| Colours, fonts, radii (both themes) | `src/styles/tokens.css` |
| Post typography | `src/styles/prose.css` |
| Cover art generator | `scripts/cover-art.mjs` |

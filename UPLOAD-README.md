# Site-wide SEO pass — 88 files

Upload **everything in this folder** to the repo root. It's a lot of files, but GitHub's
**Add file → Upload files** lets you select them all and drag them in one go.

> **This folder supersedes the `...-26e-sharelinks` folder.** `visualizer.html` in here already
> contains the share-link button, so you don't need to upload that one separately.

Two of these are **brand new** files: `sitemap.xml` and `robots.txt`.

---

## What was wrong

Your 87 pages are genuinely good content that search engines were barely equipped to find or
show:

| | before | after |
|---|---|---|
| Pages with a meta description | **2** | 85 |
| Pages with a canonical URL | **0** | 85 |
| Pages with social preview tags | **2** | 85 |
| sitemap.xml | **missing** | ✅ 83 pages listed |
| robots.txt | **missing** | ✅ points at the sitemap |

Without a sitemap, Google has to stumble onto pages by following links. Without a meta
description, Google invents its own snippet — usually by grabbing whatever text it finds first,
which is often nothing useful.

## What changed

Only the `<head>` of each page. **Nothing visible on any page changed.**

- **Meta descriptions** written from each page's own opening paragraph — never invented. The
  page's topic is put first so a searcher immediately sees the page is about what they searched
  for. (Your lead paragraphs are vivid but oblique — "Buckle in, you're in the front seat" is a
  great opening line and a terrible search snippet on its own, so it now reads
  *"Concavity & the Second Derivative — Buckle in, you're in the front seat…"*.)
  Inline LaTeX was cleaned out of these so no snippet shows raw `\(p(t)=t^2\)`.
- **Canonical URLs** on every page — tells Google which URL is the real one.
- **Open Graph + Twitter cards** — links to your pages now show a proper title, description, and
  your og-image when shared in Discord, iMessage, Slack, or on social.
- **sitemap.xml** listing all 83 real pages, with the homepage and unit hubs weighted highest.
- **robots.txt** pointing at the sitemap.

## Two housekeeping notes

**1. Two stray duplicate files.** `index_6.html` and `unit1_4.html` look like accidental uploads —
they're copies of `index.html` and `unit1.html`. Duplicate pages split your search ranking, so
I've given them canonical tags pointing at the real pages and left them out of the sitemap, which
neutralises the problem. **You may want to just delete those two files from the repo** — I didn't
delete them since they're yours.

**2. `grapher.html` is marked `noindex`.** It's the bare renderer that only works with URL
parameters, so a standalone search result for it would be a dead end for a student.

## After you upload

Worth doing once, takes 5 minutes and meaningfully speeds up indexing:

1. Go to **Google Search Console** (search.google.com/search-console), add `visualcalculus.org`.
2. Verify ownership — easiest is the DNS TXT record method via Porkbun.
3. Submit `https://visualcalculus.org/sitemap.xml` under **Sitemaps**.

That tells Google all 83 pages exist immediately, instead of waiting to be discovered. It also
starts collecting the search terms people actually use to find you — which is real data for
deciding what to build or write next.

## Verified

- All 87 pages structurally checked (one title each, tags inside `<head>`, no broken scripts).
- The Visualizer still passes its full 69/69 corpus, plus the share-link round-trip test.

# The public embed — 4 files

Upload all four to the repo root.

- `embed.html` — **new page**, the embed builder
- `grapher.html` — gains an `?embed=1` widget mode
- `visualizer.html` — footer now links to the builder (+ two copy fixes, below)
- `sitemap.xml` — includes the new page

---

## What this is

Anyone — a teacher, a tutor, someone writing notes — can now type a function at
**visualcalculus.org/embed.html**, and copy one line of HTML that puts a live, correct,
interactive calculus graph on *their* page.

Presets are one click: a cubic, f and f′, area between curves, Riemann sums, a cardioid, a slope
field. Or type any function.

## Why this is the SEO play, not just a feature

The snippet is deliberately **two** elements:

```html
<iframe src="https://visualcalculus.org/grapher.html?embed=1&s=..."></iframe>
<a href="https://visualcalculus.org/">Made with Visual Calculus</a>
```

**Search engines do not follow an iframe's `src`.** An iframe alone would give you exactly zero
SEO benefit. The `<a>` underneath is a real backlink — and backlinks are the single thing standing
between you and ranking, because that's the one advantage Khan Academy has that you can't
shortcut. It's how Desmos and CodePen built their authority.

Every person who embeds a graph gives you a permanent link. That's the flywheel.

Worth saying plainly though: **the embed doesn't spread on its own.** It converts attention into
authority — it doesn't create attention. The Reddit launch at back-to-school is still what brings
the first humans, and some fraction of those will be teachers who embed. This asset is ready and
waiting for that moment.

## Two copy fixes that came along

While in there I corrected two things that were undercutting you:

1. The Visualizer footer still said *"4 problem types now, more coming."* It now lists what it
   actually does — derivatives, areas, volumes, Riemann sums, series, polar & parametric, slope
   fields, implicit curves, curve analysis.
2. Two problem-type cards still said *"custom soon"* — but tangent lines and related rates have
   taken custom numbers for a while now. Both now correctly read *"live · your numbers."*

## Verified

- All five presets build a working snippet with a live widget.
- **The real test:** the snippet was pasted into a blank third-party page — the graph rendered and
  the attribution anchor was present and correct.
- Confirmed the widget mode does **not** leak into the Visualizer's own inline preview (it doesn't
  pass `embed=1`, so no footer bar, caption unchanged).
- Corpus 69/69.

## After uploading

Try it yourself at `visualcalculus.org/embed.html` — and consider whether any of your own lesson
pages would be better with an embedded live graph. Dogfooding it is also the fastest way to spot
anything awkward before a teacher sees it.

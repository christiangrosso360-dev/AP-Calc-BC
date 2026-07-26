# The Visualizer — Upload Checklist (2026-07-26)

Upload these **6 files** to the **root** of your repo
`github.com/christiangrosso360-dev/AP-Calc-BC`
(same folder where `index.html`, `CNAME`, and the unit pages already live).

GitHub Pages redeploys automatically after you commit — the site updates in ~1 minute.

---

## 2 NEW files — these must be ADDED (they don't exist yet)

| File | What it is |
|------|-----------|
| `visualizer.html` | **The Visualizer page itself** — the paste box, symbol palette, recognizer, inline visuals, and Socratic tutor. |
| `grapher.html` | **The universal renderer** — draws any long-tail problem (derivatives, integrals, Riemann, limits, **series/Taylor**…) that isn't one of the 4 signature types. `visualizer.html` embeds it. **If this is missing, those problems silently fail.** |

## 4 UPDATED files — these OVERWRITE the existing ones

| File | What changed |
|------|-------------|
| `index.html` | Adds the Visualizer box to the homepage hero (the front door). |
| `revolve.html` | Accepts `?f=&g=&a=&b=&axis=…` params + `?embed=viz` mode (inline solid/area). |
| `linear-approximation.html` | Accepts `?f=&at=` params + `?embed=tool` mode (inline tangent). |
| `related-rates.html` | Accepts `?scene=&given=` params + `?embed=tool` mode (inline rates scene). |

---

## What's new since the last upload (2026-07-26)

- **Unit 10 · Series support** — "does 1/n² converge?", geometric series, factorial series, Maclaurin/Taylor polynomials all now visualize (partial sums marching to their limit, or Taylor polynomials hugging a function). This was previously a dead zone.
- **Symbol palette** — a row of tap-to-insert buttons above the Visualize button: ∫ √ π x² x³ xⁿ Σ ∞ θ d/dx f′. Makes typing problems faster, and an input normalizer means pretty symbols (², √, π, Σ, ∫, ×, −) all parse correctly whether typed or tapped.
- Full regression: **52/52 test problems route correctly** (44 original + 8 new series/symbol cases), verified end-to-end in a real browser.

---

## How to upload (GitHub web, no git needed)

1. Go to `github.com/christiangrosso360-dev/AP-Calc-BC`.
2. Click **Add file → Upload files**.
3. Drag all 6 files from this folder into the page.
4. It will overwrite the 4 existing ones and add the 2 new ones.
5. Scroll down, click **Commit changes**.
6. Wait ~1 min, then open **visualcalculus.org/visualizer.html** to see it live.

---

## Quick smoke test once it's live (paste each into the box)

**Signature archetypes:**
- `revolve y=sqrt(x) and y=x^2 about the x-axis` → spinning 3D solid
- `area between y=x^2 and y=2x` → shaded region + integral
- `tangent line to x^3-3x at x=2` → tangent rider
- `a 13 ft ladder slides down a wall at 3 ft/s` → related-rates scene

**Universal grapher:**
- `find the derivative of x^3` → f and f' graphed
- `area under y=x^2 from 0 to 2 using 6 rectangles` → Riemann rectangles

**NEW — series:**
- `does the series 1/n^2 converge?` → partial sums leveling off at π²/6 ≈ 1.6449
- `does the harmonic series 1/n converge or diverge?` → partial sums climbing forever, no limit line
- `maclaurin series for sin x` → sin(x) with its Taylor polynomials layered on top

**NEW — symbol palette:**
- Tap ∫, √, π, x², Σ, etc. above the input and confirm they insert at the cursor.
- Try typing with pretty symbols directly: `∫ x² from 0 to 2`, `√(x) graph`, `Σ 1/n diverges?`

Then hit **"Walk me through it →"** on any result to check the tutor — including a series result, which should talk about convergence tests (geometric ratio, p-series, ratio test) grounded in the picture.

- Try one on your **phone** too — the mobile layout is verified clean.

---

## What's tracked automatically after launch

Any problem the Visualizer can't handle is logged to your GoatCounter dashboard:
- `viz-miss/unrendered/<the problem>` — **real math it couldn't draw → your to-do list**
- `viz-miss/nonmath/<the problem>` — junk with no math (ignore)

Check `visualcalculus.goatcounter.com`, filter paths starting with `viz-miss/`.

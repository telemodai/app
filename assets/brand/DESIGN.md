# Telemodai — Design System

> Editorial monochrome. A near-black canvas, one geometric sans setting both the headings and the
> text, and structure built from hairlines instead of shadows. Colour appears only where it does a job.

**Status:** approved.
**Themes:** dark (default register) and light (full peer).
**Live:** [`system.html`](pages/system.html) renders every token in both themes.
**The mark:** specified separately in [`logo.html`](pages/logo.html).

This document is the source of truth for everything except the mark. It is written to be portable —
no framework, no project-specific values, nothing that assumes a landing page or an admin panel — so
any Telemodai project can adopt it rather than restate it.

---

## 1. Principles

**Structure comes from lines, not shadows.** A card is a one-pixel border and one step of surface.
Shadows exist, but only for layers that genuinely float above the page. This is what gives the system
its flat, printed quality.

**The palette is closed.** Five surfaces, four foreground levels, two hairlines, two hues. Nothing
else. A closed palette is what makes an interface recognisable across pages built months apart, and
the tooling enforces it: the generated Tailwind layer clears the stock scales, so `bg-red-500` and
`text-2xl` do not exist in a project that imports this system. Unavailable rather than discouraged.

**One voice, two registers.** There is no serif in this system. Headings and body text are both sans,
and the hierarchy between them is built from size, weight and tracking rather than from a change of
face. That is a harder constraint than a serif-and-sans pair, and it has a cost worth stating plainly:
without the contrast a serif would give for free, the steps in the scale have to be large and the
tracking has to be deliberate, or the page flattens. §4 sets both so that they are not re-decided per
screen.

**Restraint is the aesthetic.** No gradients, no glows, no illustration, no pill shapes, and no colour
that is not doing a job. Every element that could be decorated and isn't makes the few deliberate
moves land harder. Exactly two hues clear that bar — see §3.

**Both scripts are first-class.** Russian and English are equal. A typeface that cannot set Cyrillic
cannot be in this system, however well it sets Latin.

---

## 2. Themes

Two themes, neither derived from the other. Dark is the default and the register the brand is
designed around; light is a full peer because the product cabinet needs it.

The themes are built on the mark's two polarities. The dark canvas is `oklch(0.1957 0 0)` — `rgb(21, 21, 21)` —
carrying the mark in `oklch(0.9491 0 0)`; the light canvas is `oklch(0.99 0 0)` carrying the mark in
`oklch(0.1776 0 0)` — the reverse and primary logo exactly as [`logo.html`](pages/logo.html) specifies them.

Dark applies by default. Light applies when the operating system asks for it, and `data-theme` on the
root element overrides both.

---

## 3. Colour

All palette values are authored in **OKLCH** in [`tokens.json`](tokens.json) and emitted verbatim into
[`css/tokens.css`](css/tokens.css). Lightness steps are perceptually even; achromatic neutrals use
chroma `0`. When a hex equivalent helps — export assets, legacy tooling — convert with
[`src/lib/color.mjs`](src/lib/color.mjs).

### Surfaces

Five levels. `surface-1` is always the page canvas and higher numbers are always more elevated — in
dark they ascend in lightness, in light the canvas is the whitest step and cards sit one step grayer.
Because the semantics hold in both directions, a component rule is written once and works in both
themes.

| Level | Role | Dark | Light |
|-------|------|------|-------|
| `surface-0` | Deepest well — footers, contrast blocks | `oklch(0.1776 0 0)` | `oklch(0.94 0 0)` |
| `surface-1` | **Page canvas** | `oklch(0.1957 0 0)` · rgb(21,21,21) | `oklch(0.99 0 0)` |
| `surface-2` | Cards, inputs, contained surfaces | `oklch(0.2264 0 0)` · rgb(28,28,28) | `oklch(0.97 0 0)` |
| `surface-3` | Hover, table rows, secondary panels | `oklch(0.2562 0 0)` | `oklch(0.95 0 0)` |
| `surface-4` | Top elevation — popovers, dropdowns | `oklch(0.2850 0 0)` | `oklch(1 0 0)` |

### Foreground

| Token | Role | Dark | Light |
|-------|------|------|-------|
| `fg` | Primary text | `oklch(0.9491 0 0)` | `oklch(0.1776 0 0)` |
| `fg-strong` | Maximum emphasis, icon glyphs | `oklch(1 0 0)` | `oklch(0 0 0)` |
| `fg-muted` | Helper text, captions, subheads | `oklch(0.7097 0.0093 84.58)` | `oklch(0.4780 0.0064 95.19)` |
| `fg-subtle` | Placeholders, disabled labels | `oklch(0.4780 0.0064 95.19)` | `oklch(0.7097 0.0093 84.58)` |

`fg-muted` and `fg-subtle` swap the same two greys between themes rather than adding new ones. That
is not economy for its own sake — it is what the contrast maths requires.

### Contrast, measured

Ratios against the page canvas, measured in the browser rather than estimated. [`system.html`](pages/system.html)
recomputes them live from the stylesheet, so they cannot drift from the palette. Open that page and
switch theme — the table updates from the computed OKLCH values.

Read the middle rows as the governing rule: the dark-muted grey is readable on dark and not on light,
the light-muted grey is readable on light and not on dark. This is why they are two tokens and not one
grey used loosely — using either in the wrong theme produces text that fails accessibility.

Thresholds are WCAG 2.1 AA: 4.5 : 1 for body text, 3 : 1 for text at 24px and above and for non-text
graphics such as a focus ring.

### Lines

| Token | Role | Dark | Light |
|-------|------|------|-------|
| `line` | Default hairline — card outlines, dividers | `oklch(0.2562 0 0)` | `oklch(0.9189 0 0)` |
| `line-strong` | Table separators, borders meant to be seen | `oklch(0.4128 0 0)` | `oklch(0.7097 0.0093 84.58)` |

### Accent

Two hues, each with exactly one job. Blue marks inline links, focus and selection. Red marks
destructive and blocked. Neither is ever a decorative fill, and there is no third.

| Token | Dark | Light | Role |
|-------|------|-------|------|
| `accent` | `oklch(0.6187 0.2067 259.23)` | `oklch(0.3327 0.0772 257.10)` | Links, focus rings, active state |
| `accent-surface` | `oklch(0.3327 0.0772 257.10)` | `oklch(0.9167 0.0399 263.66)` | Selection and active-row tint |
| `danger` | `oklch(0.6318 0.1815 31.93)` | `oklch(0.5241 0.1713 32.10)` | Destructive actions, blocked content |
| `danger-surface` | `oklch(0.2540 0.0584 29.76)` | `oklch(0.9189 0.0322 32.06)` | Blocked-row tint, destructive confirmation |

The accent swaps for a measured reason: the bright blue reads on a near-black canvas and fails AA for
body text on a light one, where the navy clears it. The focus *ring* keeps the bright blue in both
themes — as a 2px graphic it only needs 3 : 1.

`accent-surface` is tuned so `fg` stays readable inside a selection in either theme.

### Why red is the one exception

A second hue normally dissolves the discipline that makes a monochrome system read as deliberate, and
the rule here was originally no hue but blue. Red earns the exception on a domain argument rather than
an aesthetic one: this product moderates chats, so *allowed* against *blocked* is not a decoration on
top of the interface — it is the thing the interface is about. A colour that carries the product's
central distinction is doing work, which is the test every colour in this system has to pass.

`danger` swaps between themes for the same measured reason the accent does. The annotation red
`oklch(0.5892 0.1842 31.50)` manages only ~3.9 : 1 on either canvas, which clears the 3 : 1 graphics
threshold but fails AA for text, so each theme gets its own danger value.

**Red stays rare or it stops working.** A moderation log in which every blocked entry is tinted is a
log with no emphasis left in it. Prefer the neutral treatment — weight, border, a `fg-muted` label —
and reserve `danger` for the destructive action itself and for the single most important blocked
state on a screen.

### Still no semantic green or amber

Success and warning have no colour. A completed action is reported by text and state, not by turning
green. This is the same argument as before, and it still holds for everything except the one case
above: two hues with one job each remain legible as a system, five do not.

### Brand constants

`ink oklch(0.1776 0 0)` and `paper oklch(0.99 0 0)` are fixed by the logo specification and never
shift with the theme. `paper` matches the light page canvas (`surface-1`).

`guide oklch(0.5892 0.1842 31.50)` joins them. It is the measurement annotation on the specification plates — dimension
lines, construction guides, misuse crosses — and it is a constant rather than a themed value because
the plates it is drawn on are constants too: a figure demonstrating ink-on-paper stays ink-on-paper in
both themes, so an annotation that swapped with the page would be wrong half the time. It measures
3.9 : 1 on paper and 4.2 : 1 on ink, both clearing the graphics threshold.

`guide` is scoped to documentation and is never available to product UI. The two reds are near enough
to read as one family and far enough apart in role that confusing them is a mistake worth naming:
**if it is on a spec plate it is `guide`; if a user can click it or it describes their content, it is
`danger`.**

---

## 4. Typography

### Families

| Token | Family | Coverage | Use |
|-------|--------|----------|-----|
| `font-display` | **Geologica** | latin, latin-ext, cyrillic, cyrillic-ext, greek, vietnamese | Headings, display type and the wordmark — nothing else |
| `font-sans` | **Inter** | latin, latin-ext, cyrillic, cyrillic-ext | All functional UI — body, nav, buttons, inputs, labels, tables |
| `font-mono` | **Fira Code** | latin | Code, tokens, identifiers |

Geologica is a variable geometric sans (OFL-1.1, 100–900) in which Cyrillic ships as a first-class
subset rather than a retrofit, so a Russian heading and an English heading are the same face at the
same settings. Two properties earned it the display role. Its weight range is wide enough that one
family can carry a hierarchy on its own, which is what the absence of a serif requires. And being
geometric rather than high-contrast, it does not thin out at the bottom of the display range — an
18px `heading-sm` holds, which a delicate display serif would not.

Mono is only ever used for code and identifiers, which are not translated, so Latin coverage is
sufficient there.

Stacks: `Geologica, Inter, ui-sans-serif, system-ui, sans-serif` and
`Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif`. The display stack falls back to Inter on
purpose — if Geologica fails to load, the page loses its accent but keeps its register, which a drop to
Georgia would not.

**Keeping two sans faces apart.** Pairing a display sans with a body sans is a real risk: at similar
size and weight the two read as one slightly inconsistent font rather than as a hierarchy. Three
signals separate them here, and all three are needed:

| Signal | Display | Body |
|--------|---------|------|
| Face | Geologica, geometric | Inter, neutral grotesque |
| Weight | 500 | 400 |
| Tracking | −0.035em | 0 |

The tight negative tracking is the load-bearing one. It is what makes a heading read as *set* rather
than as large body text, and it is why the value is fixed in the tokens rather than left to taste.

### Weights

| Family | Ships | Permitted |
|--------|-------|-----------|
| Geologica | 100–900 variable | **500 only** |
| Inter | 100–900 variable | 400 default, 500 for emphasis and controls, 600 for small uppercase labels |
| Fira Code | 400, 600 | 400, 600 |

Display type is never bold and never light. Geologica offers nine weights and eight of them are out of
bounds; a heading that needs more presence gets a larger size, not a heavier weight. The generated
Tailwind layer clears the `--font-weight-*` namespace and re-declares only `normal`, `medium` and
`semibold`, so `font-bold` does not exist to be typed.

### Scale (admin app)

The **cabinet** uses the **standard Tailwind type scale** (`text-xs` … `text-4xl`), restored in
`assets/brand/css/theme-app.css`. Vendored `theme.css` still defines legacy semantic names
(`text-body`, `text-heading-sm`, …) for the marketing site — **do not use them in app Vue/CSS**.

Source of truth for sizes: `theme-app.css` `@theme` block + the role table below.

| Tailwind class | Approx. | Role in admin UI |
|----------------|---------|------------------|
| `text-xs` | 12px | **Below default** — badges, field hints, stat row labels, dense meta (`tm-meta`, `tm-detail-rows`) |
| `text-sm` | 14px | **Default UI** — body, nav, buttons, inputs, tables, forms (`body` in `main.css`) |
| `text-base` | 16px | Section titles (`tm-section-title`), rare emphasis |
| `text-lg` | 18px | Rare emphasis in running text |
| `text-xl` | 20px | Page titles (`tm-page-title`) |
| `text-2xl` | 24px | Secondary stat numbers (`tm-stat-sm`) |
| `text-3xl` | 30px | — |
| `text-4xl` | 36px | Primary KPI / hero stat numbers (`tm-stat`) |

**Hierarchy rules**

1. **Default text** — `text-sm` + `text-fg`. Secondary at the same level — `text-sm text-fg-muted`.
2. **One step down** — `text-xs` / `tm-meta` for hints, footnotes, side-panel rows (not smaller body everywhere).
3. **Page `h1`** — `tm-page-title` (`text-xl font-display …`).
4. **Section / card / modal `h2`–`h3`** — `tm-section-title` (`text-base font-display …`).
5. **Stats** — `tm-stat` (`text-4xl`) or `tm-stat-sm` (`text-2xl`) + semantic colour.
6. **Badges** — compact `AppBadge` (`text-xs`, tight padding).
7. **Dense summaries** — `tm-detail-rows` (`text-xs`) under a `text-sm` heading.
8. **Code** — `font-mono`; sample blocks may use `text-xs` or `text-sm`.

**Do not** use arbitrary font sizes (`text-[12px]`, `text-[13px]`, …) or legacy classes (`text-body`,
`text-caption`, `text-heading-*`) in app code.

Utility classes live in `assets/css/main.css` (`tm-page-title`, `tm-section-title`, `tm-stat`, `tm-stat-sm`, `tm-meta`, `tm-detail-rows`).

### Scale (marketing / documentation — legacy reference)

The vendored brand token file still defines a semantic scale for the landing site. The admin app does
not use it. For reference only:

| Legacy token | Size | Notes |
|--------------|------|-------|
| `caption` / `kicker` | 10px uppercase | Site/docs only |
| `body` | 14px | Site dense UI |
| `reading` | 16px | Long-form prose |
| `heading-sm` … `display` | 18–72px | Site headings |

### Wordmark

*telemodai* is set in Geologica 500 at −0.035em, lowercase, the same settings as a heading. The mark
and the wordmark therefore share one voice with the rest of the system, and there is no separate
logotype face to license or maintain. Lockup geometry — the size relationship to the mark and the gap
between them — is specified in [`logo.html`](pages/logo.html) §11 in mark units, not pixels, so it holds at
any size.

### Documentation header lockup

A second horizontal arrangement exists for **documentation and specification pages only** — the mark
beside a stacked wordmark and a one-line tagline. [`system.html`](pages/system.html) and [`logo.html`](pages/logo.html)
use it in their page headers; the product admin does not.

The mark still scales in **X** on the same ladder as the standard lockup: mark height `11X`, gap to the
text block `6X`. What changes is the block beside the mark — wordmark and tagline sizes are tuned
**per preset**, not by the `12X` wordmark rule, so the two-line stack reads as one unit rather than
towering over the mark. At every step the wordmark is deliberately shorter than `12X` would dictate.

| Element | Face | Role |
|---------|------|------|
| Wordmark | Geologica 500 at −0.035em | Same logotype settings as everywhere else |
| Tagline | Inter `body`, `fg-muted` | One line of marketing copy — not part of the logotype |

The tagline string, the preset ladder and the pixel sizes at each step live in
[`logo.html`](pages/logo.html) §11 as `SPEC.taglineLockup`. The current copy is *AI moderation for healthy
communities*. Neither the wordmark nor the tagline is exported as outlined SVG — lockups stay live
text in HTML (`logo.html` §11); raster exports are mark-only (see `assets/export/`).

| Preset | X | Typical use |
|--------|---|-------------|
| `hero` | 6 | Largest documentation opener |
| `page-header` | 3.75 | Page headers on `system.html` and `logo.html` |
| `section` | 3 | Section opener inside a long document |
| `compact` | 2 | Shortest practical documentation header |

Do not use this lockup in product UI, on marketing pages or in export masters — it is a documentation
chrome pattern, scoped like `text-kicker`. Full specimens and the export note are in
[`logo.html`](pages/logo.html) §11.

---

## 5. Rhythm

Base unit is **4px**, which is also Tailwind's base unit — so the numeric scale is deliberately not
redefined. `p-2`, `p-4` and `p-6` give 8, 16 and 24px with no configuration at all.

This is worth stating as a rule because getting it wrong is silent: defining `--spacing-4: 4px`
changes `p-4` from 16px to 4px and breaks every spacing utility in the codebase without raising an
error anywhere.

| Utility | `p-1` | `p-2` | `p-4` | `p-6` | `p-8` | `p-12` | `p-16` | `p-20` |
|---------|-------|-------|-------|-------|-------|--------|--------|--------|
| Result | 4px | 8px | 16px | 24px | 32px | 48px | 64px | 80px |

Only named constants are tokens:

| Token | Value | Role |
|-------|-------|------|
| `spacing-section` | 80px | Vertical rhythm between page sections |
| `spacing-card` | 12px | Interior padding of a card or input |
| `spacing-gap` | 8px | Default gap between adjacent elements |
| `container-page` | 1200px | Maximum content width |

---

## 6. Shape

| Token | Value | Applies to |
|-------|-------|------------|
| `radius-control` | 4px | Buttons, inputs, badges, small icon frames |
| `radius-card` | 8px | Cards, panels, framed screenshots |
| `radius-surface` | 16px | Large media containers |

Nothing rounds beyond 16px. Pill shapes are foreign to the system.

The mark is the one exception in the other direction: it has radius 0 and never acquires one.
Containers around it — app tiles, avatars — follow platform requirements rather than this scale, as
[`logo.html`](pages/logo.html) sets out.

---

## 7. Elevation

Shadows are whispers. Cards and buttons in their normal state carry none at all — a 1px `line` border
and one step of surface do the work.

| Token | Use |
|-------|-----|
| `shadow-card` | A card that genuinely floats above the page |
| `shadow-overlay` | Modals, popovers, dropdowns |

Both invert between themes so they stay visible in each: the overlay's 1px separating ring is white
at 10% on dark and near-black at 8% on light, and the card's drop shifts from black on dark to grey
on light. A grey shadow on a near-black canvas is invisible, which is why this is themed rather than
shared.

---

## 8. Components

Described by intent and token rather than markup, so the definitions survive any framework.
[`system.html`](pages/system.html) renders all of them.

**Ghost button** — the default button voice. Transparent background, 1px `fg` border, `fg` text at
`body` size weight 500, `radius-control`, 16px horizontal and 8px vertical padding. Hover fills with
`surface-3`. Disabled drops the border to `line` and the text to `fg-subtle`.

**Primary button** — filled inverse: `fg` background, `surface-0` text, no border, otherwise identical
to ghost. One per page. See §9.

**Destructive button** — ghost with a `danger` border and `danger` text. Hover fills with
`danger-surface`. Reserved for irreversible actions — delete rule, remove bot, confirm block. Never the
default button voice and never filled solid: a red fill would read as decoration rather than warning.

**Navigation link** — no background, no border. Inter `body` weight 400 in `fg`. The active item takes
a 1px bottom border in `line-strong`. Sits in a 64px bar closed by a `line` border.

**Section header** — `heading-lg` in `font-display`, `fg`. No eyebrow and no kicker label above it; the
size and tracking carry the hierarchy alone. Subhead below in Inter `lead`, `fg-muted`, which is where
the change of face does its work — the tighter, heavier line above against the plainer one below.

**Card** — `surface-2` background, 1px `line` border, `radius-card`, `spacing-card` padding, no shadow.

**Input** — `surface-2` background, 1px `surface-4` border, `radius-control`, `spacing-card` padding,
Inter `body` in `fg`. Placeholder in `fg-subtle`. Focus ring 2px `accent` at 2px offset.

**Badge** — `surface-3` background, Inter 11px weight 500 in `fg`, `radius-control`, 6px by 10px
padding, uppercase at +0.05em. Never a coloured fill.

**Footer** — `surface-0` background, Inter 13px in `fg-muted`, 1px `line` top border.

Deferred until there is content for them: data tables, code frames, feature tiles.

---

## 9. Emphasis and the primary action

The ghost button is the default voice, and inside the product it stays that way — many actions
compete there and none should shout.

A marketing page is different. It has exactly one job, which is sending the visitor to the cabinet.
A ghost button among ghost navigation gives that action no priority at all, so on marketing surfaces
the primary action takes the filled inverse treatment and everything else stays ghost.

No new colour is involved: filled inverse is `fg` on `surface-0`, both already in the palette. The
emphasis comes from inversion, which is the only amplifier a monochrome system has — and it works
precisely because it is used once per page.

---

## 10. Imagery

Telemodai is a web admin panel and a Telegram bot. Its honest imagery is its own interface.

**Primary.** Real product screenshots — the cabinet, the rule editor, the moderation log — in a
`radius-card` frame with a 1px `line` border. No mockup devices, no floating perspective, no
artificial glow.

**Secondary.** The mark's own geometry. A full-width 1px rule echoes the crossbar, and the 1X gap
from the logo construction is available as a spacing motif. Structural graphics come from the logo,
not from stock vocabulary.

**Icons.** Outline only, 1.5px stroke, monochrome in `fg-muted`. Never filled, never coloured.

**Not used.** Photography of people or places, 3D renders, gradient meshes, neon glows, illustrated
mascots, stock imagery of any kind. The system has no art direction for photography, and restraint
produces a better page than borrowed atmosphere does.

---

## 11. Do and don't

### Do

- Set every heading in Geologica 500 at −0.035em, 18–72px, and set nothing else in Geologica.
- Keep the surface order intact: `surface-1` is the canvas, higher numbers are more elevated.
- Let 1px borders carry structure. Reach for a shadow only when a layer genuinely floats.
- Check which grey is the muted one before using it — it depends on the active theme.
- Keep the accent to links, selection and focus, and `danger` to destruction and blocked content.
- Scale rhythm in 8 / 16 / 24 / 32 / 48 / 80px steps.

### Don't

- Don't set display type bold or light. Geologica ships 100–900; only 500 is in bounds.
- Don't reach for a third face. The system has a display sans, a body sans and a mono, and a fourth
  would make the display/body distinction unreadable rather than richer.
- Don't introduce a third hue. Success and warning carry no colour — only links and destruction do.
- Don't use `danger` for emphasis, or on anything a user can safely undo. It stops meaning anything
  the moment it appears twice on one screen for two different reasons.
- Don't use `guide` in product UI, and don't use `danger` on a specification plate.
- Don't use `text-kicker` in product UI. Section eyebrows belong on documentation pages only; the admin
  uses `heading-lg` with no label above it.
- Don't use the documentation header lockup (mark + wordmark + tagline) in product UI or on marketing
  surfaces — it is scoped to specification pages only; see §4.
- Don't use `oklch(1 0 0)` as body text on dark — `fg` is deliberately softer than paper white.
- Don't round beyond 16px, and never use pill shapes.
- Don't set body copy, `lead` or any control in Geologica, and don't set a heading in Inter. The two
  sans faces only stay legible as a hierarchy while each keeps to its own side.
- Don't loosen display tracking towards 0. It is the main thing separating a heading from large body
  text.
- Don't apply a gradient to any surface.
- Don't redefine Tailwind's numeric spacing scale. See §5.
- Don't treat `fg-muted` and `fg-subtle` as interchangeable — the contrast maths forbids it.
- Don't put anything load-bearing in `fg-subtle`. It fails AA in both themes by design.

---

## 12. Tokens and files

| File | Role |
|------|------|
| [`tokens.json`](tokens.json) | **The only file where a value is written by hand.** W3C design-token format, so design tools can read it. |
| `css/tokens.css` | Generated. Plain custom properties under `--tm-*`, for anything that can read CSS. |
| `css/theme.css` | Generated. The Tailwind 4 layer. |
| [`src/scripts/generate-tokens.mjs`](src/scripts/generate-tokens.mjs) | Turns `tokens.json` into `css/tokens.css` and `css/theme.css`. |
| [`src/lib/color.mjs`](src/lib/color.mjs) | Hex ↔ OKLCH conversion for migration and documentation. |
| [`src/scripts/generate-logo.mjs`](src/scripts/generate-logo.mjs) | Vector masters and raster exports under `assets/`. |
| [`pages/system.html`](pages/system.html) | The system rendered by itself, consuming `css/tokens.css` directly. |
| [`pages/logo.html`](pages/logo.html) | The mark: geometry, clear space, containers, exports. |

Regenerate after any edit to `tokens.json`:

```
bun brand/src/scripts/generate-tokens.mjs
```

Two CSS outputs because they answer two questions. `css/tokens.css` serves anything without a build step
— including the static pages in `pages/`. `css/theme.css` serves Tailwind, where themed values must go
through `@theme inline`: plain `@theme` resolves at build time and would freeze one theme into the
stylesheet.

```css
:root                { --tm-surface-1: oklch(0.1957 0 0); }
[data-theme="light"] { --tm-surface-1: oklch(0.99 0 0); }

@theme inline        { --color-surface-1: var(--tm-surface-1); }
```

Nothing is authored twice. Values appear in both generated files, but both come from `tokens.json`
through one generator, so they cannot disagree — the same arrangement that keeps `logo.html` from
contradicting its own numbers.

**Consuming a project.** Import `theme.css` and define nothing locally. No token values in
application stylesheets, ever. Utilities then read as `bg-surface-2`, `text-fg-muted`,
`border-line`, `text-heading-lg`, `rounded-card`, `max-w-page`.

**Portability.** This folder depends on no project: no framework, no build step beyond the generator,
no value specific to a landing page. It lives here while there is one consumer, and moves out as-is
when a second one needs it. Designing for extraction costs nothing now; extracting early would cost a
repository to maintain.

---

## 13. Open

**Display type below 18px.** The face and its tracking were judged at 72px and 28px, and 18px was
reasoned about rather than looked at. `heading-sm` is the one size in the scale where −0.035em on a
geometric sans could start to close up, particularly in Cyrillic, where the lowercase is wider and more
repetitive than in Latin. If it does, the fix is a per-size tracking exception on `heading-sm` alone,
not a change to the other three.

**Long Cyrillic headings.** Russian runs roughly 10–15% longer than English for the same content, and
`display` at 72px is where that first becomes a layout problem. No hero line has been set in both
languages yet, so the wrap behaviour is untested.

**Light theme in practice.** The light stack is derived rather than observed. It should be reviewed on
a real screen once the landing is built — the tokens are settled, but first-use polish may still need
a pass.

---

## Appendix A — App-only: moderation action colors

This appendix applies **only** to the admin app (`telemodai/app`). It is **not** part of upstream
`site/brand` and must not be copied back without an explicit product decision.

The core system keeps two hues (`accent`, `danger`). The moderation cabinet needs distinguishable
action labels in tables, KPI tiles, and charts. App extends the palette with **six semantic action
tokens** (authored in `assets/brand/tokens-app.json`, emitted to `tokens-app.css` / `theme-app.css`):

| Token | Role |
|-------|------|
| `action-warning` | Warning moderation action |
| `action-delete` | Message delete action |
| `action-ban` | Ban action (aliases `danger` where appropriate) |
| `action-reset` | Reset warnings |
| `action-unban` | Unban action |
| `action-pardon` | Pardon action |

Each has a matching `action-*-surface` for tinted rows when needed. Use `text-action-*` in UI;
Chart.js reads `--tm-action-*` via `lib/chart-theme.ts`.

**Do:** keep action colors for moderation semantics only; use neutral `fg` / `fg-muted` for non-action UI.

**Don't:** use action tokens for generic success/warning elsewhere; don't add more hues without updating this appendix.

---

## Appendix B — App-only: cabinet UI shape and emphasis

Applies **only** to the admin app. Overrides core shape tokens via `theme-app.css` (not upstream `site/brand`).

| Override | Core | App cabinet |
|----------|------|-------------|
| `radius-control` | 4px | 10px — buttons, inputs, chips |
| `radius-card` | 8px | 12px — cards, nested panels |
| `spacing-card` | 12px | 16px — default card padding |

**Primary CTA** in the app uses filled `accent` with `accent-on` label (not marketing inverse `fg` fill). Ghost buttons use `line` borders. Status badges are pill-shaped (`rounded-full`) with semantic `action-*` / `danger` tints where needed. Modals use `radius-surface` (16px).


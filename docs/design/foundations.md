# Foundations

What has landed. Every token below is in
[`src/app/globals.css`](../../src/app/globals.css), which is the only file in
the project allowed to contain a hex or a raw px value — this page is its prose
companion, and where the two disagree the stylesheet is right and this page is
stale.

## The idea

**There is no device. The identity is the restraint.**

Two structural signatures were drawn during the rebrand and both were rejected —
a ruled margin down the left, then a ruled page. The conclusion was not a third
attempt: this brand does not want a device. Its identity is Schibsted Grotesk at
density, zero radius, no ornament anywhere, and marine used strictly where it
carries meaning. Nearly everything else in this space is louder, and being
recognisably the quiet one is a position a reader can feel in ten seconds.

### The eight rules that decide every later question

1. **Never hard-code a hex or a raw px in product code — always a semantic
   token.** The club colour is the one exception, and it goes through the club
   mark function.
2. **If it is a number you can add up, it is monospaced.**
3. **Colour means something**: a verdict, a club, the brand, or interactive
   state. Nothing is coloured to be liked.
4. **Marine marks what you can act on, where you are or have been, or where the
   brand is speaking — and nothing else.** Never to fill space, never to
   decorate. It never signals a verdict, and a verdict colour never signals the
   brand.
5. **Borders separate. Radius is zero.** Shadow means "this floats" — dialogs and
   toasts only.
6. **Micro-labels and the three verdict words are the only uppercase.**
   Everything else is sentence case.
7. **Light is the default and needs no attribute**; dark re-points semantics
   only. Base values never change across themes.
8. **No gradients, no photography, no illustration, no texture, no pattern, no
   frosted glass, no emoji.**

---

## Colour

### Marine — the one colour the brand owns

| Token | Hex | Where |
| --- | --- | --- |
| `--marine-900` | `#0a3c42` | the brand as a surface, dark |
| `--marine-700` | `#0f5257` | the brand as a mark, light · as a surface, light |
| `--marine-400` | `#5fc0bb` | the brand as a mark, dark |
| `--marine-200` | `#a9deda` | muted ink on a brand surface |

All four steps of the board's ramp are declared and all four are spent, which
was not true when the rebrand landed: 900 and 200 came back when block headers
took the brand.

### Marine marks three things, and nothing else

**One — what you can act on.** A link. The focus ring. **The filled button** —
the primary action on a screen, which is the plainest case of the rule there is.
**The "Lineups out" badge**, which marks the fixture whose team news has landed
and is therefore the one you can open and judge — the badge appears on exactly
the rows that are links, so the mark and the affordance say the same thing. It
is an outline, not a fill; see the clause on the scoreline below.

**Two — where you are, and where you have been.** The active navigation item, as
marine text at 600 on `--surface-alt`. The 2px underline under a selected tab,
which sits under that tab alone and never spans the strip. **The 2px rule down
the leading edge of a watched fixture row**, which sits against that row alone
and never spans the block — structurally the tab's underline turned on its side,
and marked out from it only by tense: an underline says *here*, and this says
*you have been here*.

The category was called "where you are" until the watched mark joined it, and the
widening is real rather than a relabelling. Both halves are still the app
locating the reader in their own diary, which is what keeps them apart from
category three: a block header's rule is the brand naming a thing, and these
name where somebody stands in it. A mark for something the reader *might* do
belongs in category one; a mark for what the app itself is belongs in three.

**Three — where the brand is speaking.** The wordmark. The app icon. **A block
header's bottom rule** — the strip that names a card keeps its grey fill and
carries a 2px marine edge: a squad panel's club, a competition's name on
`/fixtures`, an index's sort, the scoreline's competition-and-venue line, a
landing panel's feature. **A Tag's outline**, which names a property of the product rather than a
piece of its data.

Both of those are edges rather than fills, and that is the pattern: **when the
brand names something it draws a line, and when it offers an action it fills.**
The filled button is the only marine fill in the app.

That third category is the one that changed after the rebrand shipped, and it is
worth being honest about why. The rule as first written named block headers
among the things marine may *not* touch, on the reasoning that a screen wanting
more marine is under-structured rather than under-coloured. That reasoning still
holds for everything else in the sentence it came from — **not card edges, not
dividers, not empty states, not stat tiles, not the scoreline itself, not a
verdict**, which are grey, ink and white.

**"Not the scoreline itself" protects the number, not the column it sits in.**
That clause was written when the only thing in a fixture's centre slot was a
score or a kickoff time. A row's centre slot is now a small state machine —
called off, Live, "Lineups out", the score — and two of those four are already
non-score facts drawn there in a colour, `LIVE_BADGE` in `--live` being the
older one. What the clause forbids is tinting the digits; a badge that stands
where the digits will go is a different object with a different job. What it got wrong was the block header,
which is not decoration and is not interactive either: it is the app saying what
this thing is, in the same voice the wordmark speaks in. The wordmark and the app
icon were already in a category that is neither "you can act on this" nor "you
are here", so the category existed; the block header belongs in it.

If a marine mark cannot be explained as "this is interactive", "this is where you
are" or "this is the brand naming something", it is wrong.

### The brand as an edge

A block header keeps `--surface-alt` and takes a **2px bottom rule in
`--brand`**. That rule is the whole of it: no fill, no brand ink, no second
token. `border-b-2 border-brand bg-surface-alt` is the entire treatment, and it
is the same string on all eleven of them.

**The fill was built first and taken back out, which is worth recording because
the argument for it still sounds good.** Marine filled every block header for a
day: `--brand-surface` at marine-700 in light and marine-900 in dark, with white
caps, a hover step, a muted ink for the counts, and a `tone` prop on the skeleton
primitives so their placeholder lines stayed visible on it. Four tokens and a
component prop, and all five are gone.

What killed it was not any one screen but `/fixtures`, which draws ten cards down
a page: ten filled marine bands is a coloured page with white gaps, not a quiet
page with a brand. **A block header is a label, and a label that out-shouts what
it labels is backwards** — the same fault the Tag had when it was filled, found
twice in one week. The 2px rule says the identical thing at a weight the object
can carry.

It also costs nothing. The rule is `--brand` itself — the colour as a mark, which
is what it was tuned for — so there is no second fill to keep legible in two
themes, no ink that has to be fixed across them, and no skeleton variant. The
marine ramp's 900 and 200 survive only inside `--brand-action-hover`.

**A rule is grey unless it is the brand naming a block or the app locating the
reader.** Not the card's own outline, not the divider between two rows, not the
rule under a note. So: a block header's bottom rule; a selected tab's underline;
a watched row's leading edge. Anything else marine and linear is wrong.

**This sentence used to say a marine line must be "the bottom of a block header"
or it is wrong, and that was already false when it was written** — the selected
tab's 2px underline is marine, is not a block header's bottom, and is listed two
sections up under "where you are". The rule was stated from the section it sits
in, which is about the brand as a *label*, and it quietly overruled a category it
was never arguing with. Marking a watched row is what made the contradiction
matter, but it did not create it.

### The brand as an action

| Token | Light | Dark |
| --- | --- | --- |
| `--brand-action` | `#0f5257` | `#5fc0bb` |
| `--brand-action-hover` | `#0a3c42` | `#a9deda` |
| `--brand-action-ink` | `#ffffff` | `#1c222b` |

The filled button, and **the only marine fill in the app** — everything else the
brand touches, it touches as an edge. A button is the one object whose job is to
be the loudest thing on its screen, which is what earns it the fill: it is the loudest thing on
its screen by job description, and the dark end of the marine ramp on a `#1c222b`
page is a dark box on a dark ground that stops reading as a button at all. So
this pair goes *light* in dark, and the ink flips with it.

The fill is written as `var(--brand)` rather than as the two steps it resolves
to, because that is what it means: **the button is the brand at full strength,
where a block header is the brand held back.** Retune the brand and both move.

The hover is the ordinary rule again — one step along the ramp, away from the
page — so 700 darkens to 900 in light and 400 lightens to 200 in dark. There is
no press colour: the step below each hover lands close enough to muted text to
read as disabled, so a filled surface takes the 1px transform alone, exactly as
it did when it was ink.

**`--surface-inverse` did not retire with it.** It still fills the selected
segmented button, which is a *state* rather than an action — and now that the two
no longer look alike, that difference is visible rather than merely true: marine
is something to press, ink is something already chosen. If a third filled thing
ever appears, that is the question to ask about it, and the answer is probably an
edge.

### Neutral ramps (base tokens — never change across themes)

Two ramps, not one read backwards — and since the dark retune, not even the same
cast. Light keeps a cool teal tint; dark is a neutral blue-grey. Dark's ink is
`#d7dde6` where light's paper is `#ffffff`, and its ground is `#1c222b` where
light's ink is `#101516`. Those near-misses are the point: a dark theme built by
inverting a light one looks inverted.

| Light | Hex | | Dark | Hex |
| --- | --- | --- | --- | --- |
| `--gray-0` | `#ffffff` | | `--gray-d-0` | `#d7dde6` |
| `--gray-1` | `#f3f5f6` | | `--gray-d-1` | `#9aa3b1` |
| `--gray-2` | `#eceff0` | | `--gray-d-2` | `#767f8d` |
| `--gray-3` | `#e3e7e8` | | `--gray-d-3` | `#525b69` |
| `--gray-4` | `#dde2e3` | | `--gray-d-4` | `#3a4351` |
| `--gray-5` | `#b4bdbe` | | `--gray-d-5` | `#303845` |
| `--gray-6` | `#8b9596` | | `--gray-d-6` | `#262e39` |
| `--gray-7` | `#5f6a6b` | | `--gray-d-7` | `#1c222b` |
| `--gray-9` | `#101516` | | `--gray-d-8` | `#161b22` |

Never a pure grey and never pure black: the tint is what keeps a page of them
from reading as a spreadsheet.

#### The dark ramp was retuned, and the numbers are the argument

**The first dark ramp spent its contrast budget exactly backwards.** It put ink
at 15.7:1 against the page, a card at 1.08 against that page, and a border at
1.23 against the card. The one ratio nobody needs was turned up until near-white
on near-black glared; the two that carry the layout — surface against page,
border against surface — were spent down to nothing, so a screen holding ten
cards read as a single flat slab.

This ramp trades them the other way:

| | before | now | AA needs |
| --- | --- | --- | --- |
| ink on page | 15.74:1 | **11.71:1** | 4.5:1 |
| card against page | 1.08 | **1.17** | — |
| border against card | 1.23 | **1.37** | — |
| muted text on card | 5.33:1 | **5.38:1** | 4.5:1 |
| faint text on card | 3.35:1 | **3.39:1** | 3:1 |

Nothing that was legible became less legible: muted and faint both moved *up*
slightly, and ink at 11.7:1 is still better than twice what AA asks. What changed
is that a card now reads as an object sitting on a ground.

**So the ground is `#1c222b` rather than something nearer black, and that is the
rule to keep.** A dark theme is not a competition to be dark. It is a page meant
to be read at night, and this one is legible without being lit. A future retune
that darkens the ground back toward black to look sleeker is re-making the
mistake this table records.

### Verdict tints — carried over unchanged

| Pair | Fill | Ink |
| --- | --- | --- |
| green (STANDOUT) | `--green-bg #e3f3ea` | `--green-ink #0b7d46` |
| red (FLOP) | `--red-bg #fbe6e4` | `--red-ink #c5372c` |
| yellow (MVP) | `--yellow-bg #fdf3d9` | `--yellow-ink #a17400` |

Dark counterparts lighten the ink and drop the tint to a dark wash of the same
hue: `--green-dark #4bcf8b` on `#1c3f2d`, `--red-dark #f28b82` on `#482a2b`,
`--yellow-dark #fdd663` on `#413620`.

**The rebrand did not touch a single one of these, and neither did the dark
retune touch the six inks.** They are the one part of the palette that means
something rather than sets a tone, so a change of tone does not get an opinion
about them.

**The three dark fills are the exception, and they had no choice.** They were
picked to sit just above a `#171e1f` card. Against the retuned ramp's `#262e39`
an unchanged fill is *darker* than the surface it sits on — a STANDOUT chip stops
reading as a chip and starts reading as a hole punched in the card. They were
lifted by exactly enough to sit above the new surface again, and every ink still
clears 5.3:1 on its own fill. **A verdict fill is pinned to the surface it sits
on: move the ramp and these move with it.**

### Semantic tokens

| Semantic | Light (default) | Dark |
| --- | --- | --- |
| `--page` | `#f3f5f6` | `#1c222b` |
| `--surface` | `#ffffff` | `#262e39` |
| `--surface-alt` | `#eceff0` | `#303845` |
| `--surface-sunken` | `#e3e7e8` | `#161b22` |
| `--surface-inverse` | `#101516` | `#d7dde6` |
| `--surface-inverse-hover` | `#303845` | `#e3e7e8` |
| `--border` | `#dde2e3` | `#3a4351` |
| `--border-strong` | `#b4bdbe` | `#525b69` |
| `--text` | `#101516` | `#d7dde6` |
| `--text-muted` | `#5f6a6b` | `#9aa3b1` |
| `--text-faint` | `#8b9596` | `#767f8d` |
| `--text-inverse` | `#ffffff` | `#1c222b` |
| `--brand` | `#0f5257` | `#5fc0bb` |
| `--link` | `#0f5257` | `#5fc0bb` |
| `--link-hover` | `#101516` | `#d7dde6` |
| `--overlay` | `rgba(0,0,0,.45)` | `rgba(0,0,0,.7)` |
| `--standout` / `--standout-bg` | `#0b7d46` / `#e3f3ea` | `#4bcf8b` / `#1c3f2d` |
| `--flop` / `--flop-bg` | `#c5372c` / `#fbe6e4` | `#f28b82` / `#482a2b` |
| `--mvp` / `--mvp-bg` | `#a17400` / `#fdf3d9` | `#fdd663` / `#413620` |
| `--live` / `--live-bg` | `#c5372c` / `#fbe6e4` | `#f28b82` / `#482a2b` |
| `--alert` / `--alert-bg` | `#c5372c` / `#fbe6e4` | `#f28b82` / `#482a2b` |

`--surface-alt` is **hover and block headers both**, where the previous design
gave headers a heavier strip of their own. A header that is a shade of the
surface it caps is the whole of what this design asks a header to be —
plus the 2px marine rule under it, which is the brand naming the block and
gave headers a heavier strip of their own. A header that is a shade of the
surface it caps, separated by a rule, is the whole of what this design asks a
header to be, and `--surface-header` retired.

`--surface-inverse-hover` is the one semantic that reads across both ramps, and
it is not a mistake. An inverse surface *is* the other theme's ground, so "one
step away from the page" is that theme's next step: in light, near-black hovers
to dark's `--surface-alt`; in dark, near-white hovers to light's
`--surface-sunken`.

**It is therefore the one light-theme value the dark retune moved** — `#1f2829`
to `#303845` — and that is the rule working rather than a leak. This semantic
reads the other ramp by definition, so retuning that ramp is supposed to move it.
Nothing draws it today, so the retune left the light theme visually untouched;
the first component to hover a filled ink surface will simply get a slightly more
visible step than it would have before, which is the direction the retune was
arguing for anyway.

### Three tokens hold the same red, and that is the rule rather than the exception

**`--live`** is a match being played. A match in play is not a verdict, and a
token named for one of the three would lie about why the colour is there — the
next person to retune FLOP's red would silently retune the live badge with it.
Red for a match in play is the broadcast convention, not a borrowing from the
verdict vocabulary, and the two never appear side by side: verdict words live on
player rows, `LIVE` on a scoreline.

**`--alert`** is that red again, for a write that did not save. It draws the
"That did not save" line under a squad row when the round trip fails — under the
verdict chips, and under the note, since a row holds two writes and either can
fail — and it is emphatically not `--flop` — a judgement and a failure are
different facts, and unlike `LIVE` these two *do* appear side by side, on the
same row, inches apart. A shared token would leave a red line under a red chip
with no way to tell which red meant what.

**Failure is text, not an icon.** The answer here is the same as for a called-off
fixture and an unrated chip: a word. "That did not save" plus the reason, in
`--text-caption`, with an inline "Try again".

### There is no `--info`, and that is a decision

It used to mark a note in blue. With marine as the brand, a second cool colour
competing to mean something is exactly what rule three forbids, so it retired
along with `--blue-bg`, `--blue-ink` and the whole Google-accent palette the
previous design was built from.

**A note is now grey.** The Notes stat tile and the diary's notes tally take
`--text-muted`; the `NOTE` badge is the resting chip — `--border` and
`--text-muted` on `--surface`. A note is real and is not a judgement, and grey is
what this system says for that. Where a note is read as prose it is muted text
behind a rule, not a tinted box.

**A match that was called off takes no token either.** POSTPONED and CANCELLED
draw as the resting chip, the same string. The reasoning runs the opposite way to
`--live`'s: that fact earned a token because it needed a colour, and this one
needs the absence of one. It shares its appearance with the `NOTE` badge and
that is tolerated rather than shared in code — they are different facts that
happen to look alike, they never appear on the same screen, and tying them
together in one constant would make retuning one silently retune the other.

### Two consequences that were accepted, not missed

**Marine sits one lightness point from dark-mode STANDOUT green.** `#5fc0bb` is
L56%; `#4bcf8b` is L55%. On a dark row a marine mark and a green chip therefore
read as a similar pair. Three alternatives were drawn and this was chosen anyway.
Recorded here so the next reader takes it as a decision rather than an oversight.

**`--link-hover` takes a link to ink rather than to a second brand step.** Marine
says a thing is a link; going to ink under the cursor says this particular one is
being engaged with, and it arrives together with the base stylesheet's underline.
It is the only state change available that does not reach for a second colour.

### Club colours are the one sanctioned exception to the no-hex rule

A club's colour is a fact about the club, not a decision about the interface, so
no semantic token could ever express it — there is no "Chelsea blue" in this
system and there must not be. Club colours therefore live in the database, on
`Team.colour`, and reach the DOM through an inline `style` on **a club mark**: the
crest chip, and a player's shirt tile. Product code still holds no hex.

A club mark's ink is picked by contrast against that colour and is `--gray-0` or
`--gray-9` — **base tokens, not `--text-inverse`**. The mark sits on a fixed
colour, so its ink must not move with the theme; the neutral ramps never change
across themes, which is exactly the guarantee this needs. Both go through one
function, so neither the fallback for an unseeded club nor the contrast
calculation exists twice.

Only a club mark may claim this exception, and a new one has to go through that
same function to count as one.

**A crest mark's letters take their size from the box.** The three letters are
`--text-caps` at 20px and 40px — the only role that is bold, tracked *and*
capitalised, which is what a club code on a saturated colour needs. At 64px they
are `--text-title` instead: 11px of type in a 64px square reads as a smudge in
the corner rather than as the identity of the screen it heads.

### Theming

Light is the default and needs no attribute. Dark is `data-theme="dark"` on
`<html>` (or any container — it re-points semantics on any subtree). Only
semantics re-point; base tokens never change.

### Links

`a { color: var(--link); text-decoration: none }` ·
`a:hover { color: var(--link-hover); text-decoration: underline }`

Selection: `--gray-3` behind `--gray-9` in light, `--gray-d-3` behind
`--gray-d-0` in dark.

---

## Type

Two families, both open-licensed and self-hosted through `next/font/google`:

- **Schibsted Grotesk** (400/500/600/700/800) — everything spoken. Variable, so
  the whole axis arrives in one file. Fallback `"Helvetica Neue",Arial,sans-serif`.
  A clean grotesque with stamina, chosen over a more characterful face because a
  squad row is not a place to be noticed.
- **DM Mono** (400/500) — everything **counted**: scores, tallies, shirt numbers,
  dates, minute marks. Fallback `ui-monospace,"SF Mono",monospace`. The family
  also has a 300 and the brand names it; nothing draws it, and a third file for a
  weight no role uses is bytes on every page load.

The rule: **if it is a number you can add up, it is monospaced.**

### Scale

| Role | Weight / Size / Line-height / Family | Tracking | Used for |
| --- | --- | --- | --- |
| `--text-hero` | 800 · 48px · 1.05 · Schibsted | `-0.035em` | The landing page's opening line, and nothing else |
| `--text-display` | 800 · 40px · 1.08 · Schibsted | `-0.03em` | Reserved for large headers |
| `--text-title` | 700 · 24px · 1.2 · Schibsted | `-0.025em` | Page titles ("Fixtures", player name) |
| `--text-heading` | 700 · 18px · 1.25 · Schibsted | `-0.015em` | Dialog titles, club names |
| `--text-body-lg` | 400 · 16px · 1.6 · Schibsted | 0 | A note where it stands alone as prose |
| `--text-body` | 400 · 14px · 1.5 · Schibsted | 0 | Default UI text |
| `--text-label` | 500 · 13px · 1.3 · Schibsted | 0 | Buttons, tabs, fixture lines |
| `--text-caption` | 400 · 12px · 1.35 · Schibsted | 0 | Sub-labels, meta |
| `--text-caps` | 700 · 11px · 1.25 · Schibsted | `+0.16em`, uppercase | Micro-labels, verdict words |
| `--text-wordmark` | 800 · 24px · 1.2 · Schibsted | `-0.04em` | The wordmark, and nothing else |
| `--text-score` | 500 · 40px · 1.05 · DM Mono | `-0.02em` | The match page's scoreline |
| `--text-stat` | 500 · 32px · 1.05 · DM Mono | `-0.02em` | Stat tile numbers, the 64px shirt tile |
| `--text-tally` | 500 · 20px · 1.1 · DM Mono | 0 | The 40px shirt tile, in a list row |
| `--text-data` | 400 · 13px · 1.25 · DM Mono | 0 | Shirt numbers, dates, counts |

All four monospaced roles are `tabular-nums`, which matters in the one place
monospace exists for: a column of counts where a 1 and a 7 have to sit over each
other.

Sizes available: 11, 12, 13, 14, 16, 18, 20, 24, 32, 40, 48.
Line heights: tight 1.05–1.1, snug 1.2–1.35, normal 1.5, loose 1.6.

**Tracking is negative and progressive above body size** — `-0.035em` at the hero
down to `-0.015em` at a heading. Schibsted Grotesk is wider than the face it
replaced, and letting it set loose at 48px is what would make a landing page look
like a slide. Caps go the other way at `+0.16em`, twice the old value: caps set
tight in a grotesque this even read as a block rather than as words.

**DM Mono stops at weight 500, and that is accepted.** JetBrains Mono went to
700, so the scoreline is quieter now than it used to be. A 40px score at 500 is
more instrument-like, which suits the direction, and the loss of emphasis on the
app's single most important number was taken knowingly. **It is not a bug to
fix.**

**DM Mono draws a slashed zero, and that is accepted too.** It is the second
consequence of the same choice, it was left undecided for longer than the first,
and it is settled now: the slash stays. It appears on every score, every stat
tile reading zero, every `0 MVP` in a split-bar legend and every date — a
profile of a player nobody has judged opens on four of them — and it is legible
and instrument-like at all four monospaced sizes.

**There is no way to keep this family and lose the slash, which is what makes it
a decision rather than a preference.** DM Mono has no `zero` feature; its five
stylistic sets cover commas and quotes, `a`, `g`, `3/6/9` and `f`, and none of
them touches the zero; there is no unslashed zero glyph anywhere in the file.
Nor is the slash a contour that could be deleted — it **cuts the counter into
two closed shapes**, so removing it means redrawing the counter rather than
dropping a path. The only faithful source for that shape is the font's own
capital `O`, whose ring and counter the zero is drawn from, and using it would
make `0` and `O` identical in a monospaced family whose reason for slashing the
zero was to keep them apart. A plain zero therefore costs a different family;
see `docs/roadmap.md` for the two that draw one by default.

**Caps appear in exactly two places**: the three verdict words and micro-labels.

**A note takes its size from where it is read, not from what it is.** On a dense
list — a squad row — it is `--text-body` in `--text-muted`, indented under the
name with a rule, so the row stays a row. `--text-body-lg` is for the screens
where a note is the content rather than an annotation on it.

---

## Spacing & layout

4px base, fine-grained at the small end because rows are dense. Carried over
unchanged:

`--sp-1 2` · `--sp-2 4` · `--sp-3 6` · `--sp-4 8` · `--sp-5 12` · `--sp-6 16` ·
`--sp-7 20` · `--sp-8 24` · `--sp-9 32` · `--sp-10 40` · `--sp-11 48` ·
`--sp-12 64` (px)

### Frame

| Token | Value |
| --- | --- |
| `--sidebar-w` | 232px |
| `--rail-w` (top bar height) | 56px |
| `--container` | 1120px max content width |
| page padding | 24px (`--sp-8`) at `md` and up, 16px (`--sp-6`) below |

Sidebar and top bar are fixed; content scrolls. Below `md` the sidebar is a
drawer — see Responsive.

### Responsive

The rest of this document is viewport-independent; this section is not.

**Breakpoints are Tailwind's defaults, unchanged**: `sm 640` · `md 768` ·
`lg 1024` · `xl 1280`. No custom scale, and a parallel set would give the project
two vocabularies for one idea.

**The frame's fixed widths stay fixed.** `--sidebar-w` and `--rail-w` never scale
with the viewport. Chrome has an intrinsic size set by its contents — a fluid
sidebar is dead space on a wide screen and truncates its own labels on a narrow
one. Layout responds by **changing arrangement at a breakpoint**, not by scaling
chrome. The sidebar is 232px or it is a drawer; it is never 180px.

**`md` (768px) is the frame breakpoint.** At and above, the sidebar is a grid
column. Below, it becomes an overlay drawer opened from a menu button in the top
bar. At 768px the sidebar plus padding still leaves ~490px of content; much below
that it does not.

**Author mobile-first — a CSS convention, not a statement of priority.** Desktop
is the primary target. But Tailwind's responsive variants are *min-width only*:
`md:` means "≥768px", and there is no plain "below 768" variant. So an unprefixed
utility applies at every width and prefixed ones layer on as the screen widens —
hence `h-(--row-h-lg) md:h-(--row-h)`, "44px, and 36px from 768 up". Inverting it
with `max-md:` mixes max- and min-width rules over one property, which is where
cascade bugs come from.

**Type does not scale with the viewport.** Every role above is one size at every
width, the hero included.

Content stays fluid up to `--container`.

### Control heights

| Token | Value | Where |
| --- | --- | --- |
| `--row-h` | 36px | Nav items, dense rows — at `md` and up |
| `--row-h-lg` | 44px | Touch rows: the same rows below `md` |
| `--control-h` | 32px | Default button, input, select, icon button |
| `--control-h-lg` | 40px | Large button, underline tab |
| — | 26px | Small button / small icon button |
| — | 28px | VerdictChip (md) |
| — | 24px | Tag |
| — | 64px | Crest mark, square — a club profile's header, beside the 64px shirt tile |
| — | 40px | Crest mark, square — the match page's scoreline |
| — | 20px | Badge, crest chip |
| — | 16×12px | League flag mark, beside the name it marks |
| — | 16px | Checkbox / radio box |
| — | 34×18px | Switch track (14px thumb, travels 16px) |

Borders: `--border-w 1px`, `--border-w-strong 2px`.

### Shape — zero, everywhere

**There is no radius token, and its absence is the specification.** Buttons,
fields, cards, chips, tiles, dialogs, toasts, badges, crest chips, flag marks:
all square. The switch and the radio keep their circles because they are not
boxes.

`--radius-sm`, `--radius-md`, `--radius-lg` and `--radius-pill` all retired, and
were deleted rather than set to zero. Eighty `rounded-md` classes resolving to
nothing is a radius you have to look up to discover is not applied; a class that
does nothing is worse than no class.

**There are no pills.** A pill in a zero-radius system is a contradiction, so the
pill tab went with `--radius-pill`. A **Tag** survives as a 24px square box in
`--text-caps`, **outlined in `--brand` with its words in `--brand`** on
`--surface`, with an optional glyph. It labels the thing it sits above rather
than doing anything, and what it labels is the product rather than any of its
data, which is what puts it in marine's third category.

**Outlined rather than filled, and that was tried the other way first.** A tag
filled with marine sat at the top of the hero pulling harder than the sentence
under it — a label out-shouting the thing it labels, which is the same fault that
later took the fill off the block headers. The edge and the words carry the brand
at a weight a label can hold. The landing page's "Free and
open source" is the app's only one.

### There is one kind of tab

An **underline tab** (40px, `--text-label`) changes the *view of the screen you
are already on* — which of your entries the diary shows, whether a player's
profile is reading his verdicts or his notes. The selected one carries a **2px
underline in `--brand`** and keeps its label in `--text`; the rest are
`--text-muted` going to `--text` on hover. Colouring the word as well would make
the tab compete with the active nav item for the same signal.

**The underline is under the selected tab alone — no rule spans the strip.** That
is what lets the strip wrap on a narrow screen without a selected tab on the
first row being detached from a rule under the last. It wraps rather than
scrolling sideways, because a horizontal scroller hides its own overflow.

There used to be a second kind. See below for the distinction it drew, which
outlives it.

### A scope control names what the page was drawn for; a select narrows what is on screen

The league was once a pill row on `/fixtures` and is still a `<select>` on
`/players`, and that was not two vocabularies for one idea.

A **scope control** names what the server drew the page for. It is a fact about
which page you are on, it shows every option at once, and there is nothing else
beside it. A **select** sits in a **filter row** — a search box, one or two
dropdowns, and any control that changes how the same list is drawn — and narrows
what has already been fetched. Those controls have to read as one set, and a
scope control among them would claim a different rank than the things beside it.

The test is what the control changes, not what it names: a select never decides
what the server queried. A filter row is also the only place a select belongs —
one on its own is a scope control, or a tab.

**Nothing draws a scope control today.** Its one instance was the league row on
`/fixtures`, and that screen is indexed by day now: a day pager is its only scope
control, and a league is a section heading under it. The pill that used to draw
it is gone for good. The distinction stays recorded because it is still the one
to apply, and a filter over which competitions a reader follows is the obvious
next thing to ask for it — **which control it should take is an open question,
not a settled one**, since the pill is no longer available to answer it.

### The filter row

A row of controls over a list, all at `--control-h` (`--control-h-lg` below
`md`), wrapping rather than scrolling. The search field grows; the selects take a
fixed width at `md` and up and share the remaining width below it.

Fields — text inputs and selects — take a `--border` outline on `--surface` and
**the field focus treatment rather than the ring**: see Interaction states. A
select carries `expand_more` in `--text-muted`; a search field carries `search` in
`--text-faint`, at the 18px size fields get. Both hide their platform appearance
so the closed box matches the field beside it, and a select stays a **native**
control underneath — the keyboard behaviour, the type-ahead and the phone's own
wheel are not worth rebuilding.

A **segmented toggle** ends the row: two or three icon buttons, square at the
control height. The selected one fills with `--surface-inverse` — ink, not
marine, because it is a state rather than an action; see **The brand as an
action**. Its glyph does
**not** fill — the fill rule means "on" for the states listed under Iconography,
and the inverse fill already says it here.

---

## Elevation

**One shadow, not three.**

| Token | Value | Where |
| --- | --- | --- |
| — | none | Cards, tiles, rows, chips — the default |
| `--shadow-3` | `0 8px 24px rgba(0,0,0,.18)` | Dialogs and toasts only |

`--shadow-1` and `--shadow-2` retired with the rebrand. If something looks like
it needs to float, it needs a rule instead. Dark deepens the alpha to `.8`,
because a soft shadow is invisible on a ground this dark.

`--focus-ring: 0 0 0 2px var(--surface), 0 0 0 4px var(--brand)` — **a 2px marine
ring with a surface-coloured gap**, so it stays legible against whatever it sits
on. Marine, not ink: the ring is the brand marking what you can act on, and
it is the clearest case of the rule. `--border-focus` retired into `--brand`.

---

## Motion

Carried over unchanged, and still the complete inventory.

| Token | Value |
| --- | --- |
| `--dur-1` | 80ms |
| `--dur-2` | 140ms |
| `--dur-3` | 220ms |
| `--dur-4` | 320ms |
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` |
| `--ease-out` | `cubic-bezier(0,0,0,1)` |
| `--ease-in` | `cubic-bezier(.3,0,1,1)` |

The standard hover transition (`t-hover`) is `background-color, border-color,
color` at 140ms `--ease-standard`.

- Colour crossfade on hover — 140ms.
- Dialog and toast: fade + 8px rise — 220ms `--ease-out`. Scrim fades at 140ms.
- Switch thumb slide — 140ms.

Nothing else animates. No bounce, no spring, no scale-in, no page transitions, no
skeleton choreography. **All durations collapse to 0 under
`prefers-reduced-motion: reduce`.**

---

## Interaction states

**Hover** — surfaces move one step away from the page (`--surface` →
`--surface-alt` → `--surface-sunken`); bordered controls darken their border to
`--border-strong`; muted text goes to `--text`. Never opacity fades.

**"One step" means one step along the ramp, away from the page — not always
downward in value.** The dark theme already reads that way: `--surface` `#262e39`
hovers to `--surface-alt` `#303845`, which is lighter. A **filled surface**
inverts the direction for the same reason, so `--surface-inverse` hovers to
`--surface-inverse-hover` and `--brand-action` hovers to `--brand-action-hover` —
which is darker in light and lighter in dark, since the fill itself swaps ends of
the ramp between the two.

**A selected control is not a filled button.** A selected segmented button and a
selected verdict chip take no hover colour at all — clicking one again is a
no-op, and press plus focus is affordance enough.

**Press** — one step darker again, plus `translateY(1px)`. No scale. A filled
surface takes the transform alone, and so does a tint: neither has a step below
it that is not close enough to muted text to read as disabled.

**Focus** — `--focus-ring` on `:focus-visible`. Fields instead take
`border-color: var(--brand)` plus `box-shadow: inset 0 0 0 1px var(--brand)`,
which reads as a 2px border without the element changing size and pushing the
layout around. Focus is never removed.

**Disabled** — `opacity: .4`, `cursor: not-allowed`, no other change.

**Error** — border goes `--flop`; the hint line is replaced by the error message
in `--flop`.

**Verdict states** — resting is a plain outlined chip in muted grey; this
matters, because most players stay unrated. Selected fills with the verdict tint
and colours the border and label. There is no third "neutral" state — unselected
*is* average.

---

## Iconography

**Madooo's own set.** Thirty-five glyphs, drawn to one grammar, shipped as inline
SVG. Material Symbols retired with the rebrand: it was chosen to sit with the
Google Slides look this design replaces, and its rounded terminals and generous
curves read soft against a zero-radius, squared system.

### The grammar

| | |
| --- | --- |
| Grid | 20 × 20, with a 1-unit safe margin no ink crosses |
| Stroke | 1.75, uniform, never tapered |
| Caps | Butt — squared ends, no rounding |
| Joins | Mitre — sharp corners |
| Radius | Zero, except where the object is genuinely round |
| Colour | `currentColor`, always. Never its own |
| Fill | Means "on". Nothing else fills |
| Ships as | Inline SVG, from one sprite per document |

Butt caps and mitre joins are the whole reason this set agrees with the type.
Material rounds both, which is exactly why it read soft here.

The stroke is in the viewBox's own units, so it scales with the box: 1.75 of
twenty is 1.75px at the default size and 1.23px at 14. That is the behaviour a
font had, and it is why the small sizes stay light rather than going gluey.

**Sizes**: 14 in badges and micro-labels, 16 in chips, 18 in buttons and fields,
20 default, 22 for large icon buttons.

### Fill means "on", and only the star can take it

An applied verdict fills. Nothing else does — not the active nav item any more,
which carries marine and weight 600 instead, because filling `view_agenda` or
`stadium` would put a solid black shape in a sidebar of line drawings.

**Only a closed outline has an inside to paint, and in this set that is the star
alone.** Every other glyph is one or more open paths; filling one would close it
implicitly and draw a wedge. `<Icon filled>` therefore honours the prop for
`star` and ignores it elsewhere — the two arrows and the note carry their state
in the chip's tint, border and ink, which is where the design put the weight in
the first place. The list is `FILLABLE` in
[`src/components/icon-paths.tsx`](../../src/components/icon-paths.tsx).

### The vocabulary

`add_comment` · `arrow_forward` · `article` · `calendar_today` · `check` ·
`chevron_left` ·
`chevron_right` · `close` · `dark_mode` · `delete` · `edit_note` ·
`expand_more` · `grid_view` · `groups` · `how_to_reg` · `inbox` · `light_mode` ·
`lock_open` · `menu` · `more_horiz` · `notifications` · `search` · `settings` ·
`share` · `sports` · `sports_soccer` · `stadium` · `star` · `trending_down` ·
`trending_up` · `trophy` · `two_pager` · `view_agenda` · `view_list` ·
`visibility`

The names are Material's, kept deliberately: they are the accurate word for what
each glyph shows, changing them would have touched every call site for nothing,
and `star` is still a star.

The list that binds is `ICON_NAMES` in
[`src/components/icon-names.ts`](../../src/components/icon-names.ts), which is
both the type `<Icon>` accepts and the list the sprite is built from. Geometry
lives in `ICON_PATHS`, keyed by that same type — so a name with no drawing behind
it is a compile error, and a drawing nothing can name is unreachable. This
paragraph is their prose companion and can fall behind them; the arrays cannot.

### Three departures from Material, on purpose

`settings` is **sliders, not a gear**. A gear is a wheel of teeth, which needs
curves and fine detail in every direction and collapses into a blob below 18px.
Three rails with handles says the same word and survives 14px.

`view_list` is **dashes and lines, not squares and lines**. A leading square wide
enough to read needs a channel wide enough to survive a 1.75 stroke, and the two
together did not fit three times over.

`edit_note` has **no pencil**. Three ruled lines say "written" without putting a
tool in the picture, and a pencil at 14px is a diagonal smudge in every icon set
that has one.

`stadium` is worth naming too, for a reason that is not drawing: **representing a
club by its ground rather than its crest sidesteps the trademark question
completely**, which is the same instinct that keeps `Team.logo` stored and never
rendered.

### The rule inverted, and what that changed

The previous foundations said: *"No emoji, no unicode glyphs as icons, no
hand-drawn SVG. If a glyph does not exist in Material Symbols, use a word."* That
was right for its situation — one amateur glyph beside a professional set looks
broken, so the set was the authority and anything outside it was banned.

With a bespoke set, **our set is the authority and the rule inverts**: every
glyph is drawn by us, to the grammar above, and a glyph from anywhere else is
what is now banned. The two documented exceptions below are unaffected, because
neither is an interface glyph.

The consequence is that **"use a word" stops being a fallback and becomes a
design choice**. POSTPONED, the unrated chip and "That did not save" are words
because a word is right there, not because Google had no picture. There is no
glyph we could not draw for "in play"; there is no *good* one, which is a
different sentence.

### The set grows by drawing, not by spending

`article` is the thirty-fifth, drawn for `/changelog` because nothing in the
thirty-four meant it. That is the rule the inverted one above implies and is
worth stating outright: **when a screen needs a mark the set does not have, the
answer is a new glyph to this grammar — not the nearest glyph that already
exists.** A near-miss is worse than an absence, because it teaches the reader the
wrong word. `notifications` shipped in that slot first and is the case in point:
a bell promises an alert, and the changelog is a page you go and read.

The bar for adding one is that the meaning is genuinely absent, not that the
existing glyph is slightly off — a set that grows on every screen's preference
stops being a vocabulary. What is cheap is the drawing; what is expensive is a
reader having to learn thirty-five marks instead of twenty.

**It took three drawings, and each one failed a different test — which is the
useful part.** `notifications` failed on *meaning*: a bell promises an alert. A
`history` clock — a ring with a gap across the top and an arrowhead sitting on
the gap — failed on *form*: an open contour with something perched in the break
reads as a rendering fault rather than a decision, and no adjustment of the
arrowhead fixed it, because the arrowhead was never the fault. A megaphone
closed the contour and failed on *voice*: it announces, where this page is read,
and the Voice section below is explicit about not selling.

So the three tests a new glyph has to pass are the right word, a shape that
reads as finished, and the register the app speaks in. **A closed silhouette is
the safer shape**, and a glyph made of an interrupted contour should be treated
as suspect until it has been seen at the size it ships.

The arrowhead's four passes are worth keeping for a separate reason: every one
of its failures was invisible at 14px. Arms shorter than about twice the stroke
draw a blob rather than a chevron, and a head pushed out along the radius or
splayed wide merges an arm into the ring and fills a wedge. Which is the deeper
version of the lesson `lock_open` taught below. **A glyph is judged at 100px
*and* at the size it ships** — the first finds the geometry errors, the second
finds out whether it reads at all. The clock passed the first and failed the
second.

### The one glyph to keep watching

`sports_soccer` is the busiest thing in the set by a distance — a circle, a
pentagon and five spokes is eleven segments inside twenty units. If it fails at
14px, **the agreed fix is a plain circle with one pentagon and no spokes**, which
stops being a football and becomes a ball. Do not redraw it some third way.

### A national flag is an identity mark, not an icon

The rule above bans glyphs from outside our set because anything else is an
attempt to say what an interface glyph should be saying. A flag competes for no
slot. It says *which* competition, the way a crest chip says which club, and
there is no drawing of "England" that belongs beside a note glyph and a chevron —
it is not a glyph we declined to draw, it is not that kind of thing. `trophy`
still means competition and is unaffected. The ban on illustration at the top of
this page is likewise about drawing, and a vendored flag is not a drawing.

So a flag answers to the club-mark rule rather than to this one, and takes the
same kind of bar. A flag may be drawn where all four hold:

1. **It is data, not a decision.** It renders `League.country` as the sync stored
   it. Nothing at a call site chooses which flag appears.
2. **It goes through one function** — `flagClass` in
   [`src/lib/leagues.ts`](../../src/lib/leagues.ts) — so the fallback exists once,
   the way `crest` holds the club mark's.
3. **Its fallback is nothing at all.** A country the map does not know draws no
   mark and no gap, and the row is exactly what it was before flags existed. This
   is the clause that makes the map legal against `AGENTS.md`'s first
   non-negotiable: a fifth league still costs one environment variable, and its
   flag is an afterthought rather than part of the price.
4. **It sits beside the name it marks, never instead of it**, and is
   `aria-hidden`. The accessible name is the league's name, which is already
   there.

The files are four 4:3 SVGs in `public/flags/`, vendored from flag-icons under
MIT, drawn as a `background-image` at 16×12 with a 1px inset ring in `--border`.
The ring is not decoration: England is a white field, so it has no edge on
`--surface`, and none on any pale fill. Italy needs the same along the top and
bottom of its white centre band.

Emoji flags remain out, and doubly. The first list on this page bans emoji
outright, and Windows ships no regional-indicator glyphs, so a large share of
readers would get two letters in a box — with England worse still, since it needs
a subdivision tag sequence and 🇬🇧 would be wrong.

**Only a competition's country may claim this.** A player's nationality is a new
claim about a person rather than about a competition, and would have to be argued
on its own rather than inherited from here.

### GitHub's mark is a second identity mark, and the only one

The same reasoning, one step further. The octocat is not a drawing of ours and
competes for no slot in the vocabulary: it says *which* site the link goes to,
exactly as a flag says which country. It is somebody else's mark rather than an
interface glyph we could have drawn.

It marks the repository in three places: the top bar of the app shell, the
landing page's "View on GitHub" button, and the landing page's "Free and open
source" tag.

**The third widened the bar, and it is recorded rather than smuggled.** The rule
below used to read "only where the repository is *linked*", and the tag is a
label that links nowhere. What it says is *which* source — the same thing the
mark says on the button — so the mark is naming the repository rather than
decorating a claim, which is the job it was admitted for. If that reads as a
stretch, the honest fixes are to make the tag a link to the repository, which
puts it back inside the original rule, or to give the tag no glyph at all. The button held `code` at
first, on the reasoning that a glyph is quieter beside five words of explanation.
That was wrong about what the mark is for. `code` means *source* generically, so
the button said "some code lives behind this" where the mark says which site you
land on — and a visitor reads the destination off the octocat before reading the
label.

What forced the exception is that "use a word" had already been tried and failed.
The link first sat at the sidebar's foot as a labelled row, and borrowing
`NavItem`'s row height, icon column and hover fill made it read as a fifth
destination. The mark is what lets it be recognised without being read, which is
what lets it stop being a row at all.

It takes a bar of its own:

1. **One mark, and only where the repository is named.** What is fixed is the
   mark, not the count: anything pointing at the repository takes the octocat,
   and a *second foreign glyph* — some other brand, some other drawing — is a new
   decision, not a precedent this section already granted.
2. **It is inline SVG, not a file in `public/`** — the one way it differs from the
   flags, and not a preference. An `<img>` cannot inherit `currentColor`, and the
   mark has to take its colour from the control holding it and invert with the
   theme.
3. **It is `aria-hidden`, and the anchor carries the name.** "Source on GitHub".
4. **It sits 2px under whatever glyph it stands beside.** 20px in the top bar,
   where the toggle is 22px; 16px in the landing button, where a button glyph is
   18px; 12px in the tag, where a tag glyph is 14px. A solid silhouette at the same nominal size as a 1.75 stroke puts far
   more ink on screen; matching the boxes rather than the weights made it the
   loudest thing in a bar meant to be quiet.

GitHub's brand guidelines permit the mark for linking to a repository, which is
the whole of what it does here. **This is not the licence club crests have** —
`Team.logo` and `League.logo` still render nowhere, and this section grants them
nothing.

---

## The wordmark, and the app icon

**The wordmark is the word**, set in Schibsted Grotesk 800 at `-0.04em`, in
`--brand`. It is not a logotype and takes no custom drawing — which is what keeps
it free to be rendered as live text anywhere, including in a page title or an
email, staying selectable and searchable wherever it appears. It has its own type
role, `--text-wordmark`, rather than borrowing `--text-title`: a page title and a
wordmark are different things, and sharing a class would mean retuning headings
retunes the brand.

Clear space on all four sides is the cap height of the mark. Never outlined,
never stretched, never in a verdict colour, never on a club colour.

**The app icon is the letter M, white on marine, square.** It is the one place the
brand works with no words around it, at 40px on a home screen. The known cost is
distinctiveness — a marine square with an M is a shape many apps already have —
and that was accepted for v1.

**Built.** `src/app/icon.png` (192), `apple-icon.png` (180) and `favicon.ico`
(16/32/48) are the real letterform, generated by `npm run icons` from Schibsted
Grotesk ExtraBold and committed. Full-bleed squares with no radius of their own:
iOS applies its own mask, and drawing a corner here would put a radius in a
system that has none. The marine is `--marine-700`, the light value, because a
home screen has no document to read a theme off — the icon does not theme.

The one hex outside `globals.css` lives in that script, and it is not an
exception to rule one: the rule governs product code, and a PNG cannot hold a
CSS variable.

An alternative mark — the three o's, on the reasoning that the genuinely unusual
thing about the name is that it has three, and that three marks in a row reads as
more than one person — is **held for the day a social layer lands**, not
scheduled. A mark that changes when the product changes is a legitimate move
rather than an inconsistency, provided it is planned.

---

## Voice

Warmer than it was, still restrained. It speaks to a person rather than reporting
a state, and never becomes chatty. **No exclamation marks, no apologies, no
"Oops".** An error says what happened and what to do about it.

The strings the rebrand changed, as the register in worked examples:

| Where | Was | Is |
| --- | --- | --- |
| Metadata description | A personal database for the football you watched. | The football you watched, in your own words. |
| Diary subtitle | Everything you have recorded this season, newest first. | Everything you have written this season, newest first. |
| Empty diary | Nothing here yet — start by opening a fixture and rating the players. | Nothing here yet. Start after the next match. |
| Failed save | Not saved — something went wrong. | That did not save — something went wrong. |
| No team sheet | No squad yet | Team news is not out yet |
| Suggestion dialog | Read by the person who builds this. There is no reply. | Read by the person who builds this. You will not get a reply, but it is read. |

The same register governs every string not listed. Two sentences beat one
sentence with an em dash and an imperative bolted on; say the fact, then say what
to do.

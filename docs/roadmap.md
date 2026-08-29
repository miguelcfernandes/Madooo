# Roadmap

Where the project stands. Update it as things land — it is the file that lets a
fresh session pick up without the previous conversation.

How the system *works* is not here. That is
[`architecture.md`](architecture.md), organised by subsystem: read the section
you are about to touch before writing code in it. **Why a slice was built the way
it was is not here either.** Each step below names its squash commit, and that
commit message is the account of the slice — written once, at the moment the
reasoning was fresh, and better placed there than restated in a file every
session reads.

**Updating this file, when a slice lands.** Update every one of these that
moved, and nothing else:

- **Current state** — only if the slice changed what the app *is*: a screen
  gained, a screen's job changed, a line of the inventory moved. Never a
  paragraph narrating the slice.
- **Built** — one line. The commit hash is filled in when the slice lands on
  `main`, which is the author's word to give.
- **Not built, and why** — what the slice deliberately left out: one sentence of
  what, one of why. Delete any entry this slice built, or settled against.
- **Launch checklist**, if a box moved.
- **Long-term remarks** — a far higher bar, stated at that section. Most slices
  add nothing.
- **Open decisions** — remove what the slice settled, add what it opened.
- **Last updated** date.

**Nothing else goes here.** Not what was learned, not why an approach was
chosen, not what went wrong on the way. All of that is either a fact about the
system, which belongs in [`architecture.md`](architecture.md) under its
subsystem, or the story of the work, which belongs in the squash commit.

**Do not plan the next slice here, or in `architecture.md`.** No task lists, no
ordering, no "first do X then Y". The next slice is scoped when it is asked for,
against the app as it stands then; a plan written now would be written blind and
would quietly become the plan by default. "Not built, and why" is the exception
that proves it — it records what was *declined* and the argument for declining,
which is the opposite of an instruction to build something. The tell is
grammatical: a remark states what *is* true and survives being read a month
later, while a plan uses imperatives — "add X", "set up Y".

**Last updated:** 2026-08-29 (team of the week)

> **The rebrand is built.** **"Field Notes"** — Schibsted Grotesk and DM Mono on
> a marine brand colour, zero radius everywhere, one shadow, and glyphs of our
> own in place of Material Symbols — is in the code, and
> [`design/foundations.md`](design/foundations.md) describes it. The board it was
> agreed on and the "what we agreed" file that pointed at it are both gone: once
> the design has landed, keeping either would give the project three sources of
> truth. So are `colour.png` and `type-and-space.png`, which documented the
> palette and scale it replaced.
>
> One warning survives the file it was written in: **the `next` branch is an
> abandoned earlier attempt at a *different* rebrand** — "Masthead", set in
> Agency FB, with three unrelated leagues — and must not be built on or merged.

---

## Current state

**Seven leagues, on API-Football's Pro tier.** `SEASON=2026` and
`LEAGUES=39,94,140,135,78,61,113`: the Premier League, the Primeira Liga, La
Liga, Serie A, the Bundesliga, Ligue 1 and Allsvenskan. All seven calendars are
in the database — 380 matches, 306, 380, 380, 306, 306 and 240.

**Allsvenskan is the first league here that runs on the calendar year**, and it
is the first to join already half-played rather than on an opening weekend.
`SEASON=2026` names its 2026 season correctly and would still be the right value
in January, when the European leagues are mid-season and this one has not
started — so it cost the same one variable as every league before it.

**Which fixtures have squads is the schedule's answer, not a fact to record
here.** The scheduled run asks for a team sheet from 45 minutes before each
kickoff, so a league joins the app's populated half on its own opening weekend
with no commit. Read the current state from the database rather than from this
paragraph.

**Every screen the design draws is built**, and `/fixtures` has since been
rebuilt past its drawing:

- `/` — the landing page: a header, a hero beside a mock match card, three
  features drawn as specimen panels, an open-source line, a footer. It reads
  nothing, which is what keeps it prerendered, so its fixture and its three
  totals are invented. Seen only signed out; a visitor with a
  session is sent to `/fixtures`.
- `/fixtures` — one calendar day at a time across every competition, cut into a
  section per league in a written-down popularity order, under a pager that steps
  to the previous and next day with football in it. A bare address is always
  today. Four season tiles above it; a 2px marine rule down the leading edge of
  every row the reader has written in, and nothing on the rest. A match called off
  draws POSTPONED or CANCELLED where its kickoff would go; one in play draws
  LIVE; one with no squad says so and does not navigate.
- `/matches/[id]` — a scoreline card over both matchday squads, each club's
  eleven above its bench. Every player row carries three verdict chips and a note
  button, and a "Your verdicts" panel sits under both benches. Either write
  failing draws a "Not saved" line with a retry rather than silently reverting.
- `/diary` — four tiles over three tabs in `?view=`: **All** and **With notes**
  list judgements newest-first, dated by when they were written; **Matches**
  lists a row per match recorded in, dated by kickoff, naming the MVP. Every list
  is cut into calendar months.
- `/players` and `/teams` — directories rather than diaries: every player with a
  squad row this season, and every club that has played. Search, a league filter,
  five sorts and a rows-or-cards toggle, the last three remembered in
  `localStorage`.
- `/players/[id]` and `/teams/[id]` — profiles, each over four tallies and a
  split bar, with the way back carried in `?from=`. A player's profile carries
  a third tab, **Teams of the week**, drawn only for the few players who are in
  one; it lists them as the same pitch cards the list draws.
- `/changelog` — what has changed in the app, newest first, cut into calendar
  months. Reached from a bell in the top bar and from nowhere else. The entries
  are a hand-written module in the repository, so this is the one route under
  `(app)` that reads nothing, and the only prerendered screen behind the login.
- `/team-of-the-week` — **TOTW** in the sidebar, above Diary, and the first
  screen that makes something *out of* the diary rather than listing it. The
  index opens a dismissible modal on a reader's first visit, pointing at the
  suggestion box for anything that looks wrong, over a grid of saved
  elevens, each **drawn as its own pitch** rather than
  described in a row: up to three across, headed by the name the reader gave it,
  footed by the span it covers and the competitions it was drawn from — flags,
  or the words "All competitions" — and the whole card opens it. `/new` is the
  builder: a span of days and a set of competitions in the URL, the pool of
  everyone marked MVP or standout in them down the right in four position
  blocks, and a pitch on the left that fills as names are tapped. The
  competitions open **unticked**, split into the big five and the rest, with a
  Select all beside them. Six formations, and the shape a saved team stood in is
  counted off its own picks rather than stored. Saving asks for a name, offering
  two or three it can build from the span and the competition.
  `/team-of-the-week/[id]` is the graphic — a pitch drawn in rules on two
  neutral surfaces, with club colours and a star on the MVPs — over the eleven
  read back as a list, and a delete behind a confirmation.

Every screen renders in light or dark, light-first for everyone, toggled from the
top bar. The bar also carries a labelled "Suggest a feature" button: what is
typed there is stored against the sender's account and read with
`npm run suggestions` from a laptop. There is no screen for it and no reply.

The judgements from 2024 are still on the **development** branch and on no
screen, since every read filters by season; they were the author's own test data.

- Next 16.2.12 (App Router, Turbopack), React 19.2.4, Tailwind 4, TypeScript
- Prisma 7.9.1 against Neon Postgres, via the `@prisma/adapter-pg` driver adapter
- Clerk 7.x for auth, with Google and email/password enabled, on a production
  instance bound to `madooo.app`
- Pushed to `github.com:miguelcfernandes/Madooo`, one short-lived branch per
  slice, squash-merged into `main` once the author says it can land
- Deployed on Vercel from `main`, built with `prisma generate && next build`;
  Production reads the production Neon branch, Preview the development one.
  [`vercel.json`](../vercel.json) pins the functions to `lhr1`, the region both
  Neon branches are in
- `scripts/verify_api.py` proves the API works; raw payloads sit in `scratch/`
  (gitignored) and are what the schema was designed against
- `npm run db:check` proves the database layer works end to end
- `npm run sync -- --due` fills the database from API-Football with whatever
  needs reading, and `-- --round N` with a named matchday; `npm run colours`
  serves the local page that picks a club's colour and `npm run db:seed-teams`
  writes the club codes and colours the provider does not publish; `npm test`
  runs Vitest over the mapper, the selection policy and the pages' pure helpers
- [`design/foundations.md`](design/foundations.md) is the whole of the design
  source of truth — the token set and the rules around it. There is nothing
  beside it any more: the boards it was agreed on are superseded by it, the
  screen mockups went because they drew screens the app was rebuilt past, and the
  colour and type reference sheets went with the palette they documented. The
  tokens are CSS, in [`src/app/globals.css`](../src/app/globals.css)
- Schibsted Grotesk and DM Mono come from `next/font/google`. There is no third
  font: the icons are thirty-six SVG glyphs of our own, drawn in
  [`src/components/icon-paths.tsx`](../src/components/icon-paths.tsx) and served
  from one sprite per document
- `.env.local` holds `API_FOOTBALL_KEY`, `SEASON`, `LEAGUES`, `DATABASE_URL`,
  `DATABASE_URL_DEV` and four Clerk variables — the development instance's test
  keys, which are what a laptop must use; it carries no `DATABASE_TARGET`, so
  everything run there hits development unless the variable is put in front of
  one command. `.env.example` documents the full set and where each copy lives
- [`.github/workflows/sync.yml`](../.github/workflows/sync.yml) runs the sync on
  a timer against the production branch, out of two repository secrets
  (`DATABASE_URL`, `API_FOOTBALL_KEY`) and two repository variables (`SEASON`,
  `LEAGUES`)

## Built

In the order it landed. Each entry names the commits that carry it, and
`git show <hash>` is where that slice's account went — the better record, because
a commit message cannot drift from the diff it describes. Steps 0 to 5 predate
the squash-one-commit-per-slice flow, which is why they name several.

- **0 — Verify the data source.** `76f371e`, `799fd34`, `9bbaac1`; findings in
  [`api-football-findings.md`](api-football-findings.md).
- **1 — Scaffold.** `77f73dd`.
- **2 — Database and schema.** `e5bd550`, `83c9097`, `66af8c1`.
- **3 — Sync job.** `237c952`.
- **4 — Deploy to Vercel.** `a21cad6`.
- **5 — Auth.** `da8e9be`.
- **6 — The core loop.** Pick a match, see both squads, tag players, have it
  persist.
  - 6.1 App shell `7aeaf90` · 6.1b Responsive shell `fd2bf25` ·
    6.2 Fixtures page `dca5e51` · 6.3 Match page `7e0635b` ·
    6.3b Scoreline card `aafb3d1` · 6.4 Tagging `5fed94b` ·
    6.5 Notes `9092b61` · 6.6 Counts `669d1ff`
- **7 — Diary, players and teams.** Queries over what step 6 wrote, plus the two
  destinations the sidebar adds. Three of the five are **directories rather than
  diaries** — they list every player and every club, judged or not — and none
  carries a verdict control.
  - 7.1 Diary `64ab1f1` · 7.2 Player profile `31585ff` ·
    7.3 Players index `57a51dc` · 7.4 Team profile `dc6b2ae` ·
    7.5 Teams index `0e3ac78`
- **8 — Chrome.** 8.1 Dark-mode toggle `9a15245` · 8.3 The filled button's
  missing hover step `378a8e0` · 8.4 The landing page `4a83e49`. 8.2 was
  **dropped** rather than built (`062a017`): search belongs to the screens that
  have something to search, not to the top bar.
- **9 — The paid tier and the current season.** `642b238`. Cost one variable in
  two places and no code — the first real test of the first non-negotiable. It
  replaced a backfill step that was deleted rather than built.
- **10 — Schedule the sync.** 10.1 Selection and a CLI safe to leave alone
  `b45fec0` · 10.2 The workflow `6a2c608`, with `2fc2dd0` and `0ebd409` settling
  the window and cadence · 10.3 Announced lineups `716094c`. This is the step
  that made the second non-negotiable true rather than assumed.
- **11 — A second league, the Primeira Liga.** `93ad412`, colours confirmed in
  `93c891b`. Deliberately *before* step 10: its season was already under way, so
  it was the only way to put played football on the screens before 21 August.
  Cost one variable and one parameter.
- **13 — A third league, La Liga.** `4f8010f`, with `4c1ad6c` adding the flags
  and `6e093be` the remembered league. Cost the variable alone.
- **14 — The kickoff time on the reader's clock.** `71b6e61`.
- **15 — The production database.** `ef04b59`. Three variables, a migrate and a
  sync; no product code. Production was filled from API-Football rather than
  copied from development, which is why 2024 never reached the live site.
- **16 — The delay on every click.** `52ecf8f`, with the region settled by
  `2069a60` and `75583b3`. The queries were never the problem.
- **17 — A postponed fixture says so.** `78f75eb`.
- **18 — A fourth league, Serie A.** `cb5d8a2`. The variable, plus a flag and
  twenty club colours — decoration on a league rather than the league.
- **19 — The suggestion box.** `5f09a62`.
- **20 — Fixtures by day.** `2c8d212`. Retired the league row, the matchday pager
  and the `madooo-league` cookie.
- **21 — The diary by match.** `fd81341`. Came from a user: "I cannot find
  things."
- **A verdict that fails to save says so.** `c718dd8`. Reported from outside as
  "it might be a little bit bugged", which was the most a reader could say when
  the chip was the only feedback there was.
- **A note can be edited in the middle.** Reported through the suggestion box:
  "only one letter can be added or backspaced before the cursor automatically
  moves to the very end."
- **Why the write failed, found at last.** Reported from outside a second time,
  with the message `c718dd8` added: a STANDOUT that said "that did not save —
  something went wrong". `c718dd8` had left this open — *"not fixed: why the
  write fails for that reader"* — and it turned out not to be our code at all.
  Clerk's `__session` cookie expires after 60 seconds, and `@clerk/backend`
  **refuses to renew it on anything that is not a GET**, in both the handshake
  and the refresh-token path. A Server Action is a POST, so a tap made a moment
  too late was reported as signed-out, redirected to `/` by `proxy.ts`, and came
  back as a 404 the RSC client cannot read. It healed on the next page load
  because that is a GET, and it never reached a log because the action never ran.
  Every write now refreshes the session first.

  **The clue that pointed the wrong way is worth keeping.** It was reported as
  starting to work "when the lineups updated", which reads as a data problem and
  is the reverse: `refresh()` inside the action is the only thing that re-renders
  a match page, so the lineups could not move until a save had already
  succeeded. Cause and effect were the other way round from how it looked.

  The same slice caught the note, which had no error handling at all and lost
  what the reader had typed in exactly the way `c718dd8` had fixed for the chips.
- **The app icon is the real letterform at last.** `icon.png`, `apple-icon.png`
  and `favicon.ico` were the last thing on the screen still carrying the
  previous design — a white M on a *black rounded* square, which is the wrong
  colour and a radius in a system that has none. They are now the letter M in
  Schibsted Grotesk ExtraBold, white on `--marine-700`, square, generated by
  `npm run icons` and committed.

  What had blocked it was recorded as a missing image toolchain, and that turned
  out to be wrong rather than merely stale: `next/og` bundles satori and resvg,
  so Next was already shipping both a shaper and a rasteriser. No dependency was
  added. The script fetches a static ExtraBold instance from Google Fonts —
  which serves one when the request looks too old to understand woff2, the trick
  that makes this possible at all, since satori cannot instance a variable font
  — and hand-writes the ICO container, which is twenty-two bytes of header per
  image against a dependency.

- **The rebrand — "Field Notes".** The design agreed on the brand board reaches
  the code: marine, Schibsted Grotesk and DM Mono, zero radius, one shadow,
  thirty-four glyphs of our own, and the voice pass. It removes more than it
  adds — Material Symbols, `npm run icons` as it then was, `scripts/fetch-icon-font.ts`, the
  committed woff2 subset, the ligature indirection, a render-blocking font
  request, four radius tokens, two shadow tokens, `--info`, `--surface-header`
  and `--border-focus` all go. Verdict colours are carried over untouched.
  (The *name* `npm run icons` came back later for the app-icon script above; the
  icon set itself is committed geometry and no script generates it.)
- **`/fixtures` becomes rows in a competition's block.** The rebrand changed the
  screen's surface and left its structure alone; this is the structure. The
  three-band fixture card goes, and with it `FixtureCard` itself: a competition
  is now one bordered object with a row per fixture, which is also the first
  thing on that page a block header has ever actually capped. Chosen by building
  it — three versions behind a switcher at `/drafts/fixtures`, the way `/landing`
  chose the specimen sheet, and deleted the same way once picked.

  What moved and why: the round goes up to the block header when a league shares
  one that day and falls back to the row when it does not; `0 verdicts · 0 notes`
  is not drawn at all, because on an unplayed fixture zero is the only value the
  field can hold rather than a finding; and the kickoff moves to a left margin
  where it survives the match being played, instead of being replaced by the
  score. **The venue is dropped from this screen**, leaving the match page as the
  only one that names a ground.

  "Team news is not out yet" is gone, replaced by its opposite. It was first
  hoisted into the block header because it read identically on every row — which
  it does on a Saturday morning and stops doing the moment one club names a
  side. The row now carries a **"Lineups out"** badge instead, marking the
  fixture that is *ready* rather than the twenty-seven that are not, and it
  appears on exactly the rows that are links. It is marine as an outline, which
  added a fourth entry to marine's "what you can act on" list and a clause to
  `foundations.md` saying what "not the scoreline itself" protects.

- **The dark ramp is retuned.** Nine base tokens and three verdict fills; no
  component, no semantic token and no light-theme decision was touched, which is
  the point — the two-tier palette meant a whole-theme retune cost nine values.
  The old ramp spent its contrast backwards: ink at 15.7:1 on the page while a
  card sat at 1.08 against that page and a border at 1.23 against the card, so
  ten cards read as one flat slab and the ink glared. Now 11.7:1, 1.17 and 1.37,
  with muted and faint text both fractionally *up*. The cast moved with it —
  light keeps its cool teal tint, dark is a neutral blue-grey — which is the
  clearest the palette has ever stated why the two ramps are written out
  separately rather than one being the other reversed.

  Chosen by building it: five candidate palettes behind a dev-only switcher that
  re-pointed the base tokens at runtime, walked through the real screens and
  deleted once picked — the way `/drafts/fixtures` and `/landing` chose before
  it. Two of the five moved the brand off marine and both were declined, so
  **marine survived its first real challenge** rather than merely never having
  been questioned.

  One thing worth knowing before the next retune: `--surface-inverse-hover` is
  defined to read the *other* theme's ramp, so this moved a light-theme value
  (`#1f2829` to `#303845`) despite every other light token standing still. That
  is the rule working, not a leak, and no component draws that token yet — so the
  light theme is visually untouched. `foundations.md` now says so where the token
  is defined.

- **Three more leagues, and a screen for the thing they cost.** The
  Bundesliga, Ligue 1 and Allsvenskan. The leagues were the cheap half — three
  flag files, three CSS rules, three map entries and no product code. The 52 club
  colours were the half that does not scale, so they cost a tool:
  `npm run colours` draws each candidate as the chip it will become, in both
  themes, and writes what the author picks. Drafting twenty primaries and
  correcting them on sight worked at twenty and does not at 52.

  It also moved the Primeira Liga from fourth to sixth, since `LEAGUE_ORDER`
  claims "most followed", and deepened twelve reds by 3–5% so their chips draw
  white — the crossover in `crestInk` sits almost exactly on WCAG AA, so the two
  were the same decision.

- **A fixture row marks what you have written in, instead of counting it.** The
  right margin drew `7 verdicts · 1 note` — two glyphs, two counts and two nouns
  on a line that already carries a kickoff, two clubs, two crests and a score.
  Neither number is a fact about the fixture; both are facts about how much the
  reader typed, and nothing on a page of fixtures is decided by whether it was
  seven verdicts or two. It is a **2px marine rule down the row's leading edge**
  now, on the rows with at least one verdict or one note, and nothing at all on
  the rest.

  **A word in the right margin was built first and rejected, which is the part
  worth recording.** WATCHED, in the `visibility` glyph and full ink, agreed with
  the season tile at the top of the page exactly — same word, same glyph, same
  ink, the tile counting the marks — and that agreement was real: the tile's
  `count` and the row's test are the same predicate, since `judgement_has_content`
  is a CHECK constraint and a judgement row therefore *is* a verdict or a note.
  It was still wrong twice over. It cost 96px of every row, because a margin that
  appears and disappears walks the centred score sideways and the width has to be
  held whether the mark is drawn or not; and **a bold capitalised word is not what
  a private note in the margin of a fixture list should sound like**. The mark is
  the reader's, not the app's, so it should read as a mark rather than as a label
  — the pencil line beside the paragraph you came back for.

  The rule is out of flow rather than a `border-l-2`, which would have pushed
  every row 2px off the block header above it to buy a mark two rows in three do
  not draw. **Its colour took three passes**: `--border-strong`, the grey
  foundations keeps for a rule meant to be noticed, which at 2px read as the
  card's own border having thickened rather than as anything deliberate; then
  ink, which read clearly and said nothing, being the voice the row already
  speaks in; then marine. Widening the pale bar to 4px was tried in between and
  is the worst of the three — a line becomes a soft block, and this design has
  two rule weights rather than three. **A mark gets a colour, not a width.** The
  word rides along `sr-only`, since colour alone is never the whole of a fact.

  **Marine cost `foundations.md` a clause, and turned up an older mistake while
  it was there.** Marine's second category, "where you are", is now "where you
  are, and where you have been": the selected tab's 2px underline and this are
  the same object turned on its side — under that tab alone, against this row
  alone — separated only by tense. The older mistake is that the brand-as-an-edge
  section closed by saying a marine line must be "the bottom of a block header"
  or it is wrong, **which the tab underline had been contradicting since the day
  it was drawn**. The rule had been stated from inside the section about the
  brand as a label and quietly overruled a category it was never arguing with.
  It now reads: a rule is grey unless it is the brand naming a block or the app
  locating the reader.

  The query stopped carrying every judged row of the day with its tag and its
  note text — `take: 1` and a `length` answer a yes-or-no question — and
  `countNotes` went with its only caller.

- **A changelog for signed-in readers.** `/changelog`, reached from an
  `article` glyph in the top bar, over a hand-written module backfilled to the day the app opened. It replaces the temporary sidebar note deleted in `24a228b` with the
  version that is maintained rather than thrown away, and the build loop in
  [`AGENTS.md`](../AGENTS.md) gained the step that keeps it from drifting: an
  entry is written in the slice that earns it, so the page can never describe
  code that is not deployed.

- **A live fixture with no lineup says why.** A `Hint` beside the Live badge on
  `/fixtures` — a 26px `info` button opening a panel that names the data provider
  as the reason there is nobody to rate. `info` is the set's thirty-sixth glyph,
  and the panel is the third thing in the app allowed `--shadow-3`.

- **Team of the week.** An eleven picked out of the reader's own diary over a
  span of days, and the pitch graphic it exists to produce.

## Not built, and why

Things left out on purpose, each with the argument that kept it out. This is the
backlog: a proposal here starts from where the last decision stopped rather than
from scratch. Nothing in it is scheduled, and an entry is deleted when it is
either built or decided against for good.

**`/fixtures`**

- **A league filter.** The obvious next thing, and what will make the page
  survive fifteen competitions. Left out of 20 because the day pager was the
  change being argued.
- **Any way to see a whole matchday.** Nothing has asked for one since the round
  started being named — now on the competition's block header, or on the row
  where a league's fixtures are split across two.

**The match page**

- **Its structure was drawn three ways and kept.** `/matches/[id]` went through
  the same exercise `/fixtures` did — three versions behind a switcher at
  `/drafts/matches`, looked at against real data — and unlike `/fixtures` it
  came out unchanged. Four squad panels over "Your verdicts" is the shipped
  answer and now a chosen one rather than an inherited one. The two rejected
  drafts are worth keeping the arguments for, because both were reasonable and
  both are the obvious thing to propose next:

  - **One bordered block per club**, with the eleven and the bench as interior
    sections instead of two panels. It halves the boxes on the screen, names each
    club once instead of twice, and deletes the `md:grid-rows-subgrid` machinery
    outright — that whole mechanism exists only to keep four boxes starting at
    the same height, and two boxes have nothing to hold in step. What it costs is
    that the eleven stops being its own object. **The bench is not a peer of the
    starting XI and the shipped page is right to draw it as its own card**; a
    club block puts them under one outline and one count, and a run of interior
    labels inside a box is a weaker separation than a gap between two boxes.
    Naming a club twice is a cheaper fault than that.
  - **One object for the match, cut by position line** — both keepers in a band,
    both back fours side by side, the bench at the foot — on the reasoning that
    the MVP rule makes this a verdict on the match rather than on a club. It
    reads well and turns forty-odd position labels into five headings. It is
    still wrong about what a reader is doing: **you judge a team sheet the way it
    was published**, by club, and a page that interleaves the two sides asks you
    to find your club before you can find your player. The comparison it buys is
    one you make after the fact; the scanning it costs is the whole of the task.

  Neither is retired for good — a proposal to revisit either starts here rather
  than from scratch. **The `md:grid-rows-subgrid` note is the one to keep in
  view**: it is complexity the shipped structure genuinely needs, not an
  accident, and any future change to this page has to keep paying for it or
  replace the structure that requires it.

**Type**

- **A plain zero.** DM Mono slashes its zero, it was looked at across every
  screen, and the author's decision is that it stays. Recorded here rather than
  left open because the investigation behind it was not cheap and should not be
  repeated.

  **DM Mono cannot draw an unslashed zero at all.** It has no `zero` feature.
  Its five stylistic sets substitute commas and quotes (`ss01`), `a` (`ss02`),
  `g` (`ss03`), `3/6/9` (`ss04`) and `f` (`ss05`) — none of them the zero. No
  unslashed zero glyph exists anywhere in the file. And the slash is not a
  contour that could be dropped: it **cuts the counter into two closed shapes**,
  so the zero has three contours where a plain zero has two, and removing it
  means redrawing the counter rather than deleting a path. The only faithful
  source for that counter is the font's own capital `O` — the zero's ring is
  `33..567` against `O`'s `28..572`, and the two counter halves span exactly
  `O`'s counter — but substituting it makes `0` and `O` identical, which is the
  thing slashing the zero exists to prevent. `OCT` and `NOV` are in the date
  format, so that collision would be on screen.

  So a plain zero costs a different family, and only two on Google Fonts draw
  one **by default**: **Chivo Mono** and **Azeret Mono**, both variable 100–900,
  which would also lift the weight ceiling `foundations.md` records as an
  accepted loss. Feature-based routes were tried and do not work — Geist Mono's
  `ss09` and Red Hat Mono's `zero` both still render slashed in the browser
  despite what their GSUB tables suggest, which is the argument for preferring a
  font whose default is plain over one with a feature to set.

**The diary and the tiles**

- **The four stat tiles still count entries written, not matches watched.** 21
  left them alone deliberately: what a tile counts is a different screen's
  question from what a tab lists.
- **No `?from=` on the diary's match link**, so arriving at a match from the
  diary still offers "Back to fixtures".
- **No `(season, kickoff)` index.** The semi-join is selective, and a speculative
  index is a migration with no measurement behind it.

**Team of the week**

- **A saved eleven cannot be edited, only deleted and picked again.** Editing is
  a second write with its own validation and its own way of failing halfway, and
  a team takes about a minute to pick. If the same eleven is being rebuilt with
  one man changed often enough for anyone to notice, that is when it earns the
  action.
- **No note on one.** The name and the span say what it is; a second free-text
  field on a private artefact is one nobody has asked for.
- **Picking is a tap, never a drag.** Drag-and-drop needs a pointer, a keyboard
  equivalent that is a second implementation of the same feature, and a library.
  It would also be buying a decision the reader is not making, since this app
  holds no position finer than the four letters — sliding a defender along the
  back four moves nothing.
- **The graphic carries no wordmark, and this is the one worth revisiting.** It
  is drawn to be screenshotted and shared, and it leaves the app carrying no sign
  of where it came from. What kept it off is that a watermark on your own private
  diary entry is the app advertising itself in the middle of somebody's page,
  which is the opposite of the restraint `foundations.md` opens with — and the
  block header's marine rule already speaks in the brand's voice. It is the
  author's call rather than a judgement one, because it changes what a screen
  says about the product.
- **Nothing exports an image.** The reader screenshots it, which every phone and
  desktop already does well; rendering a PNG server-side would be `next/og`, a
  second drawing of the same pitch in satori's subset of CSS, and two graphics
  free to drift apart.

**Verdicts**

- **No verdict controls anywhere but the match page.** Profiles and indexes read
  a season back; the place to change a verdict is the match it was given in.
  Settled in 7.2 and re-applied by every screen since.
- **A note is not in "Your verdicts" and not in the panel header counts**, because
  a note is not a verdict.

**Called-off and abandoned matches**

- **`ABD`, `AWD` and `WO` carry no badge.** Only `PST` and `CANC` mean *not
  played at all*; the other three have a team sheet or a real score, so badging
  them would put a word where a result belongs. A decision rather than a
  tidy-up, if it is ever wanted.
- **A postponement passes through a `--due` run silently.** Nothing was added to
  what the sync prints.

**Suggestions**

- **No screen that reads them, no reply path, no category field**, and **no
  capture of which page the reader was on** — the last because a path like
  `/matches/123` quietly records what somebody was looking at, in an app whose
  whole promise is that nobody sees your diary.

**The changelog**

- **No unread mark on the bell.** The obvious next thing, and the mechanism is
  already proven twice: a stored id — a string rather than a boolean, so
  changing it brings the mark back — settled before first paint by the trick
  `theme.ts` uses. It is left out because it is a second slice's worth of
  machinery, and because the deleted sidebar note is the evidence for why it
  cannot be bolted on carelessly: a mark that paints and then vanishes after
  hydration was reported as a bug the first time.
- **It is behind the login, and a visitor cannot read it.** Decided rather than
  overlooked. A public changelog is the other reasonable answer — it is evidence
  to somebody deciding whether to sign up — and what it costs is that the page
  either leaves the app shell or is drawn twice.
- **No version numbers, no tags, no "unreleased".** The repository has no tags
  and a slice is not a release; a date is the only unit this project actually
  ships in.
- **Nothing links to it from `/`, the sidebar or the footer.** One way in, so
  there is one thing to change if it moves.

**Elsewhere**

- **No club link on a fixture row.** The whole row is already a link, so a club
  inside it would be a nested anchor. The scoreline and the squad panel crests
  are the two ways in.
- **No stat tiles on `/teams`.** They would count the reader's own season over a
  list that is not about it.
- **No club-level split bar.** One match carries eleven of a club's players, so a
  remainder taken against matches watched would not exist.
- **The landing page has no call to action in the hero and no theme toggle.** The
  drawings have neither, and the toggle belongs to the app shell.
- **The locale does not follow the timezone.** A reader in New York gets `20:00`,
  not `8:00 pm`. Nothing else in the app localises.
- **The 2024 season stays on the development branch.** It is dev data on a dev
  branch and production never sees it.

## Launch checklist

Not code, and not to be left to launch day.

- [x] **Clerk production instance.** Done ahead of time, because the domain was
      already live. Bound to `madooo.app`, with Madooo's own Google OAuth client;
      see [`architecture.md`](architecture.md#auth-and-routing).
- [x] **Look at every signed-in screen at the rebrand's tokens.** Done, and it
      took three sessions to finish because the one that wrote the rebrand lost
      its Clerk login partway and could only verify `/` and the build.
      `/fixtures` was looked at on a busy Saturday, a finished day and a
      one-fixture day, and was rebuilt as rows in the doing. A match page was
      looked at on a finished La Liga match carrying nineteen verdicts and a
      Primeira Liga match with none, and came out unchanged — see "Not built"
      for the two structures that lost. `/players`, `/teams`, `/diary`, a club
      profile and a player profile were then loaded and are correct as drawn.

      **Both themes, not just light.** Dark was checked on a player profile, a
      match page and `/fixtures`, which is where `foundations.md`'s one recorded
      worry lives — marine sitting a lightness point from dark-mode STANDOUT
      green. On a real squad list the two are distinguishable, and the accepted
      consequence stays accepted rather than becoming a bug.

      Nothing was found wrong on any of them. The one thing the pass did turn up
      is not a token: the slashed zero is far more frequent than the open
      decision about it assumed. That decision has since been made — the slash
      stays; see "Not built".
- [ ] **Render all thirty-six glyphs at ~100px and look at them.** `lock_open`
      shipped with its shackle arcing *down through the lock body* — an SVG
      sweep-flag error, invisible at 14px and unmistakable enlarged, caught only
      because something happened to blow it up. The other thirty-three have never
      had that treatment, and it is the only way this class of error surfaces.
      `info` is a second exception beside `article`: it was drawn at 100px and at
      14px before it shipped, and its dot-to-stem clearance was set by the second
      of those rather than the first.

      `article` is the exception and the evidence: `/changelog` went through
      three drawings, and the `history` clock among them was retired because
      seeing it at size showed a shape that read as broken rather than
      deliberate. `foundations.md` now makes judging a new glyph at 100px *and*
      at the shipping size the rule, along with the three tests those drawings
      each failed one of. That leaves the thirty-three inherited ones.
- [ ] **See the "Lineups out" badge render once.** `/fixtures` draws it for a
      fixture whose team news has landed but which has not kicked off — and no
      row in the dev database is in that state, because every day carrying
      lineups is already finished with a score and every future day has none. So
      the branch shipped verified by types and by reasoning, not by eye. It first
      appears for real about an hour before a kickoff. Until then the only way to
      see it is to flip one finished fixture to no-score/not-started in the *dev*
      database and put it back.
- [ ] **Decide about Clerk's `createRouteMatcher`.** It is deprecated and goes in
      the next major; `proxy.ts` uses it and the deprecation warning prints on
      every dev boot. Clerk's own reason for retiring it is not a tidy-up —
      "middleware-based auth checks rely on path matching, which can diverge from
      how Next.js routes requests and leave protected resources reachable" — and
      the replacement is a per-page check. That argument lands harder here than
      in most apps: `architecture.md` already records that the matcher list must
      be extended by hand for every route under `(app)` or it ships unprotected,
      which is the same failure mode said twice.

- [ ] **Re-evaluate the `npm audit` warnings.** High-severity issues in `postcss`
      and `sharp`, both transitive dependencies of Next itself, whose suggested
      fix downgrades Next to 9. To be judged before launch, not "fixed" — see
      [`AGENTS.md`](../AGENTS.md)'s "Known noise".
- [ ] **Confirm the API-Football subscription renews.** Pro is billed **monthly**
      and the current term ends 2026-09-11, three weeks into the season. The free
      tier ran a year at a time, so nothing in the project has ever had to think
      about this. A lapse stops the app reaching the live season while the season
      is being played.

## Long-term remarks

Standing constraints that were agreed explicitly, cannot be read off the code,
and outlive any one slice. A high bar — an empty list is the expected state, and
an entry qualifies only if all three hold:

1. It was **explicitly agreed with the author**. Not inferred, not assumed
   because it seemed sensible while implementing.
2. It **cannot be derived from the code**. If reading the repo would tell you,
   the repo is already the better record. This is where these differ from
   `architecture.md` entries, which are a convenience — being recoverable from
   the code does not disqualify one of those.
3. It **outlives the next slice**. It shapes work several steps away, or it
   constrains everything until something specific changes.

Each entry names its own exit: `<remark>, can be resolved when X is implemented`.
That clause is what makes the section prunable — an entry goes on the evidence
of X existing, rather than on somebody's judgement that it feels stale. An entry
nobody can write an exit clause for is not a long-term remark; it is an open
decision, and belongs in that section instead.

- **There is no screen reference at all, and every screen must be designed
  without one.** The Claude Design export was desktop-only — no breakpoints, no
  mobile mockups — and has since been deleted as stale. 6.1b agreed
  the frame's rules and wrote them into `foundations.md`'s `### Responsive`
  section, but that settles the frame alone: every screen since has resolved its
  own narrow layout by judgement against those rules, and every screen after this
  one still has to.
  *Can be resolved when narrow-width reference designs exist for the app's
  screens.*

- **A `Match` can exist with no squad rows, and code must cope with that.**
  Anything that lets a user pick a match has to handle a match nobody can be
  judged in, rather than assuming a squad is there. *Cannot be resolved.*

  It used to name the backfill as its exit and read as a development condition.
  Moving to the live season made it permanent: fixtures are published months
  before team news, so a season in progress always contains matches whose squads
  do not exist yet. A league mid-season is the proof rather than the exception —
  most of its fixtures are bare at any given moment, because a squad is written
  45 minutes before kickoff and not before.

## Testing

**Vitest is set up**, running over the sync mapper against the real captured
payloads — never JSON invented for the test. The mechanics, and why `npm test`
must stay out of the Vercel build, are in
[`architecture.md`](architecture.md#the-mappers-tests-read-scratch-which-is-gitignored).

- Do not test Prisma, Next's rendering, or other third-party code.

## Open decisions

- **The same person can be in one match squad twice, and a starting XI can have
  twelve players in it.** Found by looking at `/drafts/matches` against real
  data, not by a failing test — nothing fails, because every constraint involved
  is doing what it says. API-Football sometimes gives one person **two different
  player ids across its own two endpoints**, so `buildSquad`'s merge — keyed on
  `player.id`, which is the only key either payload offers — cannot see that the
  two rows are one man. Twenty-four matches in the 2026 development data are
  affected, about seventy `(match, team, shirtNumber)` groups once the bench is
  counted, and the worst of it is that a person can hold **two verdicts in one
  match**, since the MVP-is-exclusive rule is enforced per squad row. No
  judgement is on one of these rows yet, which is the only reason this is a
  decision rather than an incident. The two halves are cleanly distinguishable —
  see [`architecture.md`](architecture.md#the-same-person-can-be-in-one-match-squad-twice)
  for the signature and the full cost. *Resolved by the author deciding what the
  sync should do when two ids describe one player — and separately what happens
  to the rows already written, which no change to the sync will remove.* It
  touches the one translation boundary, so it was not fixed in passing.

- **What a scope control looks like, if one is ever wanted again.** The pill tab
  was the answer and the rebrand retired it, because a pill in a zero-radius
  system is a contradiction. Nothing draws a scope control today, so nothing is
  broken; but `foundations.md` still records the distinction between naming what
  the page was drawn for and narrowing what is on it, and a filter over which
  competitions a reader follows is the obvious next thing to want it. *Resolved
  when something asks for one, by designing the control then rather than now.*

- **`use cache` is still untaken, and step 20 removed most of the reason to
  want it.** This used to say `/fixtures` asked Neon six times in a row because
  each answer decided the next question. Indexing by day deleted the chain rather
  than caching around it: a date resolves without a lookup, so the day's
  fixtures, its neighbouring days and the season tallies go out together and the
  page is two steps. What is left to cache is reader-independent work on the
  other screens. The cost is not the caching: it is that `cacheComponents` is a
  different rendering model, so every page loses `force-dynamic`, every uncached
  read needs a `<Suspense>` boundary placed by hand, and `unstable_instant`
  exists to check the placement because getting it wrong silently blocks
  navigation instead of erroring. That is a step of its own, not a tail on
  another one. *Resolved by doing it, or by deciding the app is fast enough
  without it.*

- **Neon's production branch may be scaling to zero, and nobody has looked.** A
  suspended branch waking cost 544–860ms in step 16's measurements, which would
  land on the first click after any quiet spell and swamp everything that step
  fixed. It is a console setting rather than code, and it interacts with the
  schedule: the sync runs every ten minutes, which may already be keeping the
  compute awake for most of the day. *Resolved by reading the branch's setting
  and timing a first click after an hour of silence.*

- **The league flag is on `/fixtures` only, and cannot be on the two indexes as
  they are built.** Each section heading carries one; `/players` and `/teams`
  scope their leagues with a `<select>`, and a native `<option>` holds text and
  no markup. No styling changes that — it is an HTML limit, not a design one. If
  those screens want the same distinction the answer is `foundations.md`'s own
  ("use a word"): `"England · Premier League"` in the option label. Deliberately
  not done, because it changes what a filter control says, and the two indexes
  are the screens where a league is a preference rather than a location.

- **The app now has two conventions for screen state, and the older one may be
  the wrong default. High priority — a refactor the author may want.** Every
  screen before 7.3 keeps its state in the URL: `/fixtures?date=2026-08-23`,
  `/diary?view=matches`, `/players/44?view=notes`. Both indexes keep their three
  controls in `localStorage` instead, on the argument that they are
  *preferences* — how the reader likes a list drawn — where the others are
  *locations*. That distinction is written up in
  [`architecture.md`](architecture.md#a-location-goes-in-the-url-a-preference-goes-in-localstorage)
  and it holds; what is open is whether the older screens are on the right side
  of it.

  The reason to look again: **nothing in the app is shareable.** Diaries are
  private, single-user, no public profiles — so the URL's main advantage buys
  nothing today, while its main cost is real, because a view in the URL is
  forgotten the moment the tab closes. A reader who opens the diary for the
  matches gets the list of judgements on every visit. Against moving them: the
  back button stops undoing a tab change, the pages stop being server
  components, and a future share feature would want them back in the URL.

  Deliberately not touched in 7.3, 7.5 or 21, all scoped to one screen — though
  7.5 choosing `localStorage` again makes the newer convention the app's default
  in practice rather than its exception. Whoever settles it should decide for the
  diary's view and the profile's view tab together, which step 21 made plainly
  one question rather than two by giving them the same parameter name.

  **A cookie is a third option neither of the two offers, and the app no longer
  has one to point at.** This used to argue that `madooo-league` might be the
  answer for all of them: the league stayed in the URL *and* the last one chosen
  was remembered, so the address bar still said what the page was while a bare
  visit landed where the reader left off. Step 20 removed that cookie, because
  the fixtures page stopped having a reader-specific default to remember — a bare
  address is today, which is a fact about the world.

  The shape of the answer survives the instance and is still worth having for the
  diary's view: a cookie read on the server fills the URL's silence without
  giving up the server render. What it would not settle is which store the
  *state* lives in, only what happens when the URL says nothing.

- **Search is in the browser's memory, and that stops being right somewhere past
  five leagues.** `/players` ships the season's whole roster — ~15 kB compressed
  for one league — so a keystroke never waits on the network.
  At a few thousand players it is still the better trade; well past that, the box
  should ask Postgres instead. The swap is self-contained: the search field
  changes where it gets its answers and nothing else moves. It costs a route
  handler, debouncing, a loading state and out-of-order response handling, and it
  makes search visibly laggy, which is why it has not been built.

  This entry used to say *"revisit when a third league is synced"*, and step 13
  synced one. It was looked at and deliberately left alone — and the trigger was
  the wrong shape, because at the moment a league is configured it adds
  **nothing** to the payload: the list is players with squad rows, and a league
  that has not kicked off has none. La Liga demonstrated both halves of that
  within a week, joining the payload on its opening weekend rather than when it
  was configured. A league count was never the thing that moves this number.
  *Revisit when `/players` ships more than a few thousand players — which is
  measurable from the page itself rather than from how many leagues are
  configured.*

- **The club colours are not uniformly sourced, and the Premier League's are the
  block with no authority behind them.** Settled in 6.2: codes and colours are
  columns on `Team`, seeded by `npm run db:seed-teams`. The codes are the
  league's own abbreviations, which is a defensible external standard. The
  colours are not. The Primeira Liga's, La Liga's and eighteen of Serie A's were
  checked by the author against the clubs themselves and are confirmed; the
  Premier League's are each club's commonly published primary, entered by hand
  and never checked against anything. That block is what is left of the original
  problem, it is meant to be edited on sight, and a wrong one is wrong quietly.

  **A club that plays in white is the case the check exists for.** Real Madrid
  and Valencia have no drawable shirt colour, so each holds what the club is
  identified by off it — Madrid's crest blue, Valencia's black. Both were wrong
  on published primaries before the author corrected them, as were Levante,
  Deportivo and Barcelona, which is five of twenty in a block that looked
  plausible throughout. Serie A repeated the rate almost exactly — thirteen of
  the eighteen checked colours moved off the drafted primary — and left the same
  residue: Juventus and Udinese play in black and white, both hold flat black,
  and no check can tell them apart, which remains the one case in the file that
  has no answer rather than an unchecked one.

  **22 stopped drafting, and narrowed this to one block.** The Bundesliga's,
  Ligue 1's and Allsvenskan's 52 clubs were never drafted at all: each held
  `null` and drew the neutral fallback until the author picked it in
  `npm run colours`, with the chip drawn in front of them in both themes. That
  makes those three the best-sourced blocks in the file — a stronger claim than
  "checked", since nothing had to be talked out of a wrong answer first.

  **So what is left open is the Premier League's twenty, and only those.** Still
  commonly published primaries, still never checked, and now the only block in
  the app asserting a colour nobody has confirmed. Given the rate the other
  leagues found — five of twenty in La Liga, thirteen of eighteen in Serie A —
  something like five of them are wrong right now, and wrong quietly.
  *Resolved by running `npm run colours -- --all` and working down the Premier
  League section.*

  **A separate thing this exposed: the ink is computed and cannot be overridden.**
  `crestInk` takes whichever of black or white contrasts more, so a club cannot
  ask for white on a colour the rule gives black to. Twelve reds sat just on the
  black side and were deepened 3–5% instead, which is a colour edited to suit a
  rendering rule — the inversion of this file's own doctrine, accepted because
  published brand hexes vary by more than that anyway. A real override would be a
  third hand-seeded column on `Team`. *Resolved by deciding the deepening is
  enough, or by adding the column.*
- **The demoted MVP's chip waits for the round trip.** Each squad row is its own
  client island holding its own optimistic state, so nothing tells one row that
  another has just taken the MVP: the player losing it keeps a filled star until
  `refresh()` lands, and for that moment two chips read as MVP. Making it instant
  means hoisting the optimistic state into a provider above the rows — which can
  still wrap server-rendered children, the way `AppFrame` wraps `<Sidebar />`.
  Two sizes were sketched: a narrow one holding only the current MVP, leaving the
  counts and the summary to settle on the refresh as everything does now; and a
  full one holding the whole verdict map, which makes the counts and the summary
  client components and gives the exclusivity rule a second implementation to
  keep in step with the server's. Raised and deliberately deferred in 6.4.
- **The sidebar's avatar contradicts the design.** The foot is Clerk's
  `<UserButton showName />`, chosen because its menu is the only way to sign
  out. Its avatar is the Google profile photo, or a coloured gradient when there
  is none, and `foundations.md` forbids both photography and gradients. The
  design draws a grey circle with the user's initials. Replacing it means either
  restyling Clerk's internals or rendering our own chip and finding somewhere
  else for sign-out. Not urgent, but it is a knowing breach rather than an
  oversight.
- **Nothing identifies the app below `md`, and the space it would have taken is
  now spent.** The "Madooo" wordmark lives at the head of the sidebar, so on a
  narrow screen it is inside the closed drawer and the top bar identifies
  nothing. Putting the wordmark in that bar was the obvious answer while the bar
  was a menu button on an otherwise empty rail; 19 has since put the suggestion
  box on the left, so below `md` the bar reads menu button, a bordered "Suggest
  a feature" button, and the two icons pinned right. A wordmark would now be a
  fifth thing rather than the only thing, and it is the one of the five that does
  nothing when pressed — and the bar already says the app's name in words, just
  not its own.

  So the question has changed rather than been answered. It is no longer "should
  the wordmark go there" but "does a narrow top bar need identifying at all, now
  that it is visibly full of this app's controls". *Resolved by deciding the bar
  is identification enough, or by finding the wordmark a place that is not the
  bar.*

- **A suggestion records who sent it, and the dialog does not say so.** 19 stores
  `Suggestion.userId` — which is what makes a reply possible, tells one
  enthusiast from ten users apart, and gives the rate limit something to count —
  and the dialog says only "Read by the person who builds this. There is no
  reply." It does not claim anonymity, and attributing a form submission from a
  signed-in account is what nearly every feedback box does. But it does not
  disclose it either, and the author asked for it that way explicitly, for now.

  The reason it is written down rather than settled: this is the app's one place
  where a user's words leave their own diary, and *whether they know their name
  is on them* is exactly the sort of thing that is cheap to decide now and
  awkward to change after a few hundred rows exist. Three ways out, all small:
  say so in the hint line; add a "send anonymously" box and make the column
  nullable; or drop the column. *Resolved by picking one.*
- **Clerk's `colorNeutral` and `colorShadow` are unbound.** Every other
  appearance variable is a `var(--…)` pointing at our tokens, but Clerk derives
  alpha shades from those two in JavaScript and cannot interpolate a `var()`.
  Its greys and shadows are therefore still Clerk's own in both themes. Whether
  that is visible enough to be worth solving is a thing to look at with the user
  menu open in dark.

- **Nothing keeps the scheduled sync alive through a quiet 60 days.** GitHub
  disables a scheduled workflow after 60 days without repository activity. It
  emails first and the re-enable is a button, so this is not a silent failure —
  but it is a failure whose trigger is the author *not* working, which is exactly
  when nobody is looking at the repository. During the build it cannot happen;
  after launch, a season runs from August to May and a two-month gap in commits
  is ordinary. The options are to accept it and answer the email, or to give the
  workflow something that counts as activity. Deliberately not built in 10.2,
  because a job whose purpose is to keep another job running is worth choosing on
  purpose rather than adding by reflex. *Resolved by deciding either way once the
  first quiet month has actually happened.*

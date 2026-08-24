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

**Last updated:** 2026-08-24 (the roadmap becomes a record rather than an order)

---

## Current state

**Four leagues, on API-Football's Pro tier.** `SEASON=2026` and
`LEAGUES=39,94,140,135`: the Premier League, the Primeira Liga, La Liga and
Serie A. All four calendars are in the database — 380 matches, 306, 380 and 380.

**Which fixtures have squads is the schedule's answer, not a fact to record
here.** The scheduled run asks for a team sheet from 45 minutes before each
kickoff, so a league joins the app's populated half on its own opening weekend
with no commit. Read the current state from the database rather than from this
paragraph.

**Every screen the design draws is built**, and `/fixtures` has since been
rebuilt past its drawing:

- `/` — the landing page: a header, a hero beside a mock match card, three
  features, an open-source block, a footer. It reads nothing, which is what keeps
  it the one route that prerenders, so its fixture and its three totals are
  invented. Seen only signed out; a visitor with a session is sent to
  `/fixtures`.
- `/fixtures` — one calendar day at a time across every competition, cut into a
  section per league in a written-down popularity order, under a pager that steps
  to the previous and next day with football in it. A bare address is always
  today. Four season tiles above it; a verdict-and-note footer on every card. A
  match called off draws POSTPONED or CANCELLED where its kickoff would go; one
  in play draws LIVE; one with no squad says so and does not navigate.
- `/matches/[id]` — a scoreline card over both matchday squads, each club's
  eleven above its bench. Every player row carries three verdict chips and a note
  button, and a "Your verdicts" panel sits under both benches. A failed write
  draws a "Not saved" line with a retry rather than silently reverting.
- `/diary` — four tiles over three tabs in `?view=`: **All** and **With notes**
  list judgements newest-first, dated by when they were written; **Matches**
  lists a row per match recorded in, dated by kickoff, naming the MVP. Every list
  is cut into calendar months.
- `/players` and `/teams` — directories rather than diaries: every player with a
  squad row this season, and every club that has played. Search, a league filter,
  five sorts and a rows-or-cards toggle, the last three remembered in
  `localStorage`.
- `/players/[id]` and `/teams/[id]` — profiles, each over four tallies and a
  split bar, with the way back carried in `?from=`.

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
- Pushed to `github.com:miguelcfernandes/Madooo`, on a `slice/*` branch flow
  squash-merged into `main`
- Deployed on Vercel from `main`, built with `prisma generate && next build`;
  Production reads the production Neon branch, Preview the development one.
  [`vercel.json`](../vercel.json) pins the functions to `lhr1`, the region both
  Neon branches are in
- `scripts/verify_api.py` proves the API works; raw payloads sit in `scratch/`
  (gitignored) and are what the schema was designed against
- `npm run db:check` proves the database layer works end to end
- `npm run sync -- --due` fills the database from API-Football with whatever
  needs reading, and `-- --round N` with a named matchday; `npm run db:seed-teams`
  writes the club codes and colours the provider does not publish; `npm test`
  runs Vitest over the mapper, the selection policy and the pages' pure helpers
- Visual designs exist in a Claude Design project, handed off into
  [`design/`](design/): [`foundations.md`](design/foundations.md) is the token
  set and the rules around it, with `colour.png` and `type-and-space.png` as its
  reference sheets and [`screenshots/`](design/screenshots/) showing the
  fixtures page, the match page, the diary, the player profile, the players
  index, the team profile, the teams index and the landing page as intended —
  all of them at desktop width only. The tokens are now CSS, in
  [`src/app/globals.css`](../src/app/globals.css)
- Archivo and JetBrains Mono come from `next/font/google`; the Material Symbols
  subset is committed and refreshed by `npm run icons`
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

## Not built, and why

Things left out on purpose, each with the argument that kept it out. This is the
backlog: a proposal here starts from where the last decision stopped rather than
from scratch. Nothing in it is scheduled, and an entry is deleted when it is
either built or decided against for good.

**`/fixtures`**

- **A league filter.** The obvious next thing, and what will make the page
  survive fifteen competitions. Left out of 20 because the day pager was the
  change being argued.
- **Any way to see a whole matchday.** Nothing has asked for one since the card
  started naming its round.

**The diary and the tiles**

- **The four stat tiles still count entries written, not matches watched.** 21
  left them alone deliberately: what a tile counts is a different screen's
  question from what a tab lists.
- **No `?from=` on the diary's match link**, so arriving at a match from the
  diary still offers "Back to fixtures".
- **No `(season, kickoff)` index.** The semi-join is selective, and a speculative
  index is a migration with no measurement behind it.

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

**Elsewhere**

- **No club link on a fixture card.** The whole card is already a link, so a club
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
- **The design screenshots are not annotated.** They still draw `/fixtures` with
  a league row and a matchday pager, and `/diary` with five pill filters. This
  line is the record that they are behind on those two screens.

## Launch checklist

Not code, and not to be left to launch day.

- [x] **Clerk production instance.** Done ahead of time, because the domain was
      already live. Bound to `madooo.app`, with Madooo's own Google OAuth client;
      see [`architecture.md`](architecture.md#auth-and-routing).
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
and outlive any one slice. Each names what would resolve it. A high bar — an
empty list is the expected state.

- **The design covers desktop only, and every screen must be designed narrow
  without a reference.** The export from Claude Design carries no breakpoints and
  no mobile mockups; every reference screenshot is a ~2060px capture. 6.1b agreed
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
  and no check can tell them apart, which is the one case in four leagues that
  has no answer rather than an unchecked one.
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

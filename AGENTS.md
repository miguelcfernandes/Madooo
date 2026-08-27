<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Madooo

A match-diary app for football fans. After a match, a user tags players as
**MVP**, **STANDOUT** or **FLOP** and can attach a note to any player. Later they
can open a player's profile, or their own diary, and read those judgements back
as dated, diary-like entries.

Scope: the Premier League, the Primeira Liga, La Liga and Serie A, other top
leagues afterwards.
Diaries are
**private** — single-user, no sharing, no public profiles, no moderation.

Product rules settled so far:

- **Any player in the matchday squad can be judged, including unused
  substitutes.** A diary is a private judgement, so it needs no justification
  in minutes played.
- **MVP is exclusive within a match; STANDOUT and FLOP are not.** A match has at
  most one MVP across *both* squads — it is a verdict on the match, not on a
  club. Awarding it to a second player takes it off the first, who is left with
  no judgement at all, or with their note and no tag if they have one. Any
  number of players can be a standout or a flop.
- **Logos and player photos are stored but never displayed.** `League.logo`,
  `Team.logo` and `Player.photo` keep API-Football's `media.api-sports.io` URLs
  so the option stays open, but nothing renders them. Storing a URL is inert;
  rendering club crests is a trademark question we have not cleared. A
  competition's **national flag is not its logo** — it is drawn from
  `League.country` out of files we vendor, carries no trademark question, and is
  governed by `docs/design/foundations.md`. `League.logo` still renders nowhere.

## Working with the author

The author is fluent in Python and reads other languages comfortably, but is not
deep in the JS/TS ecosystem.

- Prefer explaining *why* a project convention exists over just naming it.

## Non-negotiable constraints

1. **The season and the leagues are configuration, never literals.** `SEASON`
   and `LEAGUES` come from the environment. The season ran against an older one
   while API-Football's free tier exposed only seasons roughly two years past; on
   the paid tier it runs against the live one, and that switch cost one variable
   and no code. The second league then cost one variable and one parameter, the
   third cost the variable alone, and the fourth cost the variable plus a flag
   and twenty club colours — which are its own decoration and not the league.
   All four are the whole point — a hardcoded year or league id anywhere would
   have made any of them a refactor. The next season and the fifth league go the
   same way.

   **`LEAGUES` is read by the sync alone.** Every page discovers its leagues from
   our own `League` table, so nothing under `src/app/` may read it; a page that
   did would have two sources for which leagues exist.
2. **Never call API-Football on page load.** A scheduled sync job writes into our
   own Postgres; the app only ever reads our own tables. The request budget this
   once protected is no longer scarce, but the rule is not really about quota: a
   page that reaches a third party waits on it, fails with it, and is rate-limited
   by its own traffic.
3. **One translation boundary.** The sync job is the only code that sees
   API-Football's JSON shape. It maps their payloads onto our schema. Everything
   else reads our schema, so a provider change touches one place.
4. **Every API-Football response must have its `errors` field checked.** The API
   reports refusals inside HTTP 200 bodies, so status-code-only error handling
   silently turns a refusal into "no results".

Verified facts about the data source, including the real season entitlement, the
rate-limit headers and the per-endpoint request costs, are in
[`docs/api-football-findings.md`](docs/api-football-findings.md). The app runs on
the **Pro** tier with `SEASON=2026` and `LEAGUES=39,94,140,135,78,61,113`. Entitlement is per
league as well as per season, so check a new id with
`python3 scripts/verify_api.py --league <id>` before adding it.

**Start here:** [`docs/roadmap.md`](docs/roadmap.md) records what is built, what
was deliberately **not** built and the argument that kept it out, and which
decisions are still open. Read it before proposing work, and update it when
something lands. It is a record, not a queue: it holds no ordering and no plan
for the next slice, because a plan written in advance becomes the plan by
default. Why a given slice was built the way it was is in its squash commit.

**Before writing code:** [`docs/architecture.md`](docs/architecture.md) records
how the system works, by subsystem — database, sync, auth and routing, design
tokens, the app shell, build and deploy. Read the section you are about to touch
first. It exists so the roadmap can stay a record of progress rather than
accumulating everything ever learned; keep facts on the correct side of that
line.

**Anything that renders:** [`docs/design/foundations.md`](docs/design/foundations.md)
is the design source of truth — the tokens (colour, type, spacing, elevation,
motion, states, icons) and the rules about when each applies. Read it before
writing markup or CSS, not after. Its own first rule is the one most easily
broken by accident: **never hard-code a hex or a raw px value in product code —
always a semantic token.**

The rebrand to "Field Notes" is **built**, and `foundations.md` describes it.
Marine is the only colour the brand owns and has six permitted places; the type
is Schibsted Grotesk and DM Mono; radius is zero everywhere; the icons are our
own thirty-six glyphs rather than Material Symbols. The board it was agreed on
is superseded by the document, which is the rule this project has kept
throughout: **a board records what was agreed, `foundations.md` records what has
landed, and the second wins.**

One warning that cost time to discover: **the `next` branch is an abandoned
earlier rebrand.** It carries a different identity — "Masthead", a full-bleed
dark band, set in Agency FB — with its own rewritten `foundations.md`, plus three
unrelated leagues nobody decided on. Do not read its `foundations.md` and assume
it describes the design that shipped. It must not be built on or merged.

## Stack

Decided:

- Next 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind 4
- Postgres on **Neon**, accessed through **Prisma**
- Auth via **Clerk** — managed rather than hand-rolled, because this holds real
  users' accounts and hand-rolled session handling is where beginners ship
  security holes
- Data source: API-Football, using `/fixtures`, `/fixtures/lineups` and
  `/fixtures/players`
- Hosting on **Vercel**

## How work runs

**The author does not read the diff.** There is no review handed back, no
browser check waiting on them and no plan agreed before building. Scoping a
feature, choosing its shape, writing it, testing it, documenting it and getting
it to a branch that is ready to land are all the assistant's. One thing is not.

**Never merge to `main` until the author says so.** Vercel builds from `main`,
so the merge *is* the production deploy. Work runs up to a ready branch and
stops there; when the author gives the word, the assistant runs the merge and
the push itself. **The word is given per landing and never carries forward** —
"yes" to this branch is not "yes" from now on, and questions about the work are
not the word.

That gate is the only one, and the rest of this section exists because of it.
With no second reader, the checks below are the whole of what stands between a
mistake and production.

### The loop

**1. Branch first, before any file changes.**

```
git switch -c <short-kebab-summary>
```

Retrofitting a branch after committing to `main` is the failure this ordering
exists to prevent.

**2. Read before writing.** The relevant guide in `node_modules/next/dist/docs/`
for anything Next-specific, the [`architecture.md`](docs/architecture.md)
sections covering the subsystems the work touches, and
[`foundations.md`](docs/design/foundations.md) for anything that renders.

**3. Write tests where they earn their place** — not "if applicable". Pure
functions, with a real payload as input; the sync mapper, the selection policy
and the pages' pure helpers are the cases that exist so far. **Fixtures are read
from the captured payloads in `scratch/` at test runtime**, never JSON typed
from memory and never JSON pasted into the test file. The reason is specific: if
the same understanding writes both the mapper and its fixture, they agree with
each other and are both wrong. Do not test Prisma, Next's rendering, Clerk, or
schema migrations and wiring, which have no meaningful assertion surface.

**4. Run the gate — all of it, not a subset.**

```
npx tsc --noEmit
npm run lint
npm test            # if tests exist
npm run build       # if routes or rendering were touched
```

`tsc --noEmit` is the highest-value feedback loop in this stack. Do not skip it
because the build passed.

**5. Commit at every working state.** Each commit must run. No `Co-Authored-By`
trailer and no AI attribution of any kind.

**6. Read `git diff main...HEAD` against the fixed criteria.** This is a
checklist, not a review — the same understanding that wrote the code is reading
it, so it cannot judge whether the design is right. What it can do is run
specific queries over the accumulated whole, including the debug line added
three fixes ago and the files you forgot you touched:

- Secrets or connection strings outside `.env.local`.
- A hardcoded season year or league id.
- `LEAGUES` read from anywhere under `src/app/`.
- Any API-Football call reachable from a page render.
- An unchecked `errors` field on a provider response.
- Provider JSON shape leaking past the sync boundary.
- A raw hex or px value in product code rather than a semantic token.

**7. Update the docs, as the last step.** Last deliberately: the docs describe
the work *as built*, which is only known once the diff has been read, and they
commit on the branch so they land with the slice rather than as a stray commit
afterwards. Three files, and **each one states its own writing rules in its own
preamble** — read them there rather than from a copy here, which is how the copy
would drift:

- [`docs/roadmap.md`](docs/roadmap.md) — what moved in the project's progress.
- [`docs/architecture.md`](docs/architecture.md) — what is now true of the
  system. Prune before you add, in that order.
- [`src/lib/changelog.ts`](src/lib/changelog.ts) — one entry, dated the day the
  slice lands, when the slice changed something a reader would notice. Not every
  slice earns one.

**8. Stop at the branch and report.** Say what the work does and what the author
would see on screen if they looked — the URL and what should be on it. Then
wait. Do not merge.

### Landing it, once the author has said so

```
git switch main
git pull --ff-only
git merge --squash <branch>
git commit                     # one readable commit for the whole slice
git push
git branch -D <branch>
```

The branch is never pushed. It exists so work in progress can be committed
freely without `main` ever holding a broken state; once the squash commit lands
it has no further job, and nothing else consumes it — there is no PR in this
flow.

`--ff-only` is deliberate. `main` should only ever move forward by these squash
commits, so if it cannot fast-forward, something has gone wrong and the merge
should stop rather than quietly manufacture a merge commit.

**The squash commit message is the only lasting record of the slice** — what it
does, what it cost, and what was deliberately left out. None of that is
recoverable from the individual commits, and it is why the roadmap holds one
line per step rather than an essay per step. It grew to 1,300 lines once by
holding the essays.

`branch -D`, not `-d`: a squash merge leaves no merge ancestry, so git does not
believe the branch is merged. The refusal is not worth heeding here — the squash
commit contains every change the branch made, and only the intermediate commits
go.

### When to stop rather than push on

- **Two failed attempts at the same failure.** Report it; do not attempt a third
  fix.
- **Never weaken an assertion, loosen a type, or add a cast to make something go
  green.** A failing test is sometimes correctly reporting that the approach is
  wrong. If that is the reading, say so plainly and stop.
- **A decision that is the author's rather than a judgement call**: an unsettled
  product rule, anything touching the non-negotiables above, and any change to
  what a screen promises a user. Everything else — the schema's shape, the
  structure, what to test, which library, how to build it — is the assistant's
  to decide and does not need asking.

Plan mode is still the right move when the shape of the work is genuinely open,
but a feature can be proposed in a sentence and built without a plan agreed
first. The two things that make that safe are also the two that would make it
unsafe again: the gate runs on every slice, and the docs are kept true so the
next session starts where this one finished.

## Other conventions

- Build in vertical slices — one thin feature end to end, then the next. Do not
  build whole layers speculatively.
- Secrets live in `.env.local`, which is gitignored. Never echo their values.
- **A doc correction is never local.** When a claim in one document turns out to
  be wrong, grep the other docs — `AGENTS.md`, `docs/*.md`, `docs/design/` — for
  the same claim and fix it everywhere, then report every file touched. Docs
  drift, and a fix applied in one place leaves the project contradicting itself.

## Known noise

`npm audit` reports high-severity issues in `postcss` and `sharp`. Both are
transitive dependencies of Next itself, and npm's suggested fix downgrades Next
to version 9. Do not run `npm audit fix --force`. Re-evaluate before launch.
`sharp` matters less than it looks: nothing renders remote images, so Next's
image optimiser never proxies `media.api-sports.io`.

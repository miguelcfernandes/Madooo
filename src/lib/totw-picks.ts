/**
 * Building an eleven: the shapes it can take, the pool it is picked from, and
 * what happens to a pick when the shape changes.
 *
 * Pure, and deliberately so, for the reason [`verdicts.ts`](./verdicts.ts) and
 * [`squad.ts`](./squad.ts) give: every decision worth arguing about is here —
 * which formations exist, which of a player's weeks makes the pool, what a
 * shorter midfield does to the two players standing in it — and none of it is a
 * query. Prisma is not imported, everything below is structural, and the tests
 * run the real shapes through it without a database.
 *
 * The reads are in [`totw.ts`](./totw.ts); the write is `saveTeamOfTheWeek` in
 * [`actions.ts`](./actions.ts).
 */

import { isDayKey, shiftDayKey } from './dates'
import { JudgementTag } from '../generated/prisma/enums'

/* ------------------------------------------------------------------ lines -- */

/**
 * The four lines of a team sheet, which are exactly the four letters
 * `MatchSquad.position` holds.
 *
 * **The app draws no finer position than this and must not.** `architecture.md`
 * is explicit that `RB`, `CB`, `AM` and `LW` are data the provider does not
 * publish anywhere, and a guess from `grid` prints a confident falsehood about
 * a real player. A team of the week is the one screen where that costs nothing:
 * a graphic wants a back four, not four named full-backs.
 */
export type Line = 'G' | 'D' | 'M' | 'F'

/** Goalkeeper first, then up the pitch — the order a team sheet is read in. */
export const LINES: readonly Line[] = ['G', 'D', 'M', 'F']

/**
 * What each line is called where it is written out in full — a pool block's
 * heading. `positionLabel` in [`squad.ts`](./squad.ts) answers the same question
 * in the three-letter form a dense row wants; this is the same vocabulary at the
 * other end of the scale, and the two are separate because a block header saying
 * `MID` reads as an abbreviation nobody expanded.
 */
export const LINE_LABELS: Record<Line, string> = {
  G: 'Goalkeeper',
  D: 'Defenders',
  M: 'Midfielders',
  F: 'Forwards',
}

/**
 * The line a squad row belongs to, or null for a position we do not recognise.
 *
 * Null is a real answer rather than a defensive one: the development database
 * holds rows whose position is `C` and rows whose position is null, most of them
 * the duplicate-player ghosts `architecture.md` records. A player with no line
 * cannot stand anywhere on a pitch, so the pool leaves them out and says how
 * many it left out — see `buildPool`.
 */
export function lineOf(position: string | null): Line | null {
  if (position === null) return null
  const letter = position.trim().toUpperCase()
  return letter === 'G' || letter === 'D' || letter === 'M' || letter === 'F' ? letter : null
}

/* ------------------------------------------------------------- formations -- */

/**
 * A shape, as the three numbers that decide it.
 *
 * **There is no goalkeeper count and there never will be**, which is why this is
 * three fields rather than a `Record<Line, number>`: one is not a decision.
 */
export interface Formation {
  readonly D: number
  readonly M: number
  readonly F: number
}

/**
 * The shapes the builder offers.
 *
 * **Only the three counts distinguish a formation here, so 4-2-3-1 is not on the
 * list — it is 4-5-1.** The app holds no finer position than the four letters
 * above, so a page that offered both would draw the identical picture twice and
 * ask the reader to believe there was a difference. That is the same restraint
 * as refusing to guess `RB` from a grid reference, applied to the shape instead
 * of to the player.
 *
 * Six, covering flat and narrow at each end of the pitch. **The list may grow
 * and must not shrink**: nothing stored names a formation — a saved team's shape
 * is counted off its own picks — so removing one would not break an existing
 * team, but it would leave a reader unable to rebuild a team they can still see.
 * Adding one is a line here and nothing else.
 */
export const FORMATIONS: readonly Formation[] = [
  { D: 4, M: 4, F: 2 },
  { D: 4, M: 3, F: 3 },
  { D: 4, M: 5, F: 1 },
  { D: 3, M: 5, F: 2 },
  { D: 3, M: 4, F: 3 },
  { D: 5, M: 3, F: 2 },
]

/** What the builder opens on. The most-drawn shape in the list. */
export const DEFAULT_FORMATION: Formation = FORMATIONS[1]

/** `4-3-3` — a formation's name is its numbers, so nothing has to store one. */
export function formationName(formation: Formation): string {
  return `${formation.D}-${formation.M}-${formation.F}`
}

/**
 * How many players each line holds. The goalkeeper is the constant this whole
 * module is built around, and it is written down exactly once, here.
 */
export function lineSizes(formation: Formation): Record<Line, number> {
  return { G: 1, D: formation.D, M: formation.M, F: formation.F }
}

/**
 * Whether a set of line counts is a shape the app offers.
 *
 * The one place `FORMATIONS` is consulted on the *write* side: a Server Action
 * is a public endpoint, so "eleven players in a shape somebody could have
 * chosen" is a claim the server has to check rather than a fact about the UI.
 */
export function isFormation(counts: Record<Line, number>): boolean {
  return (
    counts.G === 1 &&
    FORMATIONS.some(
      (formation) =>
        formation.D === counts.D && formation.M === counts.M && formation.F === counts.F,
    )
  )
}

/**
 * A formation from an untrusted string, falling back rather than refusing.
 *
 * The same shape as `parseView` and `parseDay`: this is handed a value a reader
 * can edit, and a formation nobody offers should draw the default rather than
 * an error page.
 */
export function parseFormation(value: unknown): Formation {
  const wanted = Array.isArray(value) ? value[0] : value
  if (typeof wanted !== 'string') return DEFAULT_FORMATION
  return FORMATIONS.find((formation) => formationName(formation) === wanted) ?? DEFAULT_FORMATION
}

/* ------------------------------------------------------------------- pool -- */

/**
 * The two verdicts a team of the week is picked from.
 *
 * **A flop is not a candidate, and that is a product rule rather than a filter
 * choice.** MVP and STANDOUT are the two things the reader said were *good*;
 * offering the third would make the screen a team of the week and its opposite
 * at once, and there is no slot on the pitch for it.
 */
export type PickedTag = Extract<JudgementTag, 'MVP' | 'STANDOUT'>

/** MVP above STANDOUT, wherever the two are ordered against each other. */
const TAG_RANK: Record<PickedTag, number> = { MVP: 0, STANDOUT: 1 }

/** Whether an untrusted value is one of the two. `isJudgementTag`'s shape. */
export function isPickedTag(value: unknown): value is PickedTag {
  return value === 'MVP' || value === 'STANDOUT'
}

/**
 * What the pool needs of a judged squad row, rather than Prisma's shape.
 *
 * Structural, so the page's query satisfies it without saying so — and so a
 * test can hand it four plain objects.
 */
export interface Candidate {
  /** The squad row: the *performance*, which is what a pick points at. */
  matchSquadId: number
  tag: PickedTag
  position: string | null
  player: { id: number; name: string }
  /** Nested rather than flattened, because that is the shape the query returns. */
  match: { kickoff: Date }
}

/** One player in the pool: the performance that represents them, and the count. */
export interface Pooled<T> {
  entry: T
  /**
   * How many of this player's performances in the window the reader marked,
   * the represented one included. Two means they were judged twice that week,
   * and the pool is showing the stronger of the two.
   */
  judged: number
}

export interface Pool<T> {
  lines: Record<Line, Pooled<T>[]>
  /**
   * Judged players left out because their squad row carries no position the app
   * recognises. Drawn as a line of prose when it is not zero, because a pool
   * that quietly omits somebody the reader remembers marking is a screen lying
   * by omission.
   */
  unplaceable: number
}

/**
 * The pool: one row per player, grouped by line, best performance first.
 *
 * **One entry per player, not per performance, and that is the decision this
 * function exists to make.** Over seven days a player is judged once and the two
 * readings agree; over a month they are judged four times, and a pool listing
 * each of them separately is four rows offering the same name and one slot to
 * put it in. So the performances fold into the player, and the one that
 * represents them is the strongest: MVP over STANDOUT, then the most recent, then
 * the higher squad row so the answer cannot depend on the order Postgres
 * returned.
 *
 * The fold is what makes "one player, one place" true by construction rather
 * than by a check — there is only ever one thing in the pool to pick, so the
 * unique constraint on `(team, matchSquad)` has nothing left to catch.
 *
 * **The representative is a performance, and the pick stores it.** A team of the
 * week says *this* was the week's best keeper, and the row it points at carries
 * the club he kept goal for that day, which is the colour the graphic is drawn
 * in. A pick against `Player` would have to guess at a club.
 */
export function buildPool<T extends Candidate>(rows: readonly T[]): Pool<T> {
  const best = new Map<number, Pooled<T>>()

  for (const row of rows) {
    const open = best.get(row.player.id)
    if (open === undefined) {
      best.set(row.player.id, { entry: row, judged: 1 })
      continue
    }
    open.judged += 1
    if (stronger(row, open.entry)) open.entry = row
  }

  const lines: Record<Line, Pooled<T>[]> = { G: [], D: [], M: [], F: [] }
  let unplaceable = 0

  for (const pooled of best.values()) {
    const line = lineOf(pooled.entry.position)
    if (line === null) unplaceable += 1
    else lines[line].push(pooled)
  }

  for (const line of LINES) lines[line].sort((a, b) => compareCandidates(a.entry, b.entry))

  return { lines, unplaceable }
}

/** Whether `candidate` should replace `held` as a player's representative. */
function stronger(candidate: Candidate, held: Candidate): boolean {
  const byTag = TAG_RANK[candidate.tag] - TAG_RANK[held.tag]
  if (byTag !== 0) return byTag < 0
  const byDate = candidate.match.kickoff.getTime() - held.match.kickoff.getTime()
  if (byDate !== 0) return byDate > 0
  return candidate.matchSquadId > held.matchSquadId
}

/**
 * MVPs first, then alphabetically.
 *
 * **The alphabet rather than the date**, which is the opposite of every other
 * list in the app. Those are diaries and read newest-first; this one is a list
 * you come to with a name in mind, and its whole job is that the name is
 * findable. Ending on the squad row makes the order total, so two players
 * sharing a name cannot swap places between requests.
 */
function compareCandidates(a: Candidate, b: Candidate): number {
  const byTag = TAG_RANK[a.tag] - TAG_RANK[b.tag]
  if (byTag !== 0) return byTag
  const byName = a.player.name.localeCompare(b.player.name)
  if (byName !== 0) return byName
  return a.matchSquadId - b.matchSquadId
}

/* ------------------------------------------------------------------ picks -- */

/** What has been picked, by line. Each array is at most as long as the shape allows. */
export type Picks<T> = Record<Line, readonly T[]>

/** Nothing picked yet. A function rather than a constant: four fresh arrays. */
export function emptyPicks<T>(): Picks<T> {
  return { G: [], D: [], M: [], F: [] }
}

/**
 * The same picks under a different shape, with whatever no longer fits removed.
 *
 * **Changing the formation must not empty the pitch, and the cost of that is
 * that it sometimes has to remove somebody.** Going 4-4-2 to 4-3-3 leaves a
 * midfielder with nowhere to stand, and the choice is between dropping one and
 * refusing the change. Dropping is right: the reader asked for three in
 * midfield, and the last one they put there is the one they are least attached
 * to. Every other pick survives, which is the property that makes the formation
 * control worth having at all — otherwise it is a control you dare not touch.
 */
export function fitToFormation<T>(picks: Picks<T>, formation: Formation): Picks<T> {
  const sizes = lineSizes(formation)
  return {
    G: picks.G.slice(0, sizes.G),
    D: picks.D.slice(0, sizes.D),
    M: picks.M.slice(0, sizes.M),
    F: picks.F.slice(0, sizes.F),
  }
}

/** How many places are filled, across every line. */
export function pickedCount<T>(picks: Picks<T>): number {
  return LINES.reduce((total, line) => total + picks[line].length, 0)
}

/** Eleven places, eleven players. The only state the team can be saved in. */
export function isComplete<T>(picks: Picks<T>, formation: Formation): boolean {
  const sizes = lineSizes(formation)
  return LINES.every((line) => picks[line].length === sizes[line])
}

/**
 * The eleven flattened into the order they are stored in — goalkeeper, then up
 * the pitch, and left to right within each line.
 *
 * `TeamOfTheWeekPick.order` is exactly the index into this array, which is why
 * the schema stores no line: reading a saved team groups by the position on each
 * squad row and gets the same lines back, in the same order.
 */
export function orderedPicks<T>(picks: Picks<T>): T[] {
  return LINES.flatMap((line) => [...picks[line]])
}

/**
 * A saved eleven put back into its lines, ready to draw.
 *
 * The inverse of `orderedPicks`, and the reason `TeamOfTheWeekPick` stores no
 * line of its own: the picks arrive in `order`, each one carries the squad row
 * it points at, and the position on that row says which line it stood in. So
 * the shape is *read off the eleven* rather than off a column that could
 * disagree with it.
 *
 * A pick whose position we no longer recognise is dropped rather than guessed
 * at. That cannot happen to a team this app saved — the action refuses an eleven
 * whose lines are not a formation — so it is the honest handling of a row edited
 * underneath us, not a case the screen is designed around.
 */
export function linesOf<T>(picks: readonly T[], positionOf: (pick: T) => string | null): Picks<T> {
  const lines: Record<Line, T[]> = { G: [], D: [], M: [], F: [] }
  for (const pick of picks) {
    const line = lineOf(positionOf(pick))
    if (line !== null) lines[line].push(pick)
  }
  return lines
}

/** The shape an eleven is standing in — the three counts, read off the picks. */
export function formationOf<T>(picks: Picks<T>): Formation {
  return { D: picks.D.length, M: picks.M.length, F: picks.F.length }
}

/* ------------------------------------------------------------- the write -- */

/**
 * How many teams of the week one account may hold.
 *
 * **A cap for the reason `sendSuggestion` has a rate limit**, which
 * `architecture.md` states: every export of a `'use server'` file is a public
 * POST endpoint, and this one is an insert with no unique constraint to bound
 * it. The other writes are bounded by the rows they can touch — a user has one
 * judgement per player per match, and re-tapping overwrites it — but one week's
 * eleven judgements can be saved as a new team as fast as the network allows.
 *
 * A total rather than a window, unlike the suggestion box's. What that limit
 * defends against is a loop; this one has a second job, which is that the index
 * page draws every team it holds and there has to be a number at which that
 * stops being a page. Both are answered by a ceiling, and a ceiling is the one a
 * reader can act on: delete one and make another.
 */
export const TOTW_LIMIT_PER_USER = 50

/**
 * What `saveTeamOfTheWeek` answers with.
 *
 * A returned value rather than a thrown error, for `SuggestionResult`'s reason:
 * throwing out of a Server Action hands the client a redacted message in
 * production, so "you have fifty of these already" would arrive as "an error
 * occurred". It lives here rather than in `actions.ts`, which may export
 * nothing but actions.
 */
export type TotwResult =
  | { ok: true; id: number }
  | { ok: false; reason: 'limit' | 'invalid' }

/* -------------------------------------------------------------- the span -- */

/**
 * How many days a bare `/team-of-the-week/new` covers.
 *
 * A week, because the screen is called a team of the week, and because a default
 * that is a fact about the world rather than about the reader needs no
 * remembering — the same argument that let `/fixtures` retire its cookie when it
 * became "today".
 */
export const DEFAULT_SPAN_DAYS = 7

/**
 * The widest span the builder will draw.
 *
 * Not a performance limit: the pool query filters by season, so a span of a
 * thousand years already returns one season's judgements. It stops the *label*
 * from reading 1970, which is what a mistyped year in a date field produces.
 */
const MAX_SPAN_DAYS = 366

/** A span of London calendar days, inclusive at both ends. */
export interface Span {
  fromDay: string
  toDay: string
}

/**
 * The span a request is asking for, falling back rather than refusing —
 * `parseDay`'s contract, over two values that have to agree with each other.
 *
 * Four rules, and each one exists because a date field is two keystrokes from
 * nonsense:
 *
 *   - A missing or unreal end is today. A missing or unreal start is a week
 *     back from whatever the end turned out to be, so fixing one field does not
 *     require fixing both.
 *   - **A backwards span is swapped, not rejected.** Somebody who typed the
 *     later date first meant the range between them; refusing it would be the
 *     screen being right about a technicality.
 *   - A span wider than a season is trimmed from the far end, keeping the end
 *     the reader chose. The end is the half they are more likely to have meant,
 *     since it is the one that says *which week*.
 *
 * `isDayKey` and `shiftDayKey` do the calendar work — this file holds no opinion
 * about what a day is, which is `dates.ts`' job and nobody else's.
 */
export function parseSpan(from: unknown, to: unknown, today: string): Span {
  const end = firstDayKey(to) ?? today
  const start = firstDayKey(from) ?? shiftDayKey(end, -(DEFAULT_SPAN_DAYS - 1))

  const [fromDay, toDay] = start <= end ? [start, end] : [end, start]
  const earliest = shiftDayKey(toDay, -(MAX_SPAN_DAYS - 1))

  return { fromDay: fromDay < earliest ? earliest : fromDay, toDay }
}

/**
 * One real day key out of a search parameter, or null.
 *
 * `unknown` and the array unwrapping for `parseDay`'s reason: `searchParams`
 * hands back `string | string[] | undefined`, and an array whenever the
 * parameter is repeated.
 */
function firstDayKey(value: unknown): string | null {
  const wanted = Array.isArray(value) ? value[0] : value
  return typeof wanted === 'string' && isDayKey(wanted) ? wanted : null
}

/**
 * Which competitions the pool is drawn from — exactly the ones chosen, and an
 * empty array when none are.
 *
 * **An empty choice means an empty pool, and it used to mean the opposite.** The
 * filter opened with every box ticked, so unticking the last one was a gesture
 * with no sensible reading and was taken to mean "all of them" — the kindest
 * answer available. The boxes now open *empty* and are ticked deliberately, which
 * makes the empty set the honest starting state rather than an accident, and the
 * builder says so in words instead of quietly showing everything. There is no
 * `null` any more: what the reader ticked is what is queried, stored and drawn.
 *
 * **Checked against the leagues the page actually holds**, so an id typed into
 * the URL cannot name a competition that does not exist, and an id left in a
 * bookmark after a league went away degrades to the rest of the choice rather
 * than to nothing. That is `back.ts`' reconstruction rule applied to a list:
 * what survives is what could have been offered.
 */
export function parseLeagues(value: unknown, offered: readonly { id: number }[]): number[] {
  const wanted = value === undefined ? [] : Array.isArray(value) ? value : [value]
  const allowed = new Set(offered.map((league) => league.id))

  const chosen = wanted
    .map((one) => (typeof one === 'string' ? Number(one) : Number.NaN))
    .filter((id) => allowed.has(id))

  return [...new Set(chosen)]
}

/* -------------------------------------------------------------- the name -- */

/**
 * How long a team of the week's name may be.
 *
 * Eighty, which is about twice the longest thing `suggestName` produces and
 * still fits a card's header without the truncation being the normal case. The
 * limit is a product rule and lives here rather than on the column, the same
 * split `NOTE_MAX_LENGTH` and `SUGGESTION_MAX_LENGTH` make.
 */
export const TOTW_NAME_MAX_LENGTH = 80

/**
 * A name off the wire, or null if it is not one. `normaliseSuggestion`'s shape,
 * for its reasons: the argument reaches a Server Action, so it is as untrusted
 * as a URL parameter and a type annotation proves nothing at runtime.
 */
export function normaliseName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null

  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > TOTW_NAME_MAX_LENGTH) return null

  return trimmed
}

/**
 * The names the save dialog offers before the reader types their own.
 *
 * **Suggestions rather than a generated name**, because what a team of the week
 * is called is the one thing about it the app cannot work out. What it can do is
 * spare the reader typing the obvious, so the box opens on the first of these
 * and the rest are one tap away.
 *
 * Three shapes, and the middle one only exists when it is true:
 *
 *   - `Team of the week, 17–23 Aug` — the plain one, and the default.
 *   - `Premier League team of the week, 17–23 Aug` — **only when exactly one
 *     competition was chosen.** With two it would have to list them or lie by
 *     naming one, and with none there is nothing to name.
 *   - `17–23 Aug` — the span alone, which is what the screen called these before
 *     they had names and is still the shortest true thing to call one.
 *
 * Pure, and it takes the span already formatted rather than two day keys: how a
 * date is written is `dates.ts`' business, and a second opinion about it here is
 * how the header and the name would drift apart.
 */
export function suggestNames(span: string, chosen: readonly { name: string }[]): string[] {
  const names = [`Team of the week, ${span}`]
  if (chosen.length === 1) names.push(`${chosen[0].name} team of the week, ${span}`)
  names.push(span)

  // A one-competition span could in principle produce the same string twice if
  // a league were ever called nothing; `Set` makes the list its own guarantee
  // rather than the caller's.
  return [...new Set(names)].filter((name) => name.length <= TOTW_NAME_MAX_LENGTH)
}

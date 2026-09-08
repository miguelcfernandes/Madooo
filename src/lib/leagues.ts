/**
 * A league's identity outside the database: the slug that names it, the order
 * competitions are shown in, and the flag that marks one on screen. The only
 * place any of those vocabularies is written down.
 *
 * Pure, like [`diary-views.ts`](./diary-views.ts) and
 * [`verdicts.ts`](./verdicts.ts), and for the same reason: what is decided here
 * is worth a test, and a test must be able to import this without Prisma in the
 * loop.
 *
 * **Why a slug rather than an id.** Three candidates, and the existing
 * conventions rule out two of them:
 *
 *   - `League.id` is our own autoincrement, assigned in sync order. It is not
 *     stable across Neon branches, so a value stored against one could name a
 *     different competition on a laptop and in production. (`parseLeague` in
 *     [`rankings.ts`](./rankings.ts) does use the id — but in `localStorage`,
 *     which never crosses a machine.)
 *   - `apiFootballId` is the provider's vocabulary, and the app keeps that out
 *     of everything above the sync deliberately — the same boundary the sync
 *     draws. It is also meaningless to a reader.
 *
 * The slug is derived from the name and never written down, which is the rule
 * `leaguesInSeason` and `parseLeague` already state for league identity.
 */

import { searchKey } from './rankings'

/**
 * "Primeira Liga" → `primeira-liga`.
 *
 * Built on `searchKey`, which is the app's one rule for flattening a name —
 * lower-cased and stripped of the diacritics a UK keyboard cannot produce. One
 * normalisation rule with two uses rather than two that can drift: it is what
 * makes "Primera División" come out as `primera-division` rather than as
 * something no one can type.
 */
export function leagueSlug(name: string): string {
  return searchKey(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/* ------------------------------------------------------------------ flags -- */

/**
 * What a flag needs of a league, which is its country and nothing else.
 *
 * An interface rather than a bare `country: string` parameter, because a
 * league's two strings are interchangeable to the compiler: `flagClass(
 * league.name)` would type-check and then return null forever. Structural
 * typing means a `League` row, or a `LeagueSection`, satisfies this without
 * saying so.
 */
export interface LeagueIdentity {
  /**
   * `League.country`, as API-Football spells it: "England", "Portugal",
   * "Spain", "Italy".
   */
  country: string
}

/**
 * The class in `globals.css` that paints a country's flag.
 *
 * Keyed on `searchKey` for `leagueSlug`'s reason — one rule for flattening a
 * name rather than two that can drift — which also means a provider recasing
 * "England" costs nothing.
 *
 * **A `Map`, not a `Record`.** `noUncheckedIndexedAccess` is off, so indexing a
 * `Record<string, string>` types as `string` and the `?? null` below would read
 * as dead code to the compiler while being very much alive at runtime. `.get`
 * is honest for free, and cannot answer a country called "toString" with a
 * function.
 */
const FLAGS = new Map([
  ['england', 'flag-gb-eng'],
  ['portugal', 'flag-pt'],
  ['spain', 'flag-es'],
  ['italy', 'flag-it'],
  ['germany', 'flag-de'],
  ['france', 'flag-fr'],
  ['sweden', 'flag-se'],
])

/**
 * The flag class for a league, or `null` where we have vendored no file.
 *
 * **`null` is the whole reason this is legal against `AGENTS.md`'s first
 * constraint.** The map above names no league, no id and no season — it is
 * indexed by a value that came out of the `League` table, so it cannot be
 * consulted without a row. An eighth league needs no edit here to work: it draws
 * its heading exactly as one is drawn today, which is what each of the seven
 * mapped countries did before its file was vendored.
 * The moment the fallback became an invented flag or a reserved gap, the map
 * would be part of the price of a league and the constraint would be broken.
 *
 * **The unmapped case is now the live one rather than a hypothetical.**
 * API-Football's country for the Champions League is "World", so it is the one
 * competition the app holds that draws no mark at all — its heading is its name
 * and nothing else, and `LeagueMarks` falls back to the name in words.
 *
 * That is a decision rather than a gap, and it is the same one that keeps club
 * crests off every screen. The Starball is a live UEFA trademark; the US
 * Copyright Office refused it copyright registration in 2018 for want of
 * creativity, which settles copyright in the US and settles nothing about the
 * mark. There is no national flag to reach for either — a competition is not a
 * country, and the European flag would be our invention rather than a fact out
 * of `League.country`. See `docs/design/foundations.md`.
 */
export function flagClass(league: LeagueIdentity): string | null {
  return FLAGS.get(searchKey(league.country)) ?? null
}

/* ------------------------------------------------------------------ order -- */

/**
 * The order competitions are shown in, most followed first.
 *
 * **This is a map for exactly the reason `FLAGS` above is one, and it passes
 * the same test.** It names no season and no league id; it is indexed by a value
 * that came out of the `League` table, so it cannot be consulted without a row.
 * An eighth league needs no edit here to work — it renders exactly as a ranked
 * one does and sorts after them, which is what keeps this decoration on a league
 * rather than part of the price of one. The moment an unranked league were
 * hidden, or held a reserved gap, `AGENTS.md`'s first constraint would be broken.
 *
 * **Adding Bundesliga, Ligue 1 and Allsvenskan moved the Primeira Liga from
 * fourth to sixth**, which is the rule below applied rather than a preference
 * about it: the order claims "most followed", and on that claim the two
 * remaining big-five competitions sit above it. It is one line if the author
 * wants it otherwise, and the section order on `/fixtures` is the only thing in
 * the app that would change.
 *
 * **The Champions League then took first, and moved all seven down one.** The
 * same rule again: on a Tuesday night it is the competition most of these
 * readers are watching, and it is the one whose clubs come from all seven of
 * the leagues below it. The author was asked rather than told, because where a
 * competition sits is a preference and not a fact — the alternatives were
 * sixth, under the big five, and unranked.
 *
 * **Why an order has to be stated at all.** Every derivable order is wrong here.
 * Alphabetical opens on La Liga forever. Earliest kickoff or most fixtures would
 * put whichever league happens to play at lunchtime above the one most readers
 * came for, and would reshuffle the page from day to day. Which competitions
 * people follow is a fact about people, and no column in this database holds it.
 *
 * A hand-written map rather than a `League.rank` column because reordering is
 * rare and a column costs a migration, a seed script, and the standing risk of
 * the sync's league upsert overwriting it. If reordering ever becomes frequent,
 * promoting this to a column is a contained change: the fallback below is
 * already the behaviour an unset column would need.
 */
const LEAGUE_ORDER = new Map([
  // "UEFA Champions League", because these keys are the provider's spelling and
  // not a person's. Dropping the "UEFA" here would rank nothing and sort the
  // competition last while looking correct, which is the trap `leagueRank`'s
  // test exists to catch.
  ['uefa champions league', 1],
  ['premier league', 2],
  ['la liga', 3],
  ['serie a', 4],
  ['bundesliga', 5],
  ['ligue 1', 6],
  ['primeira liga', 7],
  ['allsvenskan', 8],
])

/**
 * Where a league sorts. Unranked competitions come last, in one another's
 * alphabetical order — see `groupByLeague`, which applies the tiebreak.
 */
export function leagueRank(league: { name: string }): number {
  return LEAGUE_ORDER.get(searchKey(league.name)) ?? Number.MAX_SAFE_INTEGER
}

/**
 * How many competitions the team-of-the-week filter puts under "Top
 * competitions", counting down `LEAGUE_ORDER` from the top.
 *
 * Six: the big five, and the competition their best clubs play in midweek. That
 * the map ranks exactly those six 1 to 6 is not a coincidence — the order claims
 * "most followed", and this is the same claim with a line drawn across it.
 *
 * **It was five, and the Champions League taking first is what moved it.** The
 * number counts down `LEAGUE_ORDER`, so leaving it at five would have kept the
 * group at six names' worth of standing and quietly dropped Ligue 1 out of it —
 * a competition losing its place because a different one arrived, which is not
 * what the filter is saying. Six is the honest reading of the same order.
 *
 * **Reusing the rank is what keeps a league from costing code.** A checkbox
 * group with a hand-written list of top leagues would be a second place naming
 * competitions, and the ninth league would have to be added to it. Here an
 * unranked league sorts last and lands under "Other", which is what a new
 * competition should do until somebody decides otherwise — one line in
 * `LEAGUE_ORDER`, and nothing here.
 */
const TOP_LEAGUES = 6

/**
 * The order competitions are listed in, wherever a list of them is drawn.
 *
 * One comparator rather than the same two lines written out at each call site:
 * the rank decides, and the alphabet only ever separates two competitions
 * `LEAGUE_ORDER` does not name. `localeCompare` so a name with diacritics sorts
 * where a reader would look for it.
 */
export function compareLeagues(a: { name: string }, b: { name: string }): number {
  const order = leagueRank(a) - leagueRank(b)
  return order !== 0 ? order : a.name.localeCompare(b.name)
}

/**
 * Whether a competition is one of the six `TOP_LEAGUES` draws its line under —
 * the big five and the Champions League.
 *
 * Structural on `{ name }`, like `leagueRank` — anything with a name satisfies
 * it, and the flattening is `searchKey`'s, so a provider recasing "Serie A"
 * costs nothing.
 */
export function isTopLeague(league: { name: string }): boolean {
  return leagueRank(league) <= TOP_LEAGUES
}

/**
 * The competitions split into the two groups the filter draws, each in
 * `LEAGUE_ORDER`.
 *
 * **It sorts, unlike `groupByMonth` and like `groupByLeague`**, and for
 * `groupByLeague`'s reason: which competition leads a list is a question no
 * `ORDER BY` can answer, so the one opinion about it lives here. The tiebreak is
 * the same alphabet, and it only ever decides between two leagues the map does
 * not name — both of which are in "Other" by definition.
 */
export function splitByStanding<T extends { name: string }>(
  leagues: readonly T[],
): { top: T[]; other: T[] } {
  const ranked = [...leagues].sort(compareLeagues)

  return {
    top: ranked.filter(isTopLeague),
    other: ranked.filter((league) => !isTopLeague(league)),
  }
}

/* ------------------------------------------------------- a club's league -- */

/**
 * How many matches one club has in one competition this season.
 *
 * Structural, so the Prisma `groupBy` in [`clubs.ts`](./clubs.ts) satisfies it
 * without this file importing anything of Prisma's.
 */
export interface ClubLeagueAppearance {
  teamId: number
  leagueId: number
  /** Every match of the season, played or not — see `clubMainLeagues`. */
  matches: number
}

/**
 * Which single competition names each club.
 *
 * **`Team` has no league column**, and until now it did not need one: a club
 * reached a competition by playing in it, and with only domestic leagues synced
 * every club had exactly one. Three call sites relied on that quietly and each
 * picked its league a different arbitrary way — the directory took the first row
 * back, the club profile took `findFirst` with no `orderBy`, and the colour
 * picker took the last write. All three were correct by accident and all three
 * were one cup competition away from being wrong.
 *
 * The Champions League is that cup competition. Arsenal now have two, and
 * without a rule the club profile would have said "Premier League" on one load
 * and "UEFA Champions League" on the next, from the same data.
 *
 * **The rule: a club belongs to the competition it plays most of its football
 * in.** A domestic season is 30 to 38 fixtures and a European campaign is at
 * most 17, so the domestic league wins for every club that has one, and it wins
 * on the season's whole calendar rather than on the matches played so far —
 * which is what stops the answer moving in August, when a club may genuinely
 * have played one of each. A club we carry *only* through Europe, which is most
 * of the Champions League, is named by Europe: that is the truth about that club
 * as far as this database knows, and Feyenoord being filed under the
 * competition we actually watch them in is better than filing them nowhere.
 *
 * **Why not the provider's own answer.** API-Football does label a competition
 * `"League"` or `"Cup"`, but only on `/leagues`, which the sync does not call —
 * `/fixtures` carries no such field. Buying that label would cost a column, a
 * migration and a request per league per run, to settle a question the fixture
 * counts already answer. If a club ever plays in two cups and no synced league,
 * a count still has to break the tie, so the rule would be needed anyway.
 *
 * Ties go to `compareLeagues`, which makes the answer stable rather than
 * dependent on the order Postgres handed the rows back.
 */
export function clubMainLeagues(
  appearances: readonly ClubLeagueAppearance[],
  leagues: readonly { id: number; name: string }[],
): Map<number, number> {
  const leagueName = new Map(leagues.map((league) => [league.id, league.name]))

  // Summed rather than assigned: a club is grouped once per side of the fixture,
  // so `clubLeagues` returns it twice per competition and both halves are real.
  const played = new Map<number, Map<number, number>>()
  for (const row of appearances) {
    let byLeague = played.get(row.teamId)
    if (byLeague === undefined) {
      byLeague = new Map()
      played.set(row.teamId, byLeague)
    }
    byLeague.set(row.leagueId, (byLeague.get(row.leagueId) ?? 0) + row.matches)
  }

  const main = new Map<number, number>()
  for (const [teamId, byLeague] of played) {
    let bestId: number | null = null
    let bestMatches = -1

    for (const [leagueId, matches] of byLeague) {
      if (bestId === null || matches > bestMatches) {
        bestId = leagueId
        bestMatches = matches
        continue
      }
      if (matches < bestMatches) continue

      // A tie, broken by standing so that the answer does not depend on the
      // iteration order. A league the `leagues` list does not name sorts last,
      // which is `compareLeagues`' own rule rather than a special case here.
      const contender = { name: leagueName.get(leagueId) ?? '' }
      const holder = { name: leagueName.get(bestId) ?? '' }
      if (compareLeagues(contender, holder) < 0) {
        bestId = leagueId
        bestMatches = matches
      }
    }

    // Unreachable: a club only reaches `played` by having a row, and a row
    // carries a league. Guarded rather than asserted so the map holds no
    // invented ids.
    if (bestId !== null) main.set(teamId, bestId)
  }

  return main
}

/** What a section heading needs of a league: a key, a name, and its flag's country. */
export interface LeagueSection extends LeagueIdentity {
  id: number
  name: string
}

/** A run of items belonging to one competition, headed by it. */
export interface LeagueGroup<T> {
  league: LeagueSection
  items: T[]
}

/**
 * Cut a list into one group per competition, most followed first.
 *
 * **Unlike `groupByMonth` in [`dates.ts`](./dates.ts), this sorts** — and the
 * difference is worth stating, because that function makes never sorting its
 * whole design. It can, because a month heading's order *is* the order of the
 * rows under it, which Postgres already decided. A league heading's is not: the
 * query orders fixtures by kickoff, and which competition leads the page is a
 * separate question that no `ORDER BY` can answer, for `LEAGUE_ORDER`'s reason.
 *
 * So the two orders are split cleanly. **Within** a group, order is preserved
 * exactly as handed over, which keeps Postgres in charge of kickoff order the
 * way `groupByMonth` does. **Between** groups, this sorts, and it is the only
 * opinion about that.
 *
 * Generic over `T` with a `(item: T) => LeagueSection` accessor rather than
 * requiring a `league` property, so it groups anything without knowing what a
 * fixture is — `groupByMonth`'s shape, for `groupByMonth`'s reason.
 */
export function groupByLeague<T>(
  items: readonly T[],
  leagueOf: (item: T) => LeagueSection,
): LeagueGroup<T>[] {
  const groups = new Map<number, LeagueGroup<T>>()

  for (const item of items) {
    const league = leagueOf(item)
    const open = groups.get(league.id)
    if (open === undefined) groups.set(league.id, { league, items: [item] })
    else open.items.push(item)
  }

  return [...groups.values()].sort((a, b) => compareLeagues(a.league, b.league))
}

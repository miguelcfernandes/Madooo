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
 * The unmapped case is not hypothetical. API-Football's country for the
 * Champions League is "World".
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
  ['premier league', 1],
  ['la liga', 2],
  ['serie a', 3],
  ['bundesliga', 4],
  ['ligue 1', 5],
  ['primeira liga', 6],
  ['allsvenskan', 7],
])

/**
 * Where a league sorts. Unranked competitions come last, in one another's
 * alphabetical order — see `groupByLeague`, which applies the tiebreak.
 */
export function leagueRank(league: { name: string }): number {
  return LEAGUE_ORDER.get(searchKey(league.name)) ?? Number.MAX_SAFE_INTEGER
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

  return [...groups.values()].sort((a, b) => {
    const order = leagueRank(a.league) - leagueRank(b.league)
    // The alphabet only ever decides between two leagues this map does not
    // name. `localeCompare` rather than `<` so a competition with diacritics
    // sorts where a reader would look for it.
    return order !== 0 ? order : a.league.name.localeCompare(b.league.name)
  })
}

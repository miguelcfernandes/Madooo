/**
 * Everything `/fixtures` reads. Our own tables only — nothing here can reach
 * API-Football, which is constraint #2.
 */

import { dayKey } from './dates'
import { prisma } from './prisma'

/**
 * Every competition with a match this season.
 *
 * **Read by `/teams` alone now**, through the re-export in
 * [`teams/directory.ts`](./teams/directory.ts), and it stays in this file
 * because that is where the re-export points. `/fixtures` used it for the league
 * row it no longer has: a day's sections are derived from the fixtures that came
 * back, so the page cannot offer a competition it has nothing to show for.
 *
 * Deliberately **not** `leaguesInSeason` from [`players.ts`](./players.ts),
 * whose extra `squadEntries: { some: {} }` clause asks for leagues with
 * published lineups. That is the right question for a list of players, who only
 * exist as squad rows, and the wrong one for a select of clubs: it would hide a
 * league whose season has not kicked off yet.
 *
 * `country` is inert at that call site — an `<option>` cannot hold markup, so
 * the select draws no flag. One string per league rides into that page's payload
 * unused, which is cheaper than forking the query.
 */
export async function leaguesWithMatches(season: number) {
  return prisma.league.findMany({
    where: { matches: { some: { season } } },
    select: { id: true, name: true, country: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * The day before and the day after this one that have football in them, or
 * `null` at either end of the season.
 *
 * **The pager steps between days that exist, not between calendar days.** An
 * international break is eight consecutive empty days; arrows that advanced by
 * one date would make a reader click through every one of them to reach the next
 * fixture. So "previous" is the day holding the latest kickoff before this day
 * starts, and "next" is the day holding the earliest kickoff after it ends —
 * which is exactly what two `findFirst`s answer.
 *
 * Both run against `@@index([kickoff])` and return one row each, so this costs
 * two index seeks rather than a scan. They go out together under `Promise.all`,
 * so the page waits for the slower rather than for the sum.
 *
 * This is also what makes an empty day navigable. A reader who opens the app on
 * a Tuesday in June gets "no fixtures" with both arrows live, because neither
 * query cares whether the day between them holds anything.
 */
export async function neighbouringDays(
  season: number,
  from: Date,
  to: Date,
): Promise<{ previous: string | null; next: string | null }> {
  const [before, after] = await Promise.all([
    prisma.match.findFirst({
      where: { season, kickoff: { lt: from } },
      orderBy: { kickoff: 'desc' },
      select: { kickoff: true },
    }),
    prisma.match.findFirst({
      where: { season, kickoff: { gte: to } },
      orderBy: { kickoff: 'asc' },
      select: { kickoff: true },
    }),
  ])

  return {
    previous: before === null ? null : dayKey(before.kickoff),
    next: after === null ? null : dayKey(after.kickoff),
  }
}

const teamFields = {
  select: { id: true, name: true, code: true, colour: true },
} as const

/**
 * One day's fixtures across every competition, with everything a card draws.
 *
 * **No `leagueId`, and that is the change this screen is built around.** The
 * page groups what comes back by competition rather than asking per competition,
 * so a day is one query however many leagues are configured — which is what lets
 * the fifth and the fifteenth cost nothing here.
 *
 * `league` is selected because the page heads a section with it. The three
 * fields are what `LeagueSection` in [`leagues.ts`](./leagues.ts) needs: the id
 * to group on, the name to show, and the country its flag is drawn from.
 *
 * `_count.squadEntries` is what decides whether a card is openable. Counting is
 * the point: asking whether *any* squad row exists must not mean loading forty
 * of them per match to find out.
 *
 * `squadEntries` beside it is the card's footer — the user's verdicts and notes
 * on this match. **The two do not interfere.** A `_count` entry takes its own
 * optional `where` and has none here, so it stays a count of the whole squad
 * however the sibling selection is filtered; if it did inherit that filter, every
 * card on the day would quietly stop opening.
 *
 * The filter keeps the selection to the rows this user has judged, which is a
 * handful per match rather than forty, and `countVerdicts` and `countNotes` in
 * [`verdicts.ts`](./verdicts.ts) fold it into the two numbers. Counting in JS
 * here rather than in Postgres because one relation can carry only one `_count`,
 * and this needs two different tallies out of the same rows.
 */
export async function fixturesOnDay(season: number, from: Date, to: Date, userId: number) {
  return prisma.match.findMany({
    // Half-open, which is `dayRange`'s doing: a kickoff at exactly midnight
    // belongs to the day starting then, and to no other.
    where: { season, kickoff: { gte: from, lt: to } },
    orderBy: [{ kickoff: 'asc' }, { id: 'asc' }],
    include: {
      league: { select: { id: true, name: true, country: true } },
      homeTeam: teamFields,
      awayTeam: teamFields,
      _count: { select: { squadEntries: true } },
      squadEntries: {
        where: { judgements: { some: { userId } } },
        select: {
          // The same `where` again, and it is not redundant: the outer one picks
          // the squad rows, this one picks which judgements come back on them.
          // Without it a second account's judgement would arrive attached to a
          // row this user judged, and the tallies would count it.
          judgements: { where: { userId }, select: { tag: true, note: true } },
        },
      },
    },
  })
}

/** The four numbers on the stat tiles, for one user in one season. */
export interface SeasonTotals {
  watched: number
  standouts: number
  flops: number
  notes: number
}

/**
 * The stat tiles. Season-wide, which is what the first tile's "this season"
 * says out loud and the other three inherit — a tally that moved as you paged
 * through the days would not be a tally.
 *
 * **The absence of both a day and a `leagueId` here is deliberate, and it is the
 * one thing on this page most likely to be "fixed" by a later reader.** Every
 * query above is scoped to the day on screen; this is scoped to neither the day
 * nor the competition. These four numbers are the reader's whole season across
 * every competition, which is also what `/diary` counts and what makes the two
 * agree.
 *
 * **"Watched" is a match this user has recorded anything against** — a tag or a
 * note. It is a query rather than a column: nothing marks a match as watched,
 * and having had something to say about one is the only evidence there is.
 *
 * Four `count`s rather than reading the judgements and folding them, because a
 * season's judgements are unbounded and nothing on this page wants the rows. They
 * go out together under `Promise.all`, so the page waits for the slowest rather
 * than for the sum.
 */
export async function seasonTotals(season: number, userId: number): Promise<SeasonTotals> {
  // Reaching from a judgement back to the season it belongs to, through the
  // squad row and its match. Repeated four times because Prisma's `where` is a
  // plain object literal per query, and naming it would hide the one thing worth
  // seeing here.
  const inSeason = { userId, matchSquad: { match: { season } } }

  const [watched, standouts, flops, notes] = await Promise.all([
    prisma.match.count({
      where: { season, squadEntries: { some: { judgements: { some: { userId } } } } },
    }),
    prisma.judgement.count({ where: { ...inSeason, tag: 'STANDOUT' } }),
    prisma.judgement.count({ where: { ...inSeason, tag: 'FLOP' } }),
    // Not `{ not: '' }` as well: `setNote` stores a cleared note as no judgement
    // or as a null column, never as an empty string, so null is the whole of it.
    prisma.judgement.count({ where: { ...inSeason, note: { not: null } } }),
  ])

  return { watched, standouts, flops, notes }
}

/**
 * The element type of what `fixturesOnDay` resolves to.
 *
 * Written as a query on the function rather than as a hand-maintained interface:
 * `include` decides the shape, so a type spelled out separately would be a second
 * copy free to drift. `Awaited<…>` unwraps the promise, `[number]` indexes the
 * array — TypeScript's way of saying "whatever you get by subscripting this".
 */
export type Fixture = Awaited<ReturnType<typeof fixturesOnDay>>[number]

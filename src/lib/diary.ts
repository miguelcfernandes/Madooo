/**
 * Everything `/diary` reads. Our own tables only — nothing here can reach
 * API-Football, which is constraint #2.
 */

import { prisma } from './prisma'
import type { EntriesView } from './diary-views'

/**
 * Every judgement this user has recorded in one season, newest first.
 *
 * **Ordered by when it was written, not by when the match was played.** A diary
 * entry is dated by the act of writing it, which is what makes two verdicts on
 * one match recorded a fortnight apart sit a fortnight apart in the list. The
 * fixture is still named on every row, so nothing is lost by the date meaning
 * the other thing.
 *
 * That order is why `Judgement` carries `@@index([userId, createdAt])`: the
 * index has been in the schema since step 2, and this is the query it was for.
 * `id` breaks ties, because two judgements saved in the same millisecond would
 * otherwise come back in whatever order Postgres liked that afternoon.
 *
 * The season is reached through two relations — `matchSquad.match.season` —
 * since a `Judgement` points at a `MatchSquad` and carries no match of its own.
 *
 * No `take`. A season's entries are bounded by how much one person typed, and
 * the design draws no pager; if that ever stops being true the fix is a `take`
 * here rather than a different shape.
 */
export async function diaryEntries(season: number, userId: number, view: EntriesView) {
  return prisma.judgement.findMany({
    where: { userId, matchSquad: { match: { season } }, ...view.where },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      tag: true,
      note: true,
      createdAt: true,
      matchSquad: {
        select: {
          player: { select: { id: true, name: true } },
          match: {
            select: {
              id: true,
              homeGoals: true,
              awayGoals: true,
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      },
    },
  })
}

/** The four numbers on the diary's stat tiles, for one user in one season. */
export interface DiaryTotals {
  entries: number
  standouts: number
  flops: number
  notes: number
}

/**
 * The stat tiles above the list. Season-wide, and deliberately deaf to the
 * filter: the tiles say what the season holds, and a tally that changed when you
 * clicked "Flops" would not be a tally.
 *
 * Its own function rather than a call to `seasonTotals` in
 * [`fixtures.ts`](./fixtures.ts), which the three lower tiles duplicate. The two
 * pages count different things in their first tile — that one counts *matches
 * watched*, this one counts *entries written* — and a shared function returning
 * five numbers so each caller could throw one away would make both pay for the
 * other's question. If a third screen wants these three, that is the point at
 * which extracting them earns its keep.
 */
export async function diaryTotals(season: number, userId: number): Promise<DiaryTotals> {
  const inSeason = { userId, matchSquad: { match: { season } } }

  const [entries, standouts, flops, notes] = await Promise.all([
    prisma.judgement.count({ where: inSeason }),
    prisma.judgement.count({ where: { ...inSeason, tag: 'STANDOUT' } }),
    prisma.judgement.count({ where: { ...inSeason, tag: 'FLOP' } }),
    prisma.judgement.count({ where: { ...inSeason, note: { not: null } } }),
  ])

  return { entries, standouts, flops, notes }
}

/**
 * The element type of what `diaryEntries` resolves to.
 *
 * Derived from the function rather than written out, the same way `Fixture` and
 * `MatchWithSquads` are: `select` decides the shape, so a hand-maintained
 * interface would be a second copy free to drift.
 */
export type DiaryEntry = Awaited<ReturnType<typeof diaryEntries>>[number]

/**
 * Every match this user recorded anything in, one row each, newest kickoff
 * first — the diary's Matches tab.
 *
 * **Ordered by kickoff, which is the one place in the diary that is not ordered
 * by when you wrote.** The rest of the screen is dated by the act of writing,
 * deliberately; this tab exists because a reader could not find a match in that
 * list, and a match is remembered by the day it was played. Grouping it by the
 * month written would have reproduced the problem it was added to solve.
 *
 * The `where` is the same predicate as `seasonTotals`' first count in
 * [`fixtures.ts`](./fixtures.ts): *watched* is a match this user recorded
 * anything against, tag or note, and it is a query over `Match` because nothing
 * marks a match as watched. The two agreeing is what makes the Watched tile a
 * count of exactly this list.
 *
 * **One query rather than a `groupBy` and a fold.** `Judgement` carries no
 * `matchId` — it points at a `MatchSquad` — so Postgres cannot group judgements
 * by match any more than it can group them by player, which is the constraint
 * `/players` runs into. The nested `where` filters each match's squad down to
 * the rows this user judged, so what comes back per match is bounded by how many
 * players they had something to say about, and the summary is folded in
 * JavaScript by `summariseMatch`.
 *
 * No `take`, for `diaryEntries`' reason: a season is bounded by how much one
 * person watched, and the design draws no pager.
 */
export async function diaryMatches(season: number, userId: number) {
  return prisma.match.findMany({
    where: { season, squadEntries: { some: { judgements: { some: { userId } } } } },
    // `id` breaks ties, because two matches kicking off at the same minute is
    // the normal case rather than the rare one.
    orderBy: [{ kickoff: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      kickoff: true,
      // Both goal columns and both team names, which is exactly `Scored` in
      // `text.ts` — so `scoreline` accepts this row structurally, with no cast
      // and without that file knowing this query exists.
      homeGoals: true,
      awayGoals: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      league: { select: { name: true } },
      squadEntries: {
        where: { judgements: { some: { userId } } },
        select: {
          player: { select: { name: true } },
          // Filtered to this user, the same way `matchWithSquads` does it: a
          // diary is private, and an unfiltered relation would read other
          // people's rows.
          judgements: { where: { userId }, select: { tag: true, note: true } },
        },
      },
    },
  })
}

/** The element type of what `diaryMatches` resolves to. `DiaryEntry`'s reasoning. */
export type DiaryMatch = Awaited<ReturnType<typeof diaryMatches>>[number]

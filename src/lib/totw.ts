/**
 * Everything the three `/team-of-the-week` screens read. Our own tables only —
 * nothing here can reach API-Football, which is constraint #2.
 *
 * The decisions these queries feed are in
 * [`totw-picks.ts`](./totw-picks.ts), which is pure and tested; this file is the
 * part that talks to Postgres and is not.
 */

import { daySpan } from './dates'
import { prisma } from './prisma'
import type { PickedTag } from './totw-picks'

/**
 * Every performance in a span this user marked MVP or STANDOUT — the pool the
 * eleven is picked from, before `buildPool` folds it player by player.
 *
 * **The span is over kickoffs, not over when the reader wrote.** That is the
 * opposite reading from the diary's two entry views, and it is the same reading
 * as its Matches tab: a team of *the week* is a claim about the football played
 * that week, so a verdict typed on Tuesday about Saturday's match belongs to
 * Saturday. Ordering entries by the act of writing is right for a diary and
 * would be wrong here.
 *
 * **`season` is here as well as the dates, and it is not redundant.** Every read
 * in the app filters by the configured season, and the development branch holds
 * a whole 2024 of judgements that no screen shows; without this, a reader who
 * typed 2024 into the date fields would get a pool the rest of the app denies
 * exists.
 *
 * **An empty `leagueIds` returns nothing, and that is now the correct answer.**
 * The filter opens with no competition ticked, so "none chosen" is a real state
 * a reader arrives in rather than a gesture to be second-guessed — the caller
 * skips the query entirely and the builder says what to do. The ids come from
 * our own `League` table by way of the form; `LEAGUES` is read by the sync
 * alone, and nothing under `src/app/` may see it.
 *
 * No `take`: the pool is bounded by how much one person marked in a span they
 * chose, and the builder draws every candidate because picking from a truncated
 * list is picking from the wrong list.
 */
export async function poolCandidates(
  season: number,
  userId: number,
  fromDay: string,
  toDay: string,
  leagueIds: number[],
) {
  const { from, to } = daySpan(fromDay, toDay)

  const rows = await prisma.judgement.findMany({
    where: {
      userId,
      tag: { in: ['MVP', 'STANDOUT'] },
      matchSquad: {
        match: {
          season,
          kickoff: { gte: from, lt: to },
          leagueId: { in: leagueIds },
        },
      },
    },
    select: {
      tag: true,
      matchSquad: { select: PERFORMANCE },
    },
  })

  // Flattened here rather than at the call site, so `Candidate`'s shape is
  // satisfied structurally: the tag sits on the judgement and everything else
  // sits on the squad row, and the pool wants one object holding both.
  return rows.map((row) => ({
    ...row.matchSquad,
    // The column is the three-value enum and the filter above narrows it to
    // two. Prisma cannot see that, so this is the one place the narrowing is
    // asserted rather than proved — `isPickedTag` does the proving on the write
    // side, where the value comes off the wire instead of out of a `where`.
    tag: row.tag as PickedTag,
  }))
}

/**
 * What both the pool and a saved eleven need of a squad row: who, for which
 * club, wearing what, standing where, in which match.
 *
 * One constant because the two are the same object read at two moments — a
 * candidate is a performance you might pick, and a pick is a performance you
 * did. Two `select`s free to drift would be two opinions about what a player on
 * a pitch is drawn from.
 */
const PERFORMANCE = {
  id: true,
  position: true,
  shirtNumber: true,
  player: { select: { id: true, name: true } },
  // Everything `crest()` needs, plus the id the graphic never uses and the
  // pool row's link does.
  team: { select: { id: true, name: true, code: true, colour: true } },
  match: {
    select: {
      id: true,
      kickoff: true,
      // Both goal columns and both club names, which is `Scored` in `text.ts`
      // exactly — so `scoreline` accepts this row with no cast.
      homeGoals: true,
      awayGoals: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  },
} as const

/**
 * The element type of a pool row, derived from the query rather than written
 * out — `select` decides the shape, so a hand-kept interface would be a second
 * copy free to drift. `Fixture` and `DiaryEntry` are the same move.
 */
export type PoolRow = Awaited<ReturnType<typeof poolCandidates>>[number]

/**
 * Renaming the squad row's `id` to what a pick calls it.
 *
 * A `PoolRow` carries `id`, because that is what `select` returns; `buildPool`
 * wants `matchSquadId`, because on the far side of a pick the word `id` would
 * be ambiguous between the squad row and the team of the week. One rename in
 * one place rather than a `select` alias, which Prisma has no syntax for.
 *
 * The result satisfies `Candidate` in [`totw-picks.ts`](./totw-picks.ts)
 * structurally, which is what lets that module stay free of this one.
 */
export function asCandidate(row: PoolRow) {
  return { ...row, matchSquadId: row.id }
}

/**
 * Every team of the week this user has saved in one season, newest first, with
 * the eleven each one holds.
 *
 * **The picks come with the list rather than on demand**, because the index
 * draws each team as its own small pitch: a row saying "17–23 Aug, 4-3-3" and
 * nothing else would make the reader open all of them to find the one they
 * meant. Eleven rows a team against a list bounded by `TOTW_LIMIT_PER_USER` is
 * a known ceiling, which is the other half of why that limit exists.
 */
export async function teamsOfTheWeek(season: number, userId: number) {
  return prisma.teamOfTheWeek.findMany({
    where: { season, userId },
    // `id` breaks ties: two saved in the same millisecond would otherwise come
    // back in whatever order Postgres liked that afternoon.
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: SAVED,
  })
}

/**
 * One saved team, or null.
 *
 * **`userId` is in the `where`, not checked after the read.** A diary is
 * private, and an id in a URL is a guess anybody can make; filtering in the
 * query means somebody else's team is indistinguishable from one that does not
 * exist, which is the answer that gives nothing away.
 */
export async function teamOfTheWeek(id: number, userId: number) {
  return prisma.teamOfTheWeek.findFirst({
    where: { id, userId },
    select: SAVED,
  })
}

/**
 * How many of this user's teams of the week hold a given player.
 *
 * **A count rather than the list**, because it answers the only question every
 * player profile asks: whether to draw the tab at all. Almost every profile's
 * answer is zero, and paying for eleven picks and their squad rows to find that
 * out would be paying for the rare case on every render — the same argument the
 * profile already makes about its own three reads going out together.
 *
 * The predicate reaches through two relations: a team holds picks, a pick holds
 * a squad row, and a squad row holds the player. It is the same predicate
 * `playerElevens` filters by, which is what keeps the tab and its contents from
 * disagreeing about whether there is anything there.
 */
export async function countPlayerElevens(playerId: number, season: number, userId: number) {
  return prisma.teamOfTheWeek.count({
    where: { season, userId, picks: { some: { matchSquad: { playerId } } } },
  })
}

/**
 * The teams of the week this player was picked for, newest first.
 *
 * Read only when that tab is the one being drawn — see the profile — and it
 * comes back as whole saved teams because the tab draws the same card the list
 * does. A lighter shape would be a second, smaller idea of what a team of the
 * week looks like on a screen.
 */
export async function playerElevens(playerId: number, season: number, userId: number) {
  return prisma.teamOfTheWeek.findMany({
    where: { season, userId, picks: { some: { matchSquad: { playerId } } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: SAVED,
  })
}

/**
 * What a saved team is read as, on the list and on its own page.
 *
 * One constant for both, because the list draws the same pitch the page does —
 * two `select`s would be two chances for a card and the page it opens to hold
 * different players.
 *
 * The competitions come back as `League` rows rather than ids: the only thing
 * anything does with them is draw a flag and name it, and resolving names in a
 * second query would be a join the database is better at.
 */
const SAVED = {
  id: true,
  name: true,
  fromDay: true,
  toDay: true,
  createdAt: true,
  picks: {
    orderBy: { order: 'asc' },
    select: { id: true, tag: true, order: true, matchSquad: { select: PERFORMANCE } },
  },
  leagues: {
    // The join row holds nothing but the pair, so what is wanted is the league
    // on the other end of it.
    select: { league: { select: { id: true, name: true, country: true } } },
  },
} as const

/** The element type of a saved team, one of its eleven picks, and a competition. */
export type SavedTeam = NonNullable<Awaited<ReturnType<typeof teamOfTheWeek>>>
export type SavedPick = SavedTeam['picks'][number]
export type SavedLeague = SavedTeam['leagues'][number]['league']

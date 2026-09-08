/**
 * Which competitions a club plays in this season, and how often.
 *
 * One query behind [`clubMainLeagues`](./leagues.ts), which is the rule that
 * turns this into a single competition per club. It lives in its own module
 * rather than in [`teams/directory.ts`](./teams/directory.ts), where it started,
 * because three screens now ask it and none of them is `/teams`' to own: the
 * club directory, the player directory and a club's own profile all have to
 * agree about which competition a club belongs to, and a second copy of this
 * `groupBy` is exactly how they would stop agreeing.
 *
 * Our own tables only — constraint #2. Nothing here can reach API-Football.
 */

import { prisma } from './prisma'
import type { ClubLeagueAppearance } from './leagues'

/**
 * Every club's competitions this season, or one club's.
 *
 * **`OR`-ed across both sides of the fixture, which in Prisma's `groupBy` means
 * two calls rather than one clause** — `clubLeagues`' original note, and still
 * true: a club with no *home* match is a state round-by-round hydration can
 * produce, and it should still have a competition. Each call returns a club once
 * per side and `clubMainLeagues` sums the halves.
 *
 * **Every match of the season, not every match played.** The count is what
 * decides a club's competition, and counting only what has kicked off would let
 * that answer move: in August a club can have played one league match and one
 * European one, and the honest answer is still the league it will play
 * thirty-odd times. The `Match` table holds the whole calendar from the first
 * fixtures sync, so this costs nothing to get right.
 *
 * `teamId` narrows it to one club, for the profile page — the same question,
 * asked of one row instead of six hundred, rather than a second query shaped
 * differently.
 */
export async function clubLeagues(
  season: number,
  teamId?: number,
): Promise<ClubLeagueAppearance[]> {
  const [home, away] = await Promise.all([
    prisma.match.groupBy({
      by: ['homeTeamId', 'leagueId'],
      where: teamId === undefined ? { season } : { season, homeTeamId: teamId },
      _count: true,
    }),
    prisma.match.groupBy({
      by: ['awayTeamId', 'leagueId'],
      where: teamId === undefined ? { season } : { season, awayTeamId: teamId },
      _count: true,
    }),
  ])

  return [
    ...home.map((row) => ({
      teamId: row.homeTeamId,
      leagueId: row.leagueId,
      matches: row._count,
    })),
    ...away.map((row) => ({
      teamId: row.awayTeamId,
      leagueId: row.leagueId,
      matches: row._count,
    })),
  ]
}

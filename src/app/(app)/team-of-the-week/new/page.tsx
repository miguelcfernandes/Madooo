import { requireDbUser } from '@/lib/auth'
import { dateRange, dayKey, dayRange } from '@/lib/dates'
import { season } from '@/lib/env'
import { leaguesInSeason } from '@/lib/players'
import { asCandidate, poolCandidates } from '@/lib/totw'
import { buildPool, parseLeagues, parseSpan } from '@/lib/totw-picks'
import { PageHeader } from '@/components/page-header'
import { TotwBuilder } from '@/components/totw-builder'
import { TotwRangeForm } from '@/components/totw-range-form'

export const dynamic = 'force-dynamic'

/**
 * Building one: the span, the competitions, the pool, and the pitch.
 *
 * **Two stores on one screen, and the split is the app's own rule.** The span
 * and the competitions decide what the server queries, so they are a *location*
 * and live in the URL — which is what keeps this page a server component, makes
 * a pool linkable, and lets the back button undo a date. The eleven being picked
 * decides nothing the server knows about, so it lives in
 * [`TotwBuilder`](../../../../components/totw-builder.tsx) until it is saved.
 *
 * **A bare address is the last seven days and no competition.** The span
 * defaults because a default that is a fact about the world rather than about
 * the reader needs no remembering — `/fixtures`' answer, applied here. The
 * competitions deliberately do not: they open unticked and are chosen, which
 * costs an empty pool on arrival and buys a filter that stays honest as the
 * number of leagues grows. The builder says which silence it is drawing.
 */
export default async function NewTeamOfTheWeek({
  searchParams,
}: PageProps<'/team-of-the-week/new'>) {
  const currentSeason = season()
  const params = await searchParams
  const user = await requireDbUser()

  // The competitions the filter offers come from our own `League` table, never
  // from `LEAGUES` — nothing under `src/app/` may read that, or the app would
  // have two sources for which competitions exist.
  const leagues = await leaguesInSeason(currentSeason)

  const { fromDay, toDay } = parseSpan(params.from, params.to, dayKey(new Date()))
  const leagueIds = parseLeagues(params.league, leagues)
  const chosen = leagues.filter((league) => leagueIds.includes(league.id))

  // **Not asked at all when nothing is ticked**, rather than asked with an empty
  // `in` that could only answer nobody. The competitions open unticked, so this
  // is the state a bare address arrives in and it should cost no query.
  const rows =
    leagueIds.length === 0
      ? []
      : await poolCandidates(currentSeason, user.id, fromDay, toDay, leagueIds)
  const pool = buildPool(rows.map(asCandidate))

  // The two ends of the span as the app writes a span anywhere else — `17–23
  // Aug`, dropping the repeated month. `dayRange().from` is the opening instant
  // of a London day, which is the only thing a day key can be turned into.
  const label = dateRange(dayRange(fromDay).from, dayRange(toDay).from)

  return (
    <>
      <PageHeader
        title="Pick an eleven"
        back={{ href: '/team-of-the-week', label: 'Back to teams of the week' }}
      >
        Choose the days, then tap a name to put that player on the pitch.
      </PageHeader>

      <TotwRangeForm fromDay={fromDay} toDay={toDay} leagues={leagues} chosen={leagueIds} />

      <TotwBuilder
        fromDay={fromDay}
        toDay={toDay}
        label={label}
        leagues={chosen}
        pool={pool}
      />
    </>
  )
}

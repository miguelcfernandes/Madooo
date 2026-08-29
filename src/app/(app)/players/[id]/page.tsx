import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireDbUser } from '@/lib/auth'
import { backLink, teamHref } from '@/lib/back'
import { season } from '@/lib/env'
import { leaguesInSeason, playerEntries, playerHeader, playerTotals } from '@/lib/players'
import { DEFAULT_ENTRIES_VIEW, PLAYER_VIEWS, parseView } from '@/lib/player-views'
import { positionLabel } from '@/lib/squad'
import { countPlayerElevens, playerElevens } from '@/lib/totw'
import { PageHeader } from '@/components/page-header'
import { PlayerEntry } from '@/components/player-entry'
import { PLAYER_TILES, StatTiles } from '@/components/stat-tiles'
import { ShirtTile } from '@/components/shirt-tile'
import { TabStrip } from '@/components/tab-strip'
import { TotwCard } from '@/components/totw-card'
import { VerdictSplit } from '@/components/verdict-split'

/**
 * Render on every request rather than once during `next build`, for the same
 * reason `/fixtures` and `/diary` do: a prerendered profile would freeze
 * whatever the database held when the deployment was built.
 */
export const dynamic = 'force-dynamic'

/**
 * One player's season: who he is, how often he was watched, what he was judged
 * to be, and every entry written about him.
 *
 * Reached from a squad list, from the match page's "Your verdicts" panel and
 * from the diary — which is why the way back travels in the URL rather than
 * being a fixed parent; see [`back.ts`](../../../../lib/back.ts). Both that and
 * the view live in the query string, which is what keeps this a server component
 * with no JavaScript of its own.
 */
export default async function PlayerPage({ params, searchParams }: PageProps<'/players/[id]'>) {
  const { id } = await params
  const { from, view } = await searchParams

  // Our own primary key, not API-Football's. A non-numeric or unknown id is a
  // 404 rather than a crash: the URL is user-editable.
  const playerId = Number(id)
  if (!Number.isInteger(playerId)) notFound()

  const currentSeason = season()

  // The view the URL asked for, before the tabs are known. It has to be parsed
  // first because it decides which of the reads below are worth making, and it
  // is settled again once they land — see `current`.
  const wanted = parseView(view)

  // A profile shows one user's judgements, so the reads below need our own
  // `User.id`. The upsert behind this is memoised per request and the shell
  // layout already calls it, so it costs one indexed lookup.
  const user = await requireDbUser()

  // All of them together rather than the header first: the 404 below is
  // reachable only by typing a URL, and making every real profile wait a second
  // round trip to rule it out would be paying for the rare case on every
  // request. The tallies simply come back empty for a player who does not exist.
  //
  // **The entries are read even when the elevens tab is the one asked for**, and
  // that is deliberate rather than an oversight. Whether that tab is *drawn* is
  // not known until the count lands, so a request for it can still fall back to
  // the diary — and fetching the entries only after finding out would make the
  // page two round trips deep to save one small indexed read on the rarest tab
  // in the app.
  const [header, totals, entries, elevenCount, elevens, allLeagues] = await Promise.all([
    playerHeader(playerId, currentSeason),
    playerTotals(playerId, currentSeason, user.id),
    playerEntries(
      playerId,
      currentSeason,
      user.id,
      // The diary, when the URL asked for a tab that reads no entries — which
      // is exactly the view the fallback below lands on, so this read is the
      // right one whenever it is used at all.
      wanted.kind === 'entries' ? wanted : DEFAULT_ENTRIES_VIEW,
    ),
    countPlayerElevens(playerId, currentSeason, user.id),
    // These two are wanted by one tab and no other, so they are asked for only
    // when it is the tab in question.
    wanted.kind === 'elevens' ? playerElevens(playerId, currentSeason, user.id) : [],
    wanted.kind === 'elevens' ? leaguesInSeason(currentSeason) : [],
  ])
  if (header === null) notFound()

  // **The elevens tab is drawn only when there is something behind it**, which
  // is the one conditional tab in the app: almost nobody is in a team of the
  // week, and a tab that was always there would be an empty room on nearly every
  // profile. A stale `?view=elevens` then lands on the diary, because `parseView`
  // is asked again against the tabs that exist rather than the whole table.
  const views = elevenCount === 0 ? PLAYER_VIEWS.filter((one) => one.kind !== 'elevens') : PLAYER_VIEWS
  const current = parseView(view, views)

  // The club and shirt he was last named under. Absent for a player in the
  // database with no squad row this season — every match of the season exists as
  // a row from the moment it is scheduled, but only hydrated rounds have squads.
  const latest = header.squadEntries[0] ?? null
  const position = latest === null ? null : positionLabel(latest.position)

  return (
    <>
      <PageHeader
        back={backLink(from)}
        mark={<ShirtTile team={latest?.team ?? null} shirtNumber={latest?.shirtNumber ?? null} />}
        title={header.name}
      >
        {/*
          `MID`, not the drawing's "Attacking midfielder". The finer position is
          in no provider response — the four letters `MatchSquad.position` is
          read for are the whole of what the payloads carry — and 6.3 settled
          that inventing one prints a confident falsehood about a real person.
          Anything else in that column, including the null it is often, draws no
          position at all rather than a guess. See architecture.md.

          The club is the link; the position is not, so this is a node rather
          than one joined string. What travels as the origin is this profile with
          its tab, so Back from the club returns to the view he was reading.
        */}
        {latest === null ? (
          'Not named in a squad this season.'
        ) : (
          <>
            <Link
              href={teamHref(
                latest.team.id,
                `/players/${header.id}${current === PLAYER_VIEWS[0] ? '' : `?view=${current.slug}`}`,
              )}
              className="text-muted underline-offset-2 hover:text-text focus-visible:focus-ring"
            >
              {latest.team.name}
            </Link>
            {position === null ? null : ` · ${position}`}
          </>
        )}
      </PageHeader>

      <StatTiles tiles={PLAYER_TILES} totals={totals} />
      <VerdictSplit counts={totals} />

      <TabStrip
        label="View"
        tabs={views.map((candidate) => ({
          // The origin rides along, so switching tabs does not lose the way back.
          href: `/players/${header.id}?view=${candidate.slug}${
            typeof from === 'string' ? `&from=${encodeURIComponent(from)}` : ''
          }`,
          label: candidate.label,
          current: candidate.slug === current.slug,
        }))}
      />

      {current.kind === 'elevens' ? (
        // The same card the list draws, in the same grid, because it is the same
        // object — a smaller preview here would be a second idea of what a team
        // of the week looks like.
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {elevens.map((team) => (
            <TotwCard key={team.id} team={team} leagueCount={allLeagues.length} />
          ))}
        </ul>
      ) : entries.length === 0 ? (
        // Each view carries its own sentence, so "no notes on this player" does
        // not read as "nothing on this player" to someone who has tagged him ten
        // times.
        <p className="text-body text-muted">{current.empty}</p>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {entries.map((entry) => (
            <PlayerEntry key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </>
  )
}

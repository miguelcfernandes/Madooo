import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireDbUser } from '@/lib/auth'
import { playerHref } from '@/lib/back'
import { dateRange, dayRange, entryDate } from '@/lib/dates'
import { season } from '@/lib/env'
import { leaguesInSeason } from '@/lib/players'
import { scoreline } from '@/lib/text'
import { teamOfTheWeek } from '@/lib/totw'
import { formationName, formationOf, linesOf, orderedPicks } from '@/lib/totw-picks'
import { Badge, VERDICT_BADGE } from '@/components/badge'
import { CrestChip } from '@/components/crest-chip'
import { DeleteTotw } from '@/components/delete-totw'
import { LeagueMarks } from '@/components/league-marks'
import { PageHeader } from '@/components/page-header'
import { Pitch, pitchPlayers } from '@/components/pitch'

export const dynamic = 'force-dynamic'

/**
 * One saved eleven: the graphic, and the eleven read back as a list.
 *
 * **The shape is counted off the picks rather than stored**, which is why
 * nothing in the schema names a formation — `linesOf` groups the eleven by the
 * position on each squad row and `formationOf` reads the three numbers off that.
 * A stored `"4-3-3"` would be a second statement of the same fact, free to
 * disagree with the players under it.
 *
 * **The list under the pitch is not a repetition of it.** The graphic carries a
 * club colour, a shirt number and a name, which is all a picture has room for;
 * the list carries the match each player earned his place in, and links to his
 * profile. What the reader would screenshot is above; what they would read is
 * below.
 */
export default async function OneTeamOfTheWeek({ params }: PageProps<'/team-of-the-week/[id]'>) {
  const { id } = await params
  const wanted = Number(id)
  // A path segment is as untrusted as a query parameter. `Number('12abc')` is
  // NaN and `Number('')` is 0, so the integer test covers both without a regexp.
  if (!Number.isInteger(wanted)) notFound()

  const user = await requireDbUser()
  // `userId` is inside the query, not checked after it, so somebody else's team
  // is indistinguishable from one that does not exist.
  //
  // The league list goes out alongside it rather than after: it is only wanted
  // to know whether this team's competitions are *all* of them, which is a
  // count, and waiting for it in series would be a second round trip for a
  // number.
  const [team, allLeagues] = await Promise.all([
    teamOfTheWeek(wanted, user.id),
    leaguesInSeason(season()),
  ])
  if (team === null) notFound()

  const lines = linesOf(team.picks, (pick) => pick.matchSquad.position)
  const formation = formationOf(lines)
  const label = dateRange(dayRange(team.fromDay).from, dayRange(team.toDay).from)

  return (
    <>
      <PageHeader
        title={team.name}
        back={{ href: '/team-of-the-week', label: 'Back to teams of the week' }}
      >
        {label} · {formationName(formation)} · picked {entryDate(team.createdAt)}
      </PageHeader>

      {/* No `onRemove`, so every place is a span and this page ships no
          JavaScript for the graphic itself — the delete control below is the
          only island on the screen.

          **The header is the name and the footer is the span**, which is what
          makes the graphic self-describing once it has left the app: a
          screenshot carries what the reader called it, the days it covers and
          the competitions it was drawn from, and needs no caption. */}
      <Pitch
        formation={formation}
        players={pitchPlayers(lines)}
        label={team.name}
        footer={
          <>
            <span className="text-caption text-muted">{label}</span>
            <LeagueMarks
              leagues={team.leagues.map((one) => one.league)}
              total={allLeagues.length}
            />
          </>
        }
      />

      <section className="mt-8 overflow-hidden border border-border bg-surface">
        <header className="border-b-2 border-brand bg-surface-alt px-4 py-2">
          <h2 className="text-caps">The eleven</h2>
        </header>
        <ul className="divide-y divide-border">
          {orderedPicks(lines).map((pick) => {
            const badge = VERDICT_BADGE[pick.tag]
            return (
              <li
                key={pick.id}
                className="grid min-h-(--row-h-lg) grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2"
              >
                <CrestChip team={pick.matchSquad.team} />
                <span className="min-w-0">
                  {/* Ink rather than the link colour, as every player name in
                      the app is; the base stylesheet's hover underline is the
                      whole of the affordance. */}
                  <Link
                    href={playerHref(pick.matchSquad.player.id, `/team-of-the-week/${team.id}`)}
                    className="block truncate text-body text-text focus-visible:focus-ring"
                  >
                    {pick.matchSquad.player.name}
                  </Link>
                  <span className="block truncate text-caption text-muted">
                    {scoreline(pick.matchSquad.match)}
                  </span>
                </span>
                <Badge icon={badge.icon} label={pick.tag} classes={badge.classes} />
              </li>
            )
          })}
        </ul>
      </section>

      <div className="mt-8">
        <DeleteTotw id={team.id} label={team.name} />
      </div>
    </>
  )
}

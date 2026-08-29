import Link from 'next/link'
import { dateRange, dayRange } from '@/lib/dates'
import { formationOf, linesOf } from '@/lib/totw-picks'
import { LeagueMarks } from './league-marks'
import { Pitch, pitchPlayers } from './pitch'
import type { SavedLeague, SavedPick } from '@/lib/totw'

/**
 * One saved eleven in the list, drawn as the eleven rather than described as
 * one.
 *
 * **This replaced a row, and the row was the wrong object.** It carried the
 * span, the date it was picked, eleven crest chips and the formation — four
 * facts *about* a team of the week, none of which is the thing itself. A team
 * of the week is a picture, and a list of them that made you open each one to
 * see which was which was a list that had not been drawn yet.
 *
 * So the card is `Pitch`, unchanged, at the size a column gives it. **The same
 * component the builder draws and the saved team draws**, which is what stops
 * a summary and its subject from ever disagreeing — there is no smaller
 * "preview" pitch to keep in step.
 *
 * **The link is in the heading, not around the card**, and the whole card is
 * clickable because that link's `::after` is stretched across it. Wrapping the
 * card would have made the link's accessible name the name, the formation and
 * eleven player names read out in one breath; this way it is the name, and the
 * rest stays content. The `<li>` is `relative`, which is what the stretched
 * pseudo-element resolves against.
 *
 * **Three facts around the picture, and each is in a different place for a
 * reason.** The name heads it, because that is what the reader called it and
 * what they will look for. The formation sits opposite, where every block header
 * in the app puts its count. The span and the competitions go in a footer under
 * the field: they say what the eleven was drawn *from* rather than what it is,
 * and putting them in the header would have made a two-line heading out of a
 * strip the whole app draws in one.
 */
export function TotwCard({
  team,
  leagueCount,
}: {
  team: {
    id: number
    name: string
    fromDay: string
    toDay: string
    picks: SavedPick[]
    leagues: { league: SavedLeague }[]
  }
  /** How many competitions the app holds this season — what "All" is measured against. */
  leagueCount: number
}) {
  const lines = linesOf(team.picks, (pick) => pick.matchSquad.position)
  const label = dateRange(dayRange(team.fromDay).from, dayRange(team.toDay).from)

  return (
    <li className="relative">
      <Pitch
        formation={formationOf(lines)}
        players={pitchPlayers(lines)}
        label={
          <Link
            href={`/team-of-the-week/${team.id}`}
            // Ink rather than the link colour, as every name in this app is —
            // the heading is already `--text-caps` and colouring it would make
            // one block header speak differently from the ten others. `no-underline`
            // in both states for the same reason navigation opts out of it.
            //
            // **`after:z-10` is load-bearing and was missing at first.** The
            // stretched pseudo-element and the pitch below it are both
            // positioned with no z-index, so they paint in DOM order and the
            // field — a later sibling — covered the whole thing. The card looked
            // like a link, hovered like nothing, and swallowed every click.
            className="text-text no-underline after:absolute after:inset-0 after:z-10 hover:text-text hover:no-underline focus-visible:focus-ring"
          >
            {team.name}
          </Link>
        }
        footer={
          <>
            <span className="text-caption text-muted">{label}</span>
            <LeagueMarks leagues={team.leagues.map((one) => one.league)} total={leagueCount} />
          </>
        }
        // Foundations' hover for a bordered thing: darken the border. `has-[…]`
        // rather than a `group`, because what is being hovered is the stretched
        // link inside rather than the card, and the card has no hover of its own
        // to attach to.
        className="h-full has-[a:hover]:border-border-strong"
      />
    </li>
  )
}

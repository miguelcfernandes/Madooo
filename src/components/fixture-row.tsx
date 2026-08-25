import Link from 'next/link'
import { Badge, CALLED_OFF_BADGE, LINEUPS_BADGE, LIVE_BADGE } from './badge'
import { CrestChip } from './crest-chip'
import { KickoffTime } from './kickoff-time'
import { WatchedMark } from './watched-mark'
import { calledOffLabel, isInProgress } from '@/lib/match-status'
import { roundDisplay } from '@/lib/rounds'
import type { Fixture } from '@/lib/fixtures'

/**
 * One fixture, as a row in its competition's block.
 *
 * **It replaced a three-band card, and the reason is what `/fixtures` is.** The
 * card gave every match a header strip, a body and a footer strip, each bordered
 * — eighty-four bands on a Saturday of twenty-eight fixtures, and a competition
 * was a run of boxes that happened to be adjacent rather than an object. Three
 * of those bands were also carrying facts that are not per-fixture at all: the
 * round, repeated under every club in the same league; "Team news is not out
 * yet", repeated identically down the page; and a pair of zeroes that an
 * unplayed match can hold no other value for.
 *
 * Now the competition is the bordered object and these are rows inside it, which
 * is also what finally gives its block header something to cap. What was
 * per-league moved up to that header; what was per-fixture stayed here.
 *
 * **The kickoff sits in the left margin and is never replaced.** On the card it
 * occupied the centre slot and gave way to the score, so a finished day lost its
 * times entirely. A row has a margin the card did not, which is what makes
 * keeping both free.
 *
 * A match with no squad rows is **not openable**, and that case is permanent
 * rather than transitional: fixtures are published long before team news, so a
 * season in progress always holds matches with nobody to judge.
 */

/**
 * The centre slot, and the whole of what a row says about a fixture's state.
 *
 * The order is a sequence of questions and every one of them is load-bearing.
 * Whether the match is happening at all comes first, because a postponed fixture
 * has no goals recorded and would otherwise fall through and draw as a match
 * about to be played. Whether it is happening *now* comes before the goals
 * check, because a match kicks off with 0–0 recorded against it and asking about
 * goals first draws a live match as a finished goalless draw. This screen never
 * polls, so a live score would be stale the moment it was painted; the badge is
 * what the page actually knows.
 *
 * Then the two that are new: a fixture with no score and a squad is one you can
 * judge, and a fixture with no score and no squad is one to wait for.
 */
function Outcome({ match, openable }: { match: Fixture; openable: boolean }) {
  const calledOff = calledOffLabel(match.status)
  if (calledOff !== null) return <Badge label={calledOff} classes={CALLED_OFF_BADGE} />
  if (isInProgress(match.status)) return <Badge label="Live" classes={LIVE_BADGE} />

  if (match.homeGoals === null || match.awayGoals === null) {
    if (openable) return <Badge label="Lineups out" classes={LINEUPS_BADGE} />

    // An en dash standing in for the score that does not exist yet, holding the
    // column's width so unplayed and played rows line up down the page. It is
    // also the only thing that says team news has not landed — said by saying
    // nothing, which is what that fact is worth on a page full of it.
    return <span className="text-tally text-faint">–</span>
  }

  // `--text-tally` rather than the card's `--text-stat`: foundations gives the
  // 20px monospaced role to a number in a list row and the 32px one to a tile.
  // A score is the same fact at both sizes; the row is what decides which.
  // An en dash, not a hyphen — it is a span between two numbers.
  return (
    <span className="text-tally">
      {match.homeGoals}–{match.awayGoals}
    </span>
  )
}

type Props = {
  match: Fixture
  /**
   * The round, when this row's competition does not share one across the day. A
   * league whose fixtures are all in the same round says so once, in its header.
   *
   * **This is the one fact still hoisted, and unlike team news it is safe to
   * hoist**: a round is a property of the competition's calendar rather than of
   * the fixture's afternoon, so a league that shares one shares it all day. The
   * check is still made per day rather than assumed — a match postponed out of
   * Matchday 1 and played a month later is exactly the case that breaks it, and
   * it falls back to saying it per row.
   */
  showRound: boolean
}

function Row({ match, showRound }: Props) {
  // One judged squad row is the whole test, and the query takes exactly one.
  // A `Judgement` cannot exist empty — `judgement_has_content` is a CHECK
  // constraint in the initial migration requiring a tag or a note — so "this
  // user has a judgement on this match" *is* "at least one verdict or one note",
  // with no second condition to keep in step. It is also the predicate behind
  // the Watched tile at the top of the page, which is what makes that number
  // the count of these marks.
  const watched = match.squadEntries.length > 0
  const openable = match._count.squadEntries > 0

  return (
    /*
      `group-hover` and `group-active`, with the group on the <Link> that may or
      may not be there. When the row is not openable there is no group ancestor,
      so those variants simply never match — which is the wanted behaviour and
      needs no second set of classes. Press is one step darker again plus a 1px
      drop, exactly as foundations states it.
    */
    <div className="t-hover relative flex min-h-(--row-h-lg) items-center gap-4 px-4 py-2 group-hover:bg-surface-alt group-active:translate-y-px group-active:bg-surface-sunken">
      {/* `relative` above is this and only this: the mark is out of flow, so it
          needs a row to be positioned against and costs the row nothing. */}
      {watched ? <WatchedMark /> : null}

      <KickoffTime kickoff={match.kickoff} className="w-12 shrink-0 text-data text-muted" />

      {/* Three columns with the middle one sized to its content, so the score
          sits on a centre line however long the club names are, and the two
          sides get an equal share of what is left rather than fighting over it.
          The one piece of the card's geometry worth carrying over. */}
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CrestChip team={match.homeTeam} />
          {/* `--text-label`, and no `md:text-heading` step. foundations gives
              the larger size to team names on a *match card* and the smaller to
              a fixture line; a row is a fixture line at every width. */}
          <span className="truncate text-label">{match.homeTeam.name}</span>
        </div>

        <Outcome match={match} openable={openable} />

        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-right text-label">{match.awayTeam.name}</span>
          <CrestChip team={match.awayTeam} />
        </div>
      </div>

      {/*
        The right margin, and it now holds one thing at most.

        **Zero is not drawn here, and it is the departure worth arguing.** The
        card stated `0 verdicts · 0 notes` on every fixture, on the principle
        that this app shows zero rather than hiding it. That principle earns its
        keep where zero is a *result* — a player with no MVPs — but on a fixture
        that has not kicked off, zero is not a finding, it is the only value the
        field can hold. Fifty-six of them on one Saturday say nothing.

        The counts are gone from here entirely now, not merely hidden at zero.
        What is left is the round, which is a fact about the fixture; what the
        reader has written is a fact about the reader, and it is a rule down the
        leading edge where it takes no width from the row at all.
      */}
      {showRound ? (
        <span className="shrink-0 text-caps text-faint">{roundDisplay(match.round)}</span>
      ) : null}
    </div>
  )
}

export function FixtureRow(props: Props) {
  if (props.match._count.squadEntries === 0) return <Row {...props} />

  return (
    <Link
      href={`/matches/${props.match.id}`}
      // `no-underline` and an explicit colour because the base stylesheet gives
      // every <a> the link colour and a hover underline — right for prose, wrong
      // for a row. The utilities layer outranks it despite the lower
      // specificity, which is what makes one class enough.
      className="group block text-text no-underline focus-visible:focus-ring"
    >
      <Row {...props} />
    </Link>
  )
}

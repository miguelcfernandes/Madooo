import Link from 'next/link'
import { entryDate } from '@/lib/dates'
import { scoreline } from '@/lib/text'
import { summariseMatch } from '@/lib/verdicts'
import { Icon } from './icon'
import type { IconName } from './icon-names'
import type { DiaryMatch } from '@/lib/diary'

/**
 * One tally on a match row: an icon, a number, and a word for a screen reader.
 *
 * Zero is drawn rather than hidden, the same answer `countVerdicts` gives: a
 * match with no flops says so, and a row whose columns appear and disappear is
 * harder to scan down than one whose numbers change.
 */
function Tally({
  icon,
  count,
  label,
  ink,
}: {
  icon: IconName
  count: number
  label: string
  /** Written out in full, never assembled — Tailwind finds class names by scanning source as text. */
  ink: string
}) {
  return (
    <span className={`flex items-center gap-1 ${ink}`}>
      <Icon name={icon} size="xs" />
      <span className="text-data">{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/**
 * One match as a row in the diary's Matches tab: when it was played, who played,
 * who you made MVP, and how much else you said.
 *
 * [`team-row.tsx`](./team-row.tsx)'s behaviour — the whole row is the link
 * because the chevron promises it is, ink rather than the link colour and
 * `no-underline` in both states — over
 * [`judgement-entry.tsx`](./judgement-entry.tsx)'s **geometry**, which is the
 * part that matters here. `PlayerRow` and `TeamRow` carry `px-4` because they
 * sit inside a bordered card and that is the card's inner padding; the diary's
 * list is a bare `divide-y`, so the same padding would inset these rows from the
 * month heading and from the entries they share a screen with. The hover fill
 * spans the row instead, flush with the rule above it.
 *
 * **The date is the kickoff, not the day you wrote.** Every other list on this
 * screen is dated by the act of writing; this one is the exception, and
 * [`diary.ts`](../lib/diary.ts) holds the argument for why. It takes
 * `JudgementEntry`'s column exactly — same `auto` width, same `gap-x-6`, same
 * uppercase mono — so switching tabs does not move it.
 *
 * **No `SplitBar`.** The three tallies do not partition the entries — one
 * judgement can be a flop *and* carry a note — so there is no whole for them to
 * be parts of. `verdict-split.ts` makes the same argument for a club, and
 * `summariseMatch` restates it where the numbers are produced.
 */
export function DiaryMatchRow({ match }: { match: DiaryMatch }) {
  const summary = summariseMatch(match.squadEntries)

  return (
    <li>
      <Link
        href={`/matches/${match.id}`}
        className="t-hover flex flex-col gap-2 py-4 text-text no-underline hover:bg-surface-alt hover:text-text hover:no-underline focus-visible:focus-ring md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-x-6 md:gap-y-1"
      >
        {/* A date you read down a column, so it is monospaced — the rule that
            anything you line up or add is mono. */}
        <span className="text-data uppercase text-muted">{entryDate(match.kickoff)}</span>

        <span className="min-w-0">
          {/* Not truncated: a diary should show the whole of a fixture, so a
              long pair of club names wraps instead. */}
          <span className="block text-body">{scoreline(match)}</span>
          <span className="block truncate text-caption text-muted">{match.league.name}</span>

          {/*
            The MVP, named rather than counted, because there is at most one
            across both squads — the tab it replaced was a filter for exactly
            this. The whole line disappears when there is none: a blank star
            beside an empty space would read as a missing name rather than as an
            absent award.
          */}
          {summary.mvp === null ? null : (
            <span className="mt-1 flex min-w-0 items-center gap-1 text-mvp">
              <Icon name="star" size="xs" filled />
              <span className="truncate text-caption">{summary.mvp.player.name}</span>
              <span className="sr-only">MVP</span>
            </span>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-3">
          <Tally
            icon="trending_up"
            count={summary.standouts}
            label="standouts"
            ink="text-standout"
          />
          <Tally icon="trending_down" count={summary.flops} label="flops" ink="text-flop" />
          {/* A note is not a verdict, so it takes the informational blue rather
              than one of the three verdict colours. */}
          <Tally icon="edit_note" count={summary.notes} label="notes" ink="text-info" />
          <Icon name="chevron_right" size="md" className="text-faint" />
        </span>
      </Link>
    </li>
  )
}

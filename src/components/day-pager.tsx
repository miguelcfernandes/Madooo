import Link from 'next/link'
import { Icon } from './icon'
import { dayLabel, dayRange } from '@/lib/dates'
import { plural } from '@/lib/text'

/**
 * Which day of football the screen is drawn for.
 *
 * **It replaced a matchday pager, and the difference is not cosmetic.** A round
 * is not atomic in time — it spans a weekend, and a fixture the provider moves
 * keeps its label while its date walks off a month — so a reader looking for a
 * match they watched had to know which round it had belonged to. A day is what
 * they actually remember. It is also the one unit every competition shares: a
 * round means something different in each, and nothing at all in a cup.
 *
 * Two `<Link>`s and a third, which is what keeps `/fixtures` a server component
 * with no JavaScript at all. The day lives in the URL — `/fixtures?date=
 * 2026-08-23` — so it can be linked to, bookmarked and reached with the back
 * button, exactly as the matchday could.
 */

type Props = {
  /** The day on screen, as `dayKey` writes one: `2026-08-23`. */
  day: string
  /** The neighbouring days that have football in them, from `neighbouringDays`. */
  previous: string | null
  next: string | null
  /** How many fixtures are on screen, drawn under the date. */
  count: number
  /** Today in London, so the button can be hidden when it would do nothing. */
  today: string
}

/**
 * An arrow at the end of the season: present, so nothing shifts, but inert.
 * `opacity-40` with `cursor-not-allowed` is foundations' disabled treatment, and
 * `aria-hidden` because there is nothing here to announce.
 */
function Edge({ direction }: { direction: 'left' | 'right' }) {
  return (
    <span
      aria-hidden
      className="inline-flex size-8 cursor-not-allowed items-center justify-center opacity-40"
    >
      <Icon name={direction === 'left' ? 'chevron_left' : 'chevron_right'} size="md" />
    </span>
  )
}

function Step({ day, direction }: { day: string; direction: 'left' | 'right' }) {
  return (
    <Link
      href={`/fixtures?date=${day}`}
      // The label names the destination rather than the action, which is what
      // the matchday pager's did: "Previous day" alone tells a screen reader
      // nothing about where it lands, and the arrows skip empty days, so the
      // date is not guessable from the one on screen.
      aria-label={`${direction === 'left' ? 'Previous' : 'Next'} day with fixtures, ${dayName(day)}`}
      // size-8 is --control-h, foundations' default icon button. `no-underline`
      // and an explicit colour because the base stylesheet styles every <a> as a
      // prose link, which is right for body copy and wrong for chrome.
      className="t-hover inline-flex size-8 items-center justify-center rounded-md text-muted no-underline hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
    >
      <Icon name={direction === 'left' ? 'chevron_left' : 'chevron_right'} size="md" />
    </Link>
  )
}

/**
 * A day key rendered for a reader.
 *
 * The round trip through `dayRange` is the point: a key is a London calendar
 * day, and the only way to hand one to a formatter is as the instant it starts.
 * Every formatter in [`dates.ts`](../lib/dates.ts) takes a `Date`, and that
 * file owns the zone both directions are measured in, so the pair cannot
 * disagree.
 */
function dayName(day: string): string {
  return dayLabel(dayRange(day).from)
}

export function DayPager({ day, previous, next, count, today }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {previous === null ? <Edge direction="left" /> : <Step day={previous} direction="left" />}

        {/* `min-w-48` so the arrows hold still as the label's width changes —
            the matchday pager's `min-w-36` widened for a four-digit year. */}
        <div className="min-w-48 text-center">
          {/* Monospaced because a date is counted, not spoken. */}
          <div className="text-data uppercase">{dayName(day)}</div>
          <div className="text-caption text-muted">
            <span className="font-mono">{count}</span> {plural(count, 'fixture')}
          </div>
        </div>

        {next === null ? <Edge direction="right" /> : <Step day={next} direction="right" />}
      </div>

      {/*
        Absent rather than disabled on the day it would do nothing. A disabled
        control says "this is available to you elsewhere", and there is no
        elsewhere here — the reader is already on today. It is the one thing in
        this row whose width comes and goes, which is why it sits outside the
        fixed-width group above rather than inside it.
      */}
      {day === today ? null : (
        <Link
          href="/fixtures"
          // A bare `/fixtures` rather than `?date=<today>`: the page defaults to
          // today, so the shorter address is the same destination and stays
          // right when the reader opens it again tomorrow.
          className="t-hover inline-flex h-8 items-center rounded-md px-3 text-label text-muted no-underline hover:bg-surface-alt hover:text-text hover:no-underline focus-visible:focus-ring"
        >
          Today
        </Link>
      )}
    </div>
  )
}

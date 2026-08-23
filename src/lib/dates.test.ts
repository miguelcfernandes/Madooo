/**
 * Date formatting, against the kickoff timestamps the provider actually sends.
 *
 * Same rule as the mapper's tests: the inputs come out of
 * `scratch/fixtures_39_2024.json` at runtime. That matters more here than it looks —
 * the payload's timestamps carry an explicit offset and a real season crosses
 * both a month boundary and a daylight-saving change, neither of which a date
 * typed from memory would exercise.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  dateRange,
  dayKey,
  dayLabel,
  dayRange,
  entryDate,
  groupByMonth,
  isDayKey,
  kickoffDate,
  kickoffTime,
  monthLabel,
  parseDay,
} from './dates'
import { roundNumber } from './rounds'
import type { ApiFootballEnvelope, RawFixture } from './api-football/types'

const path = join(process.cwd(), 'scratch', 'fixtures_39_2024.json')
let payload: ApiFootballEnvelope<RawFixture>
try {
  payload = JSON.parse(readFileSync(path, 'utf8')) as ApiFootballEnvelope<RawFixture>
} catch {
  throw new Error(
    `Missing ${path}. These tests run against real captured payloads — ` +
      're-create them with `python3 scripts/verify_api.py`.',
  )
}

interface Played {
  round: string
  kickoff: Date
}

const played: Played[] = payload.response.map((entry) => ({
  round: entry.league.round,
  kickoff: new Date(entry.fixture.date),
}))

/** Every round's span, which `dateRange` is still asked to render. */
const spans = new Map<string, { first: Date; last: Date }>()
for (const { round, kickoff } of played) {
  const span = spans.get(round)
  if (span === undefined) {
    spans.set(round, { first: kickoff, last: kickoff })
    continue
  }
  if (kickoff < span.first) span.first = kickoff
  if (kickoff > span.last) span.last = kickoff
}

describe('kickoffDate', () => {
  it('is a weekday, a day and a three-letter month for every fixture in the season', () => {
    // Three letters exactly, every time. `en-GB` alone would give "Sept" for one
    // month in twelve, which is the reason the month is cut by hand.
    for (const { kickoff } of played) {
      expect(kickoffDate(kickoff), kickoff.toISOString()).toMatch(
        /^[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2}$/,
      )
    }
  })

  it('covers all twelve months without any of them growing a fourth letter', () => {
    const months = new Set(played.map(({ kickoff }) => kickoffDate(kickoff).split(' ')[2]))
    for (const month of months) expect(month.length, month).toBe(3)
  })
})

describe('kickoffTime', () => {
  it('is 24-hour, zero-padded, for every fixture in the season', () => {
    for (const { kickoff } of played) {
      expect(kickoffTime(kickoff), kickoff.toISOString()).toMatch(/^\d{2}:\d{2}$/)
    }
  })

  it('reads the London clock, not the runner’s', () => {
    // A midsummer fixture: London is one hour ahead of UTC, so a payload
    // timestamp in UTC must not render as itself.
    const summer = played.find((entry) => entry.kickoff.getUTCMonth() === 7)
    if (summer === undefined) return
    const utc = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'UTC',
    }).format(summer.kickoff)
    expect(kickoffTime(summer.kickoff)).not.toBe(utc)
  })

  /*
    The zone argument. `KickoffTime` is what passes one, and it can only pass the
    browser's — which is this machine's, and this machine is on London's offset.
    So the arithmetic is proved here, where a zone can be named, or it is not
    proved anywhere.

    Constructed timestamps rather than payload ones for the boundary cases, for
    the same reason `monthLabel` gives below: the claim under test is about the
    formatter, not about the provider's shape.
  */
  it('reads a zone it is handed, not London', () => {
    // 2025-08-16, 15:00 London — a Saturday three o'clock, which is the most
    // ordinary kickoff there is.
    const threeOClock = new Date('2025-08-16T14:00:00Z')
    expect(kickoffTime(threeOClock)).toBe('15:00')
    expect(kickoffTime(threeOClock, 'Europe/London')).toBe('15:00')
    expect(kickoffTime(threeOClock, 'America/New_York')).toBe('10:00')
    expect(kickoffTime(threeOClock, 'Asia/Tokyo')).toBe('23:00')
  })

  it('stays 24-hour in a zone whose locale is not', () => {
    // The locale is deliberately not part of what a zone changes: `en-GB` and
    // `h23` hold, so a reader in New York gets 20:00 rather than 8:00 pm — four
    // characters, in a slot sized for four characters.
    const evening = new Date('2025-08-17T23:00:00Z')
    expect(kickoffTime(evening, 'America/New_York')).toMatch(/^\d{2}:\d{2}$/)
    expect(kickoffTime(evening, 'America/New_York')).toBe('19:00')
  })

  it('crosses midnight into the next day where the zone does', () => {
    // 20:00 London on a Sunday is 04:00 Monday in Tokyo. The time is all this
    // renders, so the day is the caller's problem — asserting it here records
    // that the two can disagree, which is why the date chip stays on London.
    const lateSunday = new Date('2025-08-17T19:00:00Z')
    expect(kickoffTime(lateSunday)).toBe('20:00')
    expect(kickoffTime(lateSunday, 'Asia/Tokyo')).toBe('04:00')
  })

  it('falls back to London on a zone Intl does not know', () => {
    // The zone comes from a browser, and `Intl` throws `RangeError` on one it
    // cannot resolve. A page of fixtures must not go down over a time.
    const threeOClock = new Date('2025-08-16T14:00:00Z')
    expect(kickoffTime(threeOClock, 'Mars/Olympus_Mons')).toBe('15:00')
    expect(kickoffTime(threeOClock, '')).toBe('15:00')
  })

  it('formats every fixture in the season in a far-off zone', () => {
    // The whole payload through the zoned path, not just the constructed cases:
    // the cache is keyed by zone and hands the same formatter back every time,
    // so this is also what would catch it returning a stale one.
    for (const { kickoff } of played) {
      expect(kickoffTime(kickoff, 'Pacific/Auckland'), kickoff.toISOString()).toMatch(
        /^\d{2}:\d{2}$/,
      )
    }
  })
})

describe('dateRange', () => {
  it('gives every round of the season a range that names a month exactly once or twice', () => {
    for (const [round, span] of spans) {
      expect(dateRange(span.first, span.last), round).toMatch(
        /^\d{1,2}(–\d{1,2})? [A-Z][a-z]{2}$|^\d{1,2} [A-Z][a-z]{2} – \d{1,2} [A-Z][a-z]{2}$/,
      )
    }
  })

  it('drops the repeated month for a round played over two days', () => {
    // Found in the payload rather than assumed: most rounds span a weekend.
    const weekend = [...spans.entries()].find(
      ([, span]) =>
        span.first.getUTCDate() !== span.last.getUTCDate() &&
        span.first.getUTCMonth() === span.last.getUTCMonth(),
    )
    expect(weekend, 'no round in the season spans two days of one month').toBeDefined()
    expect(dateRange(weekend![1].first, weekend![1].last)).toMatch(/^\d{1,2}–\d{1,2} [A-Z][a-z]{2}$/)
  })

  it('keeps both months when a round straddles them', () => {
    // Round 1's opening day paired with round 38's last: guaranteed to cross a
    // month, and both ends are real fixtures.
    const first = spans.get(played.find((e) => roundNumber(e.round) === 1)!.round)!.first
    const last = spans.get(played.find((e) => roundNumber(e.round) === 38)!.round)!.last
    expect(dateRange(first, last)).toMatch(/^\d{1,2} [A-Z][a-z]{2} – \d{1,2} [A-Z][a-z]{2}$/)
  })

  it('collapses to one date when a round is played on a single day', () => {
    const single = [...spans.values()].find(
      (span) => span.first.getUTCDate() === span.last.getUTCDate(),
    )
    if (single === undefined) return
    expect(dateRange(single.first, single.last)).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/)
  })
})

describe('entryDate', () => {
  it('is a day, a three-letter month and a two-digit year, all season', () => {
    for (const { kickoff } of played) {
      expect(entryDate(kickoff), kickoff.toISOString()).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{2}$/)
    }
  })

  it('crosses the new year the season crosses', () => {
    // A Premier League season runs August to May, so both years are real and the
    // two-digit year is doing work rather than repeating itself.
    const years = new Set(played.map(({ kickoff }) => entryDate(kickoff).split(' ')[2]))
    expect(years.size).toBe(2)
  })
})

describe('monthLabel', () => {
  it('spells the month out in full, beside a four-digit year', () => {
    for (const { kickoff } of played) {
      expect(monthLabel(kickoff), kickoff.toISOString()).toMatch(/^[A-Z][a-z]{2,8} \d{4}$/)
    }
  })

  it('reads the London calendar, not UTC', () => {
    /*
      Constructed rather than found, and deliberately: the payload cannot supply
      this case. Premier League kickoffs top out at 20:00 UK, which is 19:00 UTC
      at the latest, so no fixture in the season falls on a different date in the
      two zones. The claim under test is about the formatter's zone, not about
      the provider's shape, so a real fixture would prove nothing here.

      30 September, 23:30 UTC is 1 October, 00:30 in London — British Summer Time
      is still in force that week.
    */
    const lateSeptember = new Date('2025-09-30T23:30:00Z')
    expect(monthLabel(lateSeptember)).toBe('October 2025')
  })
})

describe('groupByMonth', () => {
  /** The season's fixtures newest first — the order the diary's query returns. */
  const newestFirst = [...played].sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime())

  it('keeps every item exactly once', () => {
    const grouped = groupByMonth(newestFirst, (entry) => entry.kickoff)
    expect(grouped.flatMap((month) => month.items)).toEqual(newestFirst)
  })

  it('puts a month in one group, not several', () => {
    const labels = groupByMonth(newestFirst, (entry) => entry.kickoff).map((month) => month.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('labels each group with the month all its items are in', () => {
    for (const month of groupByMonth(newestFirst, (entry) => entry.kickoff)) {
      for (const item of month.items) expect(monthLabel(item.kickoff)).toBe(month.label)
    }
  })

  it('is empty for an empty list', () => {
    expect(groupByMonth([], (entry: { kickoff: Date }) => entry.kickoff)).toEqual([])
  })

  it('cuts a new group whenever the month changes, sorting nothing', () => {
    /*
      The documented precondition, asserted rather than assumed: handed an
      unsorted list it produces two groups with the same label, in the order it
      was given. That is the behaviour that makes it safe to put a Postgres
      `ORDER BY` in charge of the order — and it is why a caller must never hand
      it something it has not sorted.
    */
    const august = played.find((entry) => monthLabel(entry.kickoff).startsWith('August'))!
    const may = played.find((entry) => monthLabel(entry.kickoff).startsWith('May'))!
    const grouped = groupByMonth([august, may, august], (entry) => entry.kickoff)

    expect(grouped.map((month) => month.label)).toEqual([
      monthLabel(august.kickoff),
      monthLabel(may.kickoff),
      monthLabel(august.kickoff),
    ])
  })
})

describe('dayKey', () => {
  it('is an ISO-ordered date for every fixture in the season', () => {
    for (const { kickoff } of played) {
      expect(dayKey(kickoff), kickoff.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('reads the London calendar, not UTC', () => {
    /*
      Constructed rather than found, for `monthLabel`'s reason: no Premier League
      kickoff is late enough to fall on a different date in the two zones, so a
      real fixture could not prove this. 30 September, 23:30 UTC is 1 October,
      00:30 in London — British Summer Time is still in force that week.
    */
    expect(dayKey(new Date('2025-09-30T23:30:00Z'))).toBe('2025-10-01')
  })
})

describe('dayRange', () => {
  it('contains the kickoff of every fixture in the season, in its own day', () => {
    /*
      The property the whole page rests on, over a real season rather than over a
      handful of chosen instants: a fixture is returned by the query for the day
      it is played on, and by no other. Any mistake in the offset arithmetic puts
      a late kickoff outside its own range and shows up here.
    */
    for (const { kickoff } of played) {
      const { from, to } = dayRange(dayKey(kickoff))
      expect(kickoff.getTime(), kickoff.toISOString()).toBeGreaterThanOrEqual(from.getTime())
      expect(kickoff.getTime(), kickoff.toISOString()).toBeLessThan(to.getTime())
    }
  })

  it('is half-open, so midnight belongs to the day it starts', () => {
    // The reason the query is `gte`/`lt` where the sync's three ranges are
    // `gte`/`lte`: a closed range would put this instant in two days at once.
    const { to } = dayRange('2026-08-22')
    const { from } = dayRange('2026-08-23')
    expect(to.getTime()).toBe(from.getTime())
    expect(dayKey(to)).toBe('2026-08-23')
  })

  it('makes the spring transition day 23 hours long', () => {
    // The clocks go forward at 01:00 on 29 March 2026. A day is not 24 hours,
    // which is why nothing in `dayRange` adds a fixed day's worth of
    // milliseconds — and why `hydration.ts`' `DAY_MS` must not be borrowed here.
    const { from, to } = dayRange('2026-03-29')
    expect((to.getTime() - from.getTime()) / 3_600_000).toBe(23)
  })

  it('makes the autumn transition day 25 hours long', () => {
    // The clocks go back at 02:00 on 25 October 2026.
    const { from, to } = dayRange('2026-10-25')
    expect((to.getTime() - from.getTime()) / 3_600_000).toBe(25)
  })

  it('starts a summer day at 23:00 UTC the evening before', () => {
    // London is an hour ahead in August, so its midnight is not UTC's. Asserted
    // outright because it is the case a UTC-only implementation gets wrong while
    // looking correct all winter.
    expect(dayRange('2026-08-23').from.toISOString()).toBe('2026-08-22T23:00:00.000Z')
    expect(dayRange('2026-01-17').from.toISOString()).toBe('2026-01-17T00:00:00.000Z')
  })

  it('rolls over the end of a month and the end of a year', () => {
    expect(dayKey(dayRange('2026-01-31').to)).toBe('2026-02-01')
    expect(dayKey(dayRange('2026-12-31').to)).toBe('2027-01-01')
    // A leap year, which 2028 is and 2026 is not.
    expect(dayKey(dayRange('2028-02-28').to)).toBe('2028-02-29')
  })
})

describe('isDayKey', () => {
  it('accepts the key of every fixture in the season', () => {
    for (const { kickoff } of played) {
      expect(isDayKey(dayKey(kickoff)), kickoff.toISOString()).toBe(true)
    }
  })

  it.each([
    ['2026-13-45', 'a month and a day that do not exist'],
    ['2026-02-30', 'a day that exists in other months'],
    ['2026-1-1', 'unpadded parts'],
    ['26-08-23', 'a two-digit year'],
    ['0050-01-01', 'a year Date.UTC would silently read as 1950'],
    ['2026-08-23T00:00:00Z', 'a whole timestamp'],
    ['', 'nothing at all'],
    ['../../evil', 'a traversal'],
  ])('refuses %j — %s', (value) => {
    expect(isDayKey(value)).toBe(false)
  })
})

describe('parseDay', () => {
  const fallback = '2026-08-23'

  it('takes a day it recognises', () => {
    expect(parseDay('2026-05-17', fallback)).toBe('2026-05-17')
  })

  it('takes the first of a repeated parameter', () => {
    // `searchParams` gives an array whenever the parameter appears twice.
    expect(parseDay(['2026-05-17', '2026-05-18'], fallback)).toBe('2026-05-17')
  })

  it.each([[undefined], [null], [''], ['tomorrow'], ['2026-13-45'], [42], [{}]])(
    'falls back rather than refusing, for %j',
    (value) => {
      expect(parseDay(value, fallback)).toBe(fallback)
    },
  )
})

describe('dayLabel', () => {
  it('is a weekday, a day, a three-letter month and a four-digit year', () => {
    for (const { kickoff } of played) {
      expect(dayLabel(kickoff), kickoff.toISOString()).toMatch(
        /^[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2} \d{4}$/,
      )
    }
  })

  it('never grows a fourth letter on the month', () => {
    // September renders as `Sept` under `en-GB` if it is left alone, which makes
    // one label in nine wider than the rest and shifts the pager's arrows.
    const months = new Set(played.map(({ kickoff }) => dayLabel(kickoff).split(' ')[2]))
    for (const month of months) expect(month.length, month).toBe(3)
  })
})

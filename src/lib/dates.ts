/**
 * Every date the app renders, and the one place that decides what calendar month
 * a moment falls in.
 *
 * Grouping is here rather than beside the screen that groups, because "which
 * month is this in" is the same question as "what date is this" — both are
 * answered by the zone below, and two files holding an opinion about the zone is
 * exactly one too many.
 *
 * **A fixed zone, not the server's.** Vercel runs in UTC and a laptop does not,
 * so without pinning it the same kickoff renders as two different local times
 * and, for a late one, two different dates. Europe/London because these are
 * English football fixtures and that is the clock they are played on.
 *
 * **One exception, and it is deliberately narrow: `kickoffTime` will take a
 * zone.** A date, a matchday's span and a month heading all answer *where in the
 * season am I*, which is a question about the competition's calendar and has one
 * right answer for every reader. What time to sit down is a question about the
 * reader, so `KickoffTime` hands this the browser's own zone. The default stays
 * London, so a caller that says nothing gets the fixed zone as before.
 *
 * The *locale* is not part of that exception. `en-GB` and `hourCycle: 'h23'`
 * hold whatever zone is passed: a reader's locale would render `4:00 pm` for an
 * American, which is a different width in a slot foundations sizes tightly and
 * not a number you can add up, which is what makes a time monospaced at all.
 *
 * **Months are cut to three letters, and that is not laziness.** `en-GB` renders
 * September as `Sept` — four characters, where every other month gets three —
 * and the design's date chips are three-letter months throughout. Left alone it
 * makes one matchday in nine visibly wider than its neighbours. Intl still does
 * the work that matters, which is knowing what month a UTC timestamp falls in
 * over there; the abbreviation is ours.
 *
 * The formatters are built once at module load rather than per call: the `Intl`
 * constructor is the expensive part, and a page of fixtures would build dozens.
 */

const dateParts = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: '2-digit',
  timeZone: 'Europe/London',
})

const timeOnly = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Europe/London',
})

/**
 * The full month and year, for a diary's group headings. Its own formatter
 * rather than a fourth part above, because this one wants the month spelled out
 * — the truncation in `parts()` is for the chips, where a fourth letter would
 * make one month in twelve visibly wider than its neighbours.
 */
const monthAndYear = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/London',
})

/**
 * `formatToParts` rather than `format`, so each piece can be used on its own and
 * recombined. It returns the same output as `format` would, chopped into typed
 * segments — which is the only way to reach the month without also getting the
 * locale's idea of how to punctuate it.
 *
 * Every caller names the pieces it wants, so a formatter that gained `year` did
 * not disturb the ones that came before it.
 */
function parts(date: Date): { weekday: string; day: string; month: string; year: string } {
  const found = dateParts.formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    found.find((part) => part.type === type)?.value ?? ''
  return {
    weekday: value('weekday'),
    day: value('day'),
    month: value('month').slice(0, 3),
    year: value('year'),
  }
}

/** `Sat 27 Sep` — the fixture card's header. Uppercased in CSS, not here. */
export function kickoffDate(kickoff: Date): string {
  const { weekday, day, month } = parts(kickoff)
  return `${weekday} ${day} ${month}`
}

/**
 * The same formatter as `timeOnly`, in some other zone. Cached because the
 * module docblock's reason applies twice over here: the `Intl` constructor is
 * the expensive part, and a page of fixtures would ask for the same zone dozens
 * of times in a row. Every card on a page resolves to one zone, so this holds
 * one entry.
 *
 * `Intl` throws `RangeError` on a zone it does not know, and the zone reaching
 * this comes from a browser. An exception here would take down a whole page of
 * fixtures over a time, so an unknown zone falls back to London — the same
 * reading as `use-preference.ts` catching around `localStorage`.
 */
const zoned = new Map<string, Intl.DateTimeFormat>()

function timeIn(zone: string): Intl.DateTimeFormat {
  const cached = zoned.get(zone)
  if (cached !== undefined) return cached

  let formatter: Intl.DateTimeFormat
  try {
    formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: zone,
    })
  } catch {
    formatter = timeOnly
  }

  zoned.set(zone, formatter)
  return formatter
}

/**
 * `15:00`, shown in place of a score for a match that has not been played.
 *
 * The only formatter here that takes a zone, and the only one a reader's own
 * clock has any business answering. Omit it for London; see the docblock above.
 */
export function kickoffTime(kickoff: Date, zone?: string): string {
  return (zone === undefined ? timeOnly : timeIn(zone)).format(kickoff)
}

/**
 * A matchday's span: `27 Sep`, `27–28 Sep`, or `30 Nov – 1 Dec`.
 *
 * The month is dropped from the first date only when both fall in the same one.
 * A matchday really can straddle two months — the captured season has one — and
 * `30–1 Dec` would be nonsense.
 */
export function dateRange(first: Date, last: Date): string {
  const from = parts(first)
  const to = parts(last)
  if (from.day === to.day && from.month === to.month) return `${to.day} ${to.month}`
  if (from.month === to.month) return `${from.day}–${to.day} ${to.month}`
  return `${from.day} ${from.month} – ${to.day} ${to.month}`
}

/**
 * `27 Sep 25` — the date on a diary entry. Uppercased in CSS, as the others are.
 *
 * No weekday and a two-digit year: the diary is read down a column of dates, so
 * what matters is telling one entry from the next, and a season crosses a new
 * year in January.
 */
export function entryDate(date: Date): string {
  const { day, month, year } = parts(date)
  return `${day} ${month} ${year}`
}

/** `September 2025` — a diary's group heading. Uppercased in CSS. */
export function monthLabel(date: Date): string {
  return monthAndYear.format(date)
}

/* --------------------------------------------------------------- the day -- */

/**
 * The calendar day, which `/fixtures` is indexed by.
 *
 * Here rather than beside that page for `groupByMonth`'s reason, stated at the
 * top of this file: "which day is this kickoff in" is answered by the fixed zone
 * this module owns, and a second file holding an opinion about the zone is
 * exactly one too many. A day is the same kind of question as a month — *where
 * in the season am I* — so it takes the same answer for every reader.
 */

/**
 * The machine-readable half. `formatToParts` and a hand-built string rather
 * than a locale that happens to emit ISO order, because this file's docblock is
 * explicit that the *locale* is not part of the zone exception — and `en-CA`
 * emitting `2026-08-23` is a fact about Canadian formatting, not a guarantee.
 */
const dayNumbers = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Europe/London',
})

/** The readable half: `Sat 23 Aug 2026`, for the pager. */
const dayWords = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/London',
})

/**
 * London's offset from UTC at a given moment, in minutes.
 *
 * `timeZoneName: 'longOffset'` is the only part of `Intl` that will state an
 * offset outright; everything else formats a time and leaves you to infer it.
 * Node 24 renders zero as `GMT+00:00`, but the bare `GMT` is a legal rendering
 * of the same thing and some engines emit it, so both are read.
 */
const londonOffset = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  timeZoneName: 'longOffset',
})

function offsetMinutes(at: Date): number {
  const name = londonOffset.formatToParts(at).find((part) => part.type === 'timeZoneName')?.value
  const match = /^GMT(?:([+-])(\d{2}):(\d{2}))?$/.exec(name ?? '')
  if (match === null || match[1] === undefined) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '-' ? -minutes : minutes
}

/** `2026-08-23` — the London calendar day a moment falls in. */
export function dayKey(moment: Date): string {
  const found = dayNumbers.formatToParts(moment)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    found.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

/** `Sat 23 Aug 2026` — the pager's label. Uppercased in CSS, as the others are. */
export function dayLabel(moment: Date): string {
  const found = dayWords.formatToParts(moment)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    found.find((part) => part.type === type)?.value ?? ''
  // The month is cut to three for `parts()`' reason — `en-GB` renders September
  // as `Sept`, and one label in nine wider than the rest makes the arrows shift.
  // The year is four digits and not `entryDate`'s two: a diary is read down a
  // column of neighbouring dates, where the year only has to tell one row from
  // the next, while the pager is a control you can travel a whole season in.
  return `${value('weekday')} ${value('day')} ${value('month').slice(0, 3)} ${value('year')}`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** The day after a key, rolling months and years over. */
function nextDayKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number)
  // `Date.UTC` normalises out-of-range parts, so 31 January + 1 is 1 February
  // without a calendar table, and 31 December rolls the year.
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
}

/**
 * Midnight in London at the start of a day, as the UTC instant it really is.
 *
 * **Two passes, and the second is the whole point.** The offset has to be read
 * at the instant we are solving for, but we do not know that instant until we
 * have the offset. So: assume the day starts at UTC midnight, read the offset
 * there, apply it, then read the offset again at the answer. On the 363 ordinary
 * days the two readings agree and the second pass changes nothing. On the two
 * days a transition falls in they can differ, and the second reading is the one
 * taken at the candidate instant, which is the one that is right.
 *
 * This is why nothing here adds 24 hours to anything, and why `DAY_MS` in
 * [`hydration.ts`](./hydration.ts) must not be borrowed for it: the clocks go
 * forward on 29 March 2026 and back on 25 October, making those days 23 and 25
 * hours long. A fixed day length puts every fixture after the transition on the
 * wrong side of a boundary.
 */
function londonMidnight(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  const utcMidnight = Date.UTC(year, month - 1, day)
  const guess = utcMidnight - offsetMinutes(new Date(utcMidnight)) * 60_000
  return new Date(utcMidnight - offsetMinutes(new Date(guess)) * 60_000)
}

/**
 * The half-open span of UTC instants that make up one London day, for a Prisma
 * `kickoff: { gte: from, lt: to }`.
 *
 * **Half-open, where the three existing kickoff ranges in the codebase are
 * `gte`/`lte`.** A closed range would put a kickoff at exactly midnight in two
 * days at once, and every day would claim the first moment of the next.
 *
 * A `{ from, to }` object for `lineupKickoffRange`'s stated reason: it exists so
 * the coarse Prisma filter and the rule behind it cannot drift apart.
 */
export function dayRange(key: string): { from: Date; to: Date } {
  return { from: londonMidnight(key), to: londonMidnight(nextDayKey(key)) }
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Whether a string names a real day.
 *
 * Shape **and** existence, which a regexp alone cannot do: `2026-13-45` matches
 * any pattern loose enough to accept a real date. So the check is a round trip —
 * a key is real exactly when building the day and reading it back returns the
 * same string. `Date.UTC` normalises `2026-13-45` into a real instant in 2027,
 * whose key is not what was asked for, and the comparison rejects it.
 *
 * The round trip also disposes of `Date.UTC`'s two-digit-year trap, where a year
 * below 100 is silently read as 19xx: `0050-01-01` comes back as `1950-01-01`
 * and fails, rather than scoping the page to a day nobody asked for.
 */
export function isDayKey(value: string): boolean {
  return DAY_KEY.test(value) && dayKey(dayRange(value).from) === value
}

/**
 * The day a request is asking for, falling back rather than refusing.
 *
 * `unknown` rather than `string` for the same reason `parseView` takes it:
 * this is handed the raw value out of `searchParams`,
 * which is `string | string[] | undefined` and an array whenever the parameter is
 * repeated. A mistyped query string should show a day of football, not an error
 * page.
 */
export function parseDay(value: unknown, fallback: string): string {
  const wanted = Array.isArray(value) ? value[0] : value
  return typeof wanted === 'string' && isDayKey(wanted) ? wanted : fallback
}

/** A run of items that fall in one calendar month, labelled by it. */
export interface MonthGroup<T> {
  label: string
  items: T[]
}

/**
 * Cut an **already-sorted** list into calendar months.
 *
 * The precondition is the whole design: this walks the list once and starts a
 * new group whenever the label changes, so it preserves whatever order it was
 * handed and never imposes one. The caller sorts — in the diary's case Postgres
 * does, in the `ORDER BY` that the query was written around — and sorting here
 * as well would be a second opinion about order, free to disagree with it.
 *
 * Generic over `T` with a `(item: T) => Date` accessor rather than requiring a
 * `date` property, so it groups anything without knowing what a judgement is.
 * TypeScript infers `T` from the array at the call site, which is what keeps
 * `groups[0].items[0]` fully typed rather than `unknown`.
 */
export function groupByMonth<T>(items: readonly T[], dateOf: (item: T) => Date): MonthGroup<T>[] {
  const groups: MonthGroup<T>[] = []

  for (const item of items) {
    const label = monthLabel(dateOf(item))
    const open = groups.at(-1)

    if (open !== undefined && open.label === label) open.items.push(item)
    else groups.push({ label, items: [item] })
  }

  return groups
}

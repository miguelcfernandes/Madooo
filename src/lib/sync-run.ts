/**
 * One sync run, from options to a summary. The orchestration that used to live
 * in `scripts/sync.ts`.
 *
 * It moved here when the schedule moved to Vercel Cron. There are now two
 * callers — [`scripts/sync.ts`](../../scripts/sync.ts) for a person and
 * [`src/app/api/cron/sync/route.ts`](../app/api/cron/sync/route.ts) for the
 * schedule — and the run has to be the same run either way. The CLI keeps
 * argument parsing and the process's exit code; the route keeps HTTP. Neither
 * keeps any of the policy below.
 *
 * **Reporting is a callback rather than `console.log`.** The CLI wants lines on
 * a terminal as they happen; the route wants them in the response body *and* in
 * Vercel's runtime log. Handing `log` in lets both have what they want without
 * this file knowing which it is talking to.
 *
 * **Nothing here disconnects Prisma.** The CLI has to, or the process never
 * exits; the route must not, because Fluid Compute reuses a function instance
 * across invocations and a fresh pool every ten minutes is the cost this
 * project's single client exists to avoid. So the caller decides.
 */

import { databaseBranch, season, syncLeagues } from './env'
import { planRun, REQUESTS_PER_FIXTURE, REQUESTS_PER_LINEUP } from './hydration'
import {
  dueFixtures,
  leagueRows,
  lineupDueFixtures,
  roundLabel,
  syncFixtureDetail,
  syncFixtureLineups,
  syncSeasonFixtures,
} from './sync'
import type { SyncOptions } from './sync-options'

/** One fixture to read detail for, however it was selected. */
interface Target {
  apiFootballId: number
  league: string
  label: string
}

export interface SyncOutcome {
  branch: 'production' | 'development'
  season: number
  leagues: number[]
  /** True when the run reported a selection and spent nothing. */
  dryRun: boolean
  calendars: { ok: number; of: number }
  lineups: { ok: number; of: number }
  hydrated: { ok: number; of: number }
  /** What the day's remaining quota left behind — see the summary line. */
  stillDue: number
  /** Every league or fixture that failed, counted rather than thrown. */
  failures: string[]
}

function quota(remaining: number | null, limit: number | null): string {
  if (remaining === null) return 'quota unknown'
  return limit === null ? `${remaining} left` : `${remaining}/${limit} requests left`
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export async function runSync(
  options: SyncOptions,
  log: (line: string) => void,
): Promise<SyncOutcome> {
  const target = season()
  const configured = syncLeagues()
  if (options.league !== null && !configured.includes(options.league)) {
    throw new Error(
      `--league ${options.league} is not in LEAGUES (${configured.join(', ')})`,
    )
  }
  const leagues = options.league === null ? configured : [options.league]
  const branch = databaseBranch()

  log(`\nbranch: ${branch}   season: ${target}   leagues: ${leagues.join(', ')}`)

  // Every failure past this point is counted rather than thrown. The run's
  // report is what tells the platform to raise a flag; the log is what says
  // which league it was.
  const failures: string[] = []

  const results = []
  if (!options.dryRun) {
    log('\nfixtures')
    for (const leagueApiFootballId of leagues) {
      try {
        const result = await syncSeasonFixtures(target, leagueApiFootballId)
        results.push(result)
        // The league's name rather than a count of leagues: a name is evidence
        // the right competition came back, where "1 league" is evidence of
        // nothing.
        log(
          `  ok    ${result.league.name} — ${result.teams} teams, ` +
            `${result.matches} matches (${quota(result.remaining, result.limit)})`,
        )
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        failures.push(`league ${leagueApiFootballId}: ${reason}`)
        log(`  FAIL  league ${leagueApiFootballId} — ${reason}`)
      }
    }
  }

  const nothing = { ok: 0, of: 0 }

  if (options.fixturesOnly) {
    log(`\nsummary: calendars ${results.length}/${leagues.length}\n`)
    return {
      branch,
      season: target,
      leagues,
      dryRun: false,
      calendars: { ok: results.length, of: leagues.length },
      lineups: nothing,
      hydrated: nothing,
      stillDue: 0,
      failures,
    }
  }

  // The freshest reading of a quota that is global to the key. Null when every
  // calendar failed, or on a dry run, in which case nothing is clamped.
  const budgetSource = results.length > 0 ? results[results.length - 1] : null
  const quotaLimit = budgetSource?.limit ?? null

  // Resolved once, before the branch, so neither the selection nor the heading
  // below has to assert that `--round` was given. `validateSyncOptions`
  // guarantees exactly one mode and `--fixtures-only` has already returned, but
  // that is an invariant the type system cannot see.
  const round = options.round === null ? null : roundLabel(options.round)

  const skipped: string[] = []
  let due: Target[]
  // Fixtures wanting a team sheet before they have been played out. Only `--due`
  // fills this: `--round` is the post-match repair tool and always has been.
  let lineupsDue: Target[] = []

  // No round means `--due`: `--fixtures-only` has returned already, and
  // `validateSyncOptions` allows no third possibility.
  if (round === null) {
    const rows = await leagueRows(leagues)
    const missing = leagues.length - rows.length
    if (missing > 0) {
      // A configured league with no row has never been synced, so there is
      // nothing of it to read. Worth saying rather than presenting as zero due.
      skipped.push(`${plural(missing, 'league')} not in the database yet`)
    }
    const leagueIds = rows.map((row) => row.id)
    const now = new Date()
    // Both selections resolved before either is fetched, so the heading below
    // can state the whole run rather than one queue at a time.
    lineupsDue = await lineupDueFixtures(target, now, leagueIds)
    due = await dueFixtures(target, now, leagueIds)
  } else {
    due = results.flatMap((result) => {
      const inRound = result.fixtures.filter((fixture) => fixture.round === round)
      // A league that simply does not have this round is not a failure: the
      // Primeira Liga plays 34 to the Premier League's 38, so `--round 36` is a
      // real asymmetry rather than a mistyped label. Only *no* league matching
      // means the label is wrong.
      if (inRound.length === 0) skipped.push(`${result.league.name} has no "${round}"`)
      return inRound.map((fixture) => ({
        apiFootballId: fixture.apiFootballId,
        league: result.league.name,
        label: fixture.label,
      }))
    })

    if (due.length === 0 && failures.length === 0) {
      throw new Error(`No fixtures in "${round}" in any league — check the round label`)
    }
  }

  // Clamped, never refused. This used to throw and tell the author to pass
  // --limit, which has no reader in a scheduled run — and refusing outright
  // hydrates nothing where hydrating some would have been right.
  //
  // `--limit` caps the hydration queue alone. It is the tool for a person
  // running `--round` against a whole matchday; the lineup queue is bounded to
  // whatever kicks off in the next ninety minutes and never needs capping.
  const wanted = options.limit === null ? due.length : Math.min(due.length, options.limit)
  const budget = planRun(lineupsDue.length, wanted, budgetSource?.remaining ?? null)

  const lineupsSelected = lineupsDue.slice(0, budget.lineups)
  const selected = due.slice(0, budget.fixtures)
  const unread = due.length - selected.length + (lineupsDue.length - lineupsSelected.length)

  const requests =
    lineupsSelected.length * REQUESTS_PER_LINEUP + selected.length * REQUESTS_PER_FIXTURE

  const heading = round ?? 'due'
  const work = [
    // The lineup queue is named only when it has something in it: on most runs
    // of the day it is empty, and a permanent "0 lineups" would be noise in a
    // log whose whole job is to be skimmed.
    lineupsSelected.length > 0 ? plural(lineupsSelected.length, 'lineup') : null,
    `${plural(due.length, 'fixture')}, ${selected.length} this run`,
  ].filter((part) => part !== null)

  log(`\n${heading} — ${work.join(', ')}, ${plural(requests, 'request')}`)
  for (const note of skipped) log(`  skip  ${note}`)
  if (budget.fixtures < wanted || budget.lineups < lineupsDue.length) {
    log(`  note  clamped by the day's remaining quota`)
  }

  if (options.dryRun) {
    for (const fixture of lineupsSelected) {
      log(`  would  lineup · ${fixture.league} · ${fixture.label}`)
    }
    for (const fixture of selected) {
      log(`  would  ${fixture.league} · ${fixture.label}`)
    }
    log(
      `\ndry run — nothing fetched, ${plural(lineupsSelected.length, 'lineup')} and ` +
        `${plural(selected.length, 'fixture')} due\n`,
    )
    return {
      branch,
      season: target,
      leagues,
      dryRun: true,
      calendars: nothing,
      lineups: { ok: 0, of: lineupsSelected.length },
      hydrated: { ok: 0, of: selected.length },
      stillDue: unread,
      failures,
    }
  }

  // Team sheets first. Their window closes at full time where the hydration
  // queue's is a fortnight wide, so if the run dies part way through it should
  // die having done the work that could not have waited.
  let sheets = 0
  for (const fixture of lineupsSelected) {
    try {
      const detail = await syncFixtureLineups(fixture.apiFootballId)
      sheets += 1
      log(
        `  ok    lineup · ${fixture.league} · ${fixture.label} — ${detail.lineups} lineups, ` +
          `${detail.squadEntries} squad entries (${quota(detail.remaining, quotaLimit)})`,
      )
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      failures.push(`lineup ${fixture.apiFootballId}: ${reason}`)
      log(`  FAIL  lineup · ${fixture.league} · ${fixture.label} — ${reason}`)
    }
  }

  let hydrated = 0
  for (const fixture of selected) {
    try {
      const detail = await syncFixtureDetail(fixture.apiFootballId)
      hydrated += 1
      log(
        `  ok    ${fixture.league} · ${fixture.label} — ${detail.lineups} lineups, ` +
          `${detail.squadEntries} squad entries (${quota(detail.remaining, quotaLimit)})`,
      )
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      failures.push(`fixture ${fixture.apiFootballId}: ${reason}`)
      log(`  FAIL  ${fixture.league} · ${fixture.label} — ${reason}`)
    }
  }

  // One line the log can be read down to. `still due` is the number the budget
  // left behind, which is the difference between "nothing to do" and "ran out of
  // room" — the two states a run of zero could otherwise mean.
  log(
    `\nsummary: calendars ${results.length}/${leagues.length}, ` +
      `lineups ${sheets}/${lineupsSelected.length}, ` +
      `hydrated ${hydrated}/${selected.length}, still due ${unread}, ` +
      `failed ${failures.length}\n`,
  )

  return {
    branch,
    season: target,
    leagues,
    dryRun: false,
    calendars: { ok: results.length, of: leagues.length },
    lineups: { ok: sheets, of: lineupsSelected.length },
    hydrated: { ok: hydrated, of: selected.length },
    stillDue: unread,
    failures,
  }
}

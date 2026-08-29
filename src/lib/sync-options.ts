/**
 * What a sync run can be asked to do, and the rules about which requests make
 * sense. Imports nothing, so it is testable the way `hydration.ts` is.
 *
 * This file exists because the sync now has **two callers** — the CLI a person
 * runs and the cron route Vercel calls — and the rules below have to be the
 * same for both. When the schedule lived in GitHub Actions the CLI was the only
 * entry point and `parseArgs` could own them; a second caller would have had to
 * restate them, and two copies of "--dry-run only applies to --due" is one copy
 * too many.
 */

export interface SyncOptions {
  /** A matchday label to repair, e.g. `7`. Null means the run selects its own work. */
  round: string | null
  /** Caps the hydration queue. The lineup queue is never capped — see `runSync`. */
  limit: number | null
  /** The calendars alone, one request per league. */
  fixturesOnly: boolean
  /** Ask our own table what wants reading. The mode the scheduler runs. */
  due: boolean
  /** Report the selection and spend nothing. */
  dryRun: boolean
  /** Narrow the run to one configured league id. Cannot reach outside `LEAGUES`. */
  league: number | null
}

export const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  round: null,
  limit: null,
  fixturesOnly: false,
  due: false,
  dryRun: false,
  league: null,
}

/**
 * Throws unless the combination describes a run that can actually be performed.
 *
 * A dry run of `--round` would still have to fetch every calendar to know what
 * is in the round, so it could not honour the promise the flag makes.
 */
export function validateSyncOptions(options: SyncOptions): SyncOptions {
  const modes = [options.round !== null, options.fixturesOnly, options.due]
  if (modes.filter(Boolean).length !== 1) {
    throw new Error('Pass exactly one of --due, --round <n> or --fixtures-only')
  }
  if (options.dryRun && !options.due) {
    throw new Error('--dry-run only applies to --due')
  }
  return options
}

/** Shared by both parsers so `--limit 0` and `?limit=0` fail identically. */
function wholeNumber(raw: string, name: string, hint: string): number {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} ${hint}`)
  return value
}

/**
 * The cron route's parser.
 *
 * **A bare request means `--due`**, because that is what Vercel sends on the
 * schedule: a GET with no query string at all. The other parameters exist so the
 * `--round` repair tool stays reachable without a laptop, which is the job
 * `workflow_dispatch` used to do.
 *
 * A flag is on when it is present with any value except `0` or `false`, so
 * `?dry-run` and `?dry-run=1` both work and `?dry-run=false` does not surprise.
 */
export function syncOptionsFromSearchParams(params: URLSearchParams): SyncOptions {
  const flag = (name: string): boolean => {
    if (!params.has(name)) return false
    const raw = (params.get(name) ?? '').trim().toLowerCase()
    return raw !== '0' && raw !== 'false'
  }

  const league = params.get('league')
  const limit = params.get('limit')
  const fixturesOnly = flag('fixtures-only')

  // Normalised before it decides anything, so `?round=` with an empty value is
  // the same request as no `round` at all rather than a mode with no label.
  const raw = params.get('round')
  const round = raw === null || raw.trim() === '' ? null : raw.trim()

  const options: SyncOptions = {
    round,
    limit: limit === null ? null : wholeNumber(limit, 'limit', 'takes a whole number of fixtures'),
    fixturesOnly,
    // The default, and only when nothing else was asked for. `--due` is what the
    // schedule wants and the schedule sends no parameters.
    due: flag('due') || (round === null && !fixturesOnly),
    dryRun: flag('dry-run'),
    league:
      league === null
        ? null
        : wholeNumber(league, 'league', 'takes an API-Football league id, e.g. league=94'),
  }

  return validateSyncOptions(options)
}

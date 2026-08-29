/**
 * Pull football into our database, from a laptop.
 *
 *   npm run sync -- --due                      the calendars, then whatever needs reading
 *   npm run sync -- --due --dry-run            say what --due would do, spending nothing
 *   npm run sync -- --round 1                  fixtures, then round 1 everywhere
 *   npm run sync -- --round 1 --limit 2        hydrate only the first 2 matches
 *   npm run sync -- --league 94 --due          one league instead of all of them
 *   npm run sync -- --fixtures-only            the calendars alone, 1 per league
 *
 * Costs one request per league for its whole season of fixtures, then two per
 * hydrated fixture and one per team sheet. A Premier League round is
 * 1 + 20 = 21 of the day's 7,500.
 *
 * **The run itself is [`src/lib/sync-run.ts`](../src/lib/sync-run.ts), not this
 * file.** This is one of its two callers; the other is the cron route Vercel
 * calls on the schedule. What is left here is the part that only makes sense at
 * a terminal — argument parsing, printing as it goes, disconnecting so the
 * process can exit, and an exit code.
 *
 * **`--due` is the mode the scheduler runs and `--round` is the one a person
 * runs.** `--round` names a matchday and asks for it; `--due` names nothing and
 * asks our own table what wants reading, which is why it needs no answer to
 * "which round is current" in seven leagues that are at seven different points
 * of their seasons. `--round` stays because it is the repair tool: it reaches a
 * match the fortnight window has already dropped. Both are reachable from the
 * cron route too, so the repair no longer requires this file.
 *
 * Unlike `db-check.ts` this does not refuse to run against production — syncing
 * production is the job's entire purpose. It prints the branch instead.
 */

import { config } from 'dotenv'

import {
  DEFAULT_SYNC_OPTIONS,
  validateSyncOptions,
  type SyncOptions,
} from '../src/lib/sync-options'

config({ path: '.env.local', quiet: true })

function parseArgs(argv: string[]): SyncOptions {
  const options: SyncOptions = { ...DEFAULT_SYNC_OPTIONS }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--fixtures-only') {
      options.fixturesOnly = true
    } else if (arg === '--due') {
      options.due = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--round') {
      options.round = argv[++index] ?? null
    } else if (arg === '--league') {
      const value = Number(argv[++index])
      if (!Number.isInteger(value) || value < 1) {
        throw new Error('--league takes an API-Football league id, e.g. --league 94')
      }
      options.league = value
    } else if (arg === '--limit') {
      const value = Number(argv[++index])
      if (!Number.isInteger(value) || value < 1) {
        throw new Error('--limit takes a whole number of fixtures')
      }
      options.limit = value
    } else {
      throw new Error(`Unrecognised argument: ${arg}`)
    }
  }

  // The rules about which combinations mean anything live beside the route's
  // parser, so the two entry points cannot drift on them.
  return validateSyncOptions(options)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  // Imported after config(), and dynamically: a static import is hoisted above
  // it, and src/lib/prisma.ts builds its client — reading DATABASE_URL_DEV — the
  // instant it is imported. The same trick as scripts/db-check.ts. `sync-options`
  // above is exempt because it imports nothing and touches no environment.
  const { runSync } = await import('../src/lib/sync-run')
  const { prisma } = await import('../src/lib/prisma')

  try {
    const outcome = await runSync(options, (line) => console.log(line))
    if (outcome.failures.length > 0) process.exitCode = 1
  } finally {
    // The route deliberately does not do this — see the header of sync-run.ts.
    // Here it is what lets node exit rather than sit on an open pool.
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('\nsync FAILED\n', error instanceof Error ? error.message : error)
  process.exitCode = 1
})

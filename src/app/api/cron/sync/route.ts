import { runSync } from '@/lib/sync-run'
import { syncOptionsFromSearchParams } from '@/lib/sync-options'

/**
 * The scheduled sync. Vercel Cron calls this; nothing else may.
 *
 * **This is the one route under `src/app/` that talks to API-Football, and it
 * is the reason `API_FOOTBALL_KEY` now exists in the deployed environment at
 * all.** Until the schedule moved here it lived only in GitHub Actions, and the
 * project's second non-negotiable — never call API-Football on page load — was
 * enforced by the key simply not being present: a page that reached the provider
 * threw at `apiFootballKey()` the first time it ran. That is no longer true, so
 * the rule is now a rule. It is stated in `AGENTS.md`, in `architecture.md` and
 * beside `apiFootballKey()` itself, and this is the only file exempt from it.
 * **Nothing else under `src/app/` may import `lib/sync`, `lib/sync-run` or
 * `lib/api-football`.**
 *
 * The rule is not bureaucracy: a page that reaches a third party waits on it,
 * fails with it, and is rate-limited by its own traffic.
 *
 * A bare `GET` means `--due`, which is what the schedule sends. `?round=7`,
 * `?league=94`, `?limit=2` and `?dry-run` reach the same run a person would get
 * from the CLI — that is the `workflow_dispatch` button's replacement, and why
 * a repair no longer needs a laptop.
 */

/**
 * **480 seconds is the concurrency lock, not a performance setting.**
 *
 * Two runs at once would both read the same due fixtures and both write them.
 * GitHub Actions held that off with `concurrency:`; Vercel Cron has no such
 * thing, and Postgres cannot help — an advisory lock is scoped to a session and
 * Neon's pooler hands sessions out per transaction, so ours would be released
 * underneath us. But the schedule fires every 600 seconds, so a run that cannot
 * outlive 480 of them cannot overlap the next one. The platform enforces it,
 * and no lock table has to exist.
 *
 * It is a bound on a hang rather than on the volume: a heavy day is about 60
 * requests paced at 250ms. **Anything that shortens the cron interval has to
 * shorten this with it.** Pro allows up to 800s, which a tighter cadence could
 * not use.
 */
export const maxDuration = 480

export async function GET(request: Request): Promise<Response> {
  /**
   * Vercel sends this header on scheduled invocations when `CRON_SECRET` is set.
   * Missing rather than wrong is a 500, not a 401: an unset secret would leave
   * the sync open to anyone who guessed the path, so it is a misconfiguration to
   * report rather than a caller to turn away.
   */
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET is not set' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lines: string[] = []
  // Both, deliberately: the response body is what a person curling the repair
  // path reads, and the console is what Vercel's runtime log keeps for the 96
  // scheduled runs nobody is watching.
  const log = (line: string) => {
    lines.push(line)
    console.log(line)
  }

  try {
    const options = syncOptionsFromSearchParams(new URL(request.url).searchParams)
    const outcome = await runSync(options, log)

    /**
     * A failed league or fixture is counted rather than thrown, so the run can
     * step over it — but the invocation still has to report failure, or a
     * competition that has been unreadable for a week looks exactly like a quiet
     * afternoon. A non-2xx is what marks the run failed in Vercel's cron log;
     * it is this route's version of the CLI's exit code.
     */
    const status = outcome.failures.length > 0 ? 500 : 200
    return Response.json({ ...outcome, log: lines }, { status })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.error('sync FAILED', reason)
    return Response.json({ error: reason, log: lines }, { status: 500 })
  }
}

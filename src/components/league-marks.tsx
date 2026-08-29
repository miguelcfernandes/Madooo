import { compareLeagues, flagClass, type LeagueIdentity } from '@/lib/leagues'
import { LeagueFlag } from './league-flag'

/**
 * Which competitions a team of the week was picked from, in the space a card
 * has for it.
 *
 * **Flags rather than names**, which is the whole reason this fits: seven names
 * is a paragraph and seven flags is 140px, and a flag is already the app's mark
 * for a competition wherever one is named. `LeagueFlag` is `aria-hidden` by
 * contract — "the league's name is next to it and says the same thing" — so
 * every mark here carries an `sr-only` name, which is that contract kept rather
 * than an addition to it.
 *
 * **A competition we have vendored no flag for falls back to its name**, in
 * words. `flagClass` returns null for a country with no file — API-Football
 * calls the Champions League's country "World" — and `LeagueFlag` then draws
 * nothing at all, which in a row of marks would be a silent gap rather than a
 * degradation. Nothing in the seven leagues hits this today.
 *
 * **"All" is compared against the competitions that exist now, not stored.** A
 * team drawn from every league the app held is still listed one flag at a time
 * once an eighth arrives, because it genuinely did not include that one. A
 * stored "all" flag would have quietly started lying on the day a league was
 * added, which is the argument the schema comment makes at more length.
 */
export function LeagueMarks({
  leagues,
  total,
}: {
  leagues: readonly (LeagueIdentity & { id: number; name: string })[]
  /** How many competitions the app holds this season. */
  total: number
}) {
  if (leagues.length === 0) {
    // Unreachable for a saved team — the action refuses an eleven with no
    // competition behind it — and drawn rather than omitted so that a row which
    // somehow held none would say so instead of looking like a rendering fault.
    return <span className="text-caption text-muted">No competition</span>
  }

  if (leagues.length >= total) {
    return <span className="text-caption text-muted">All competitions</span>
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {[...leagues].sort(compareLeagues).map((league) => (
        <span key={league.id} className="inline-flex items-center">
          <LeagueFlag league={league} />
          {flagClass(league) === null ? (
            <span className="text-caption text-muted">{league.name}</span>
          ) : (
            <span className="sr-only">{league.name}</span>
          )}
        </span>
      ))}
    </span>
  )
}

/**
 * Reading API-Football's round strings.
 *
 * `Match.round` holds the provider's own label, `"Regular Season - 1"`, because
 * that is what the fixture list carries and inventing a column for the number
 * would mean two sources for one fact. Everything that needs to read or display
 * a round parses it here.
 *
 * This module exists **so that pages do not import `sync.ts`**. `roundLabel`
 * started life there, but `sync.ts` imports the API-Football client, and
 * constraint #2 in AGENTS.md says nothing reachable from a page render may
 * appear in that file's import graph. Both sides depend on this module instead;
 * nothing depends outwards on the sync.
 */

/** `"Regular Season - 1"` and `"1"` both mean the same round. */
export function roundLabel(round: string): string {
  return /^\d+$/.test(round.trim()) ? `Regular Season - ${round.trim()}` : round
}

/**
 * The matchday number inside a round label, or `null` for a round that has no
 * number — a knockout tie in some future competition, say.
 *
 * Null rather than 0 or NaN so that callers have to decide what an unnumbered
 * round means to them, instead of silently sorting it to the front.
 */
export function roundNumber(round: string): number | null {
  const match = /(\d+)\s*$/.exec(round.trim())
  return match === null ? null : Number(match[1])
}

/**
 * What a fixture card shows: `"Regular Season - 6"` → `"Matchday 6"`.
 *
 * The fallback matters more than it looks. A knockout tie carries a label with
 * no number — `"Round of 16"`, `"Final"` — and is returned unchanged rather than
 * dropped, so a competition that is not a league still says which stage a
 * fixture belongs to.
 */
export function roundDisplay(round: string): string {
  const number = roundNumber(round)
  return number === null ? round : `Matchday ${number}`
}

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

/* ------------------------------------------------------------ qualifying -- */

/** What the filter below needs of a fixture: which round, and when. */
export interface DatedRound {
  round: string
  kickoff: Date
}

/**
 * A competition's own fixtures, without the qualifying it played to reach them.
 *
 * **The Champions League is why this exists.** API-Football's season for it is
 * 234 fixtures by 81 clubs, of which 90 fixtures are qualifying — three
 * qualifying rounds and a play-off round, played across July and August — and 45
 * of the clubs are out before the competition kicks off. A match diary is for
 * the competition people watch, and those 45 would otherwise sit in `/teams` and
 * `/players` all season having played two ties in the summer. What is left is
 * 144 fixtures and the 36 clubs in the league phase.
 *
 * **The rule: a round that starts before the competition's first numbered round
 * is qualifying for it, not part of it.** Stated in dates rather than in names,
 * and that is the whole design:
 *
 *   - **It names no competition and no round.** A rule listing
 *     `"1st Qualifying Round"` and `"Play-offs"` would be a second place where
 *     the app knows what the Champions League is, and would need editing for
 *     every competition after it — four qualifying rounds in the Europa League,
 *     a different spelling in the next provider.
 *   - **It cannot mistake a promotion play-off for a qualifier**, which a name
 *     rule certainly would: `"Play-offs"` is what a second division calls the
 *     matches that decide promotion, and those are the most-watched fixtures of
 *     that season. They come *after* the numbered rounds, so they are kept.
 *   - **A numbered round can never be dropped.** The earliest numbered round's
 *     first kickoff *is* the cutoff, so nothing numbered is before it. That is a
 *     property of the arithmetic rather than a case handled.
 *
 * A round is judged by its **first** kickoff, not its last, so a qualifying tie
 * postponed into September does not drag its whole round back into the
 * competition.
 *
 * **What it assumes, stated because it is the way this breaks:** that the
 * qualifying rounds carry no number the parser can find at the end of the label.
 * `"1st Qualifying Round"` is safe — the digit is at the front — and so are
 * `"Play-offs"`, `"Round of 16"` and `"Final"`. A provider that wrote
 * `"Qualifying Round 1"` would make it a numbered round, move the cutoff into
 * July, and quietly carry everything. `rounds.test.ts` asserts the shape of the
 * labels we actually receive, which is where that would be caught.
 *
 * Everything is kept for a competition with no numbered round at all — a pure
 * knockout cup — because there is then no cutoff to measure against, and
 * dropping the lot would be worse than dropping nothing.
 */
export function withoutQualifying<T>(
  fixtures: readonly T[],
  /**
   * Where the round and the kickoff live on the caller's shape — `groupByLeague`'s
   * arrangement, so the sync can hand over its own mapped fixtures whole rather
   * than flattening them into something this file has to know about.
   */
  datedRound: (fixture: T) => DatedRound,
): T[] {
  let mainPhaseStart: number | null = null
  for (const fixture of fixtures) {
    const { round, kickoff } = datedRound(fixture)
    if (roundNumber(round) === null) continue
    if (mainPhaseStart === null || kickoff.getTime() < mainPhaseStart) {
      mainPhaseStart = kickoff.getTime()
    }
  }

  if (mainPhaseStart === null) return [...fixtures]

  // When each round begins. A round is one bucket however many fixtures it
  // holds, so that the whole of it is carried or none of it is.
  const roundStart = new Map<string, number>()
  for (const fixture of fixtures) {
    const { round, kickoff } = datedRound(fixture)
    const open = roundStart.get(round)
    if (open === undefined || kickoff.getTime() < open) roundStart.set(round, kickoff.getTime())
  }

  const start = mainPhaseStart
  return fixtures.filter((fixture) => (roundStart.get(datedRound(fixture).round) ?? start) >= start)
}

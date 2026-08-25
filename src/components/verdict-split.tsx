import { plural } from '@/lib/text'
import { verdictSplit, type VerdictCounts } from '@/lib/verdict-split'
import { SplitBar, SplitLegend } from './split-bar'

/**
 * "Verdict split" — how a player's watched matches divide between the three
 * verdicts and the matches that got none.
 *
 * The same card as `SquadPanel` and `VerdictSummary`: a bordered `--surface` at
 * a bordered card with a `--surface-alt` strip, so the profile reads as one
 * system with the match page rather than as a dashboard.
 *
 * The card is all this file is now. The bar and the badges moved to
 * [`split-bar.tsx`](./split-bar.tsx) when the players index wanted them without a
 * card around them; the arithmetic was already in
 * [`verdict-split.ts`](../lib/verdict-split.ts), where it is pure and tested.
 */
export function VerdictSplit({ counts }: { counts: VerdictCounts }) {
  const segments = verdictSplit(counts)

  return (
    <section className="mb-6 overflow-hidden border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b-2 border-brand bg-surface-alt px-4 py-2">
        <h2 className="text-caps">Verdict split</h2>
        {/* Plurals are real here — 6.6's
            decision, and the numeral is its own span because foundations
            monospaces a number you can add up. */}
        <span className="shrink-0 text-caps text-muted">
          {/* `font-mono` overrides only the family that `text-caps` sets, so the
              size, weight and tracking of the micro-label survive — the same
              move `FixtureRow`'s tallies and the match page's scoreline
              make. */}
          <span className="font-mono">{counts.watched}</span>{' '}
          {plural(counts.watched, 'match')} watched
        </span>
      </header>

      <div className="p-4">
        {/* All four segments in the legend, including `unrated`: on a profile
            there is a "watched" number for it to be the remainder of, which is
            what makes it read as "watched him and said nothing". */}
        <SplitBar segments={segments} />
        <SplitLegend segments={segments} className="mt-3" />
      </div>
    </section>
  )
}

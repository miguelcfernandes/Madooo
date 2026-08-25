/**
 * Reading a user's judgements back off a squad — the tags, and the notes.
 *
 * Pure, and deliberately so, for the same reason as [`squad.ts`](./squad.ts):
 * Prisma is not imported, everything below is structural, and the decisions
 * worth a test — which players appear in the summary panel and in what order —
 * are made here rather than in a component nothing can assert against.
 *
 * The write side is [`actions.ts`](./actions.ts).
 */

// Relative, not `@/generated/…`, because Vitest resolves no path aliases — its
// config declares none, and the rest of `src/lib` reaches its neighbours the
// same way. A module that a test imports has to be importable without Next's
// bundler in the loop.
import { JudgementTag } from '../generated/prisma/enums'

/**
 * Re-exported so nothing outside this module has to know where Prisma's
 * generated client puts its enums — `src/generated/` is gitignored build output
 * and its layout is the generator's business, not ours.
 */
export type { JudgementTag }

/**
 * The shape these helpers need, rather than Prisma's `Judgement`.
 *
 * The array is 0 or 1 long and never more: `@@unique([userId, matchSquadId])`
 * guarantees one judgement per user per player per match, and the query filters
 * to one user. Prisma still types a to-many relation as an array, so the
 * unwrapping happens once, in `verdictOf`, instead of at every call site.
 */
export interface Judgeable {
  judgements: { tag: JudgementTag | null }[]
}

/**
 * The same row read for its note instead of its tag.
 *
 * A second interface rather than a wider `Judgeable`, because TypeScript is
 * **structurally** typed: an object is accepted anywhere its shape fits, so the
 * page's squad entry satisfies both of these without declaring that it does, and
 * neither helper forces a caller to supply the half it does not use.
 */
export interface Annotated {
  judgements: { note: string | null }[]
}

/**
 * How long a note may be.
 *
 * Here rather than in [`actions.ts`](./actions.ts) because both sides need it —
 * the action enforces it, the dialog hands it to the textarea — and that file may
 * export nothing but Server Actions.
 *
 * The column itself is unbounded `text`; this is a product limit, not a schema
 * one. A note is a line or two about a performance.
 */
export const NOTE_MAX_LENGTH = 1000

/**
 * Whether an untrusted value is one of the three tags.
 *
 * The `value is JudgementTag` return type is a **type predicate**: it tells
 * TypeScript that a `true` narrows the argument at the call site, which is how a
 * `string` arriving over the wire becomes a typed enum without a cast. The
 * Server Action needs it because every export of a `'use server'` file is a
 * public POST endpoint, so its arguments are as untrusted as a URL's.
 *
 * `Object.hasOwn` rather than `in`, which would also accept `"toString"`.
 */
export function isJudgementTag(value: unknown): value is JudgementTag {
  return typeof value === 'string' && Object.hasOwn(JudgementTag, value)
}

/** The user's verdict on one squad entry, or null for the great unjudged majority. */
export function verdictOf(entry: Judgeable): JudgementTag | null {
  return entry.judgements[0]?.tag ?? null
}

/** The user's note on one squad entry, or null. Never the empty string: the
    action stores a cleared note as no note at all. */
export function noteOf(entry: Annotated): string | null {
  return entry.judgements[0]?.note ?? null
}

/** The number beside a panel's micro-label. Zero is a real answer and is shown. */
export function countVerdicts(entries: readonly Judgeable[]): number {
  return entries.filter((entry) => verdictOf(entry) !== null).length
}

/**
 * The other half of a fixture card's footer.
 *
 * Deliberately not folded into `countVerdicts` as one function returning a pair:
 * the panel header on the match page wants verdicts alone, and a helper that
 * always computed both would make every caller of the common case pay for the
 * other and then throw it away. Two functions over the two structural interfaces
 * also means each one asks for exactly the half of a row it reads.
 */
export function countNotes(entries: readonly Annotated[]): number {
  return entries.filter((entry) => noteOf(entry) !== null).length
}

/**
 * MVP, then the standouts, then the flops — the order the summary
 * panel reads in, which is not the left-to-right order of the
 * buttons on a row. Two orders for one vocabulary, so both are written down.
 */
const SUMMARY_RANK: Record<JudgementTag, number> = { MVP: 0, STANDOUT: 1, FLOP: 2 }

export interface Verdict<T> {
  entry: T
  tag: JudgementTag
}

/**
 * The "Your verdicts" panel: every judged player, grouped by verdict.
 *
 * Within a group the incoming order survives, because `Array.prototype.sort` is
 * required to be stable and the caller hands entries over in the order the
 * panels above draw them — home eleven, home bench, away eleven, away bench.
 *
 * `flatMap` rather than `filter` then `map`: it drops the untagged entries and
 * narrows `tag` away from `JudgementTag | null` in one pass, where a `filter`
 * would leave TypeScript still believing the tag might be null.
 */
export function summariseVerdicts<T extends Judgeable>(entries: readonly T[]): Verdict<T>[] {
  return entries
    .flatMap((entry) => {
      const tag = verdictOf(entry)
      return tag === null ? [] : [{ entry, tag }]
    })
    .sort((a, b) => SUMMARY_RANK[a.tag] - SUMMARY_RANK[b.tag])
}

/**
 * What one match looks like on the diary's Matches tab.
 *
 * `mvp` is the entry rather than a name, which is what keeps this generic: the
 * caller reads whatever it selected off it — a player's name here — and the
 * function never has to know that a squad entry has a player on it.
 * `summariseVerdicts` above returns entries for the same reason.
 */
export interface MatchSummary<T> {
  mvp: T | null
  standouts: number
  flops: number
  notes: number
}

/**
 * Fold one match's judged squad entries into the four things its diary row says.
 *
 * A separate pass from `countVerdicts`, which counts entries carrying *any* tag
 * and cannot answer "how many flops". A row needs the split, and one function
 * that walked the list once is cheaper to read than three that each walk it.
 *
 * **`notes` overlaps the tag counts on purpose.** One judgement can be a flop
 * *and* carry a note, so the three numbers do not partition the entries and must
 * never be presented as if they did — no `unrated` remainder, no proportional
 * bar. [`verdict-split.ts`](./verdict-split.ts) makes the same argument for a
 * club, where one match contributes many players.
 *
 * There is at most one MVP: the app's rule is that a match has one across both
 * squads, and awarding it again takes it off the first player. The `??=` holds
 * that line rather than trusting it — if the data ever disagreed, the row would
 * name the first and not silently redraw itself.
 */
export function summariseMatch<T extends Judgeable & Annotated>(
  entries: readonly T[],
): MatchSummary<T> {
  const summary: MatchSummary<T> = { mvp: null, standouts: 0, flops: 0, notes: 0 }

  for (const entry of entries) {
    switch (verdictOf(entry)) {
      case 'MVP':
        summary.mvp ??= entry
        break
      case 'STANDOUT':
        summary.standouts += 1
        break
      case 'FLOP':
        summary.flops += 1
        break
    }

    if (noteOf(entry) !== null) summary.notes += 1
  }

  return summary
}

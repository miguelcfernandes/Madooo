/**
 * The diary's three views — the tab row — and
 * the only place they are written down.
 *
 * One table, read by three callers: the tabs render the labels, the page reads
 * the empty-state sentence, and [`diary.ts`](./diary.ts) spreads the `where`
 * fragment into its query. Splitting them would mean a slug could exist in the
 * URL that nothing knew how to query, or a query nothing could link to.
 *
 * **Views rather than filters, and that is the whole reason for the union
 * below.** Two of the three narrow the list of judgements; `matches` replaces it
 * with a different list altogether, one row per match rather than one per
 * judgement, and it has no `JudgementWhereInput` to contribute. Calling the
 * table a filter would have made `matches` an entry that filters nothing, so the
 * word went instead. `?view=` is also what a player profile already calls the
 * same control, and what `foundations.md` calls it: an underline tab changes the
 * view of the screen you are already on.
 *
 * Pure, like [`verdicts.ts`](./verdicts.ts) and [`squad.ts`](./squad.ts), and
 * for the same reason: `parseView` reads an untrusted URL parameter, which is
 * exactly the sort of decision worth a test, and a test must be able to import
 * this without Prisma in the loop.
 *
 * A `where` fragment is a plain object literal, so nothing here imports the
 * Prisma *client* — only its types, and `import type` is erased at compile time
 * rather than resolved at runtime.
 */

import type { Prisma } from '../generated/prisma/client'

/** What every view carries, whichever kind it is. */
interface DiaryViewBase {
  /** What appears in the URL: `/diary?view=matches`. */
  slug: string
  label: string
  /** What the list says when this view has nothing to show. */
  empty: string
}

/**
 * A view is one of two kinds, and the discriminant is load-bearing.
 *
 * `kind: 'entries'` carries a `where` folded into the judgement query beside the
 * user and the season. `kind: 'matches'` carries none, because it runs a
 * different query. Making that a union rather than an optional `where` is what
 * turns "handed the matches view to `diaryEntries`" into a compile error instead
 * of a query that silently returns the whole diary.
 */
export type DiaryView =
  | (DiaryViewBase & { kind: 'entries'; where: Prisma.JudgementWhereInput })
  | (DiaryViewBase & { kind: 'matches' })

/** The kinds, named, so `diary.ts` can require one without restating the union. */
export type EntriesView = Extract<DiaryView, { kind: 'entries' }>

/**
 * In the order the design draws them, and `all` is first because it is the
 * default — `parseView` falls back to whatever is at index 0.
 *
 * `notes` is `{ not: null }` and nothing else: `setNote` stores a cleared note
 * as no judgement or as a null column, never as an empty string, so null is the
 * whole of the test. The same reading `seasonTotals` takes.
 *
 * **There were five.** MVPs, Standouts and Flops were each a tag filter, and two
 * of them narrowed nothing — a standout or a flop is a large fraction of a
 * diary, so filtering to one leaves a list the same size and the same shape as
 * the one you were already failing to read. MVP was the selective one, and it is
 * on the match row now: a match has at most one MVP across both squads, so the
 * MVP is a fact about the match rather than a slice of the diary.
 */
export const DIARY_VIEWS: readonly DiaryView[] = [
  {
    slug: 'all',
    label: 'All',
    kind: 'entries',
    empty: 'Nothing here yet. Start after the next match.',
    where: {},
  },
  {
    slug: 'matches',
    label: 'Matches',
    kind: 'matches',
    // Its own sentence rather than `all`'s, so a reader with plenty written is
    // never told the diary is empty — the rule that every view owns its own
    // empty state.
    empty: 'No matches yet. Start after the next match.',
  },
  {
    slug: 'notes',
    label: 'With notes',
    kind: 'entries',
    empty: 'No notes this season.',
    where: { note: { not: null } },
  },
]

/**
 * Which view a URL asked for, defaulting to All.
 *
 * `unknown` rather than `string`, because this is handed the raw value out of
 * `searchParams` — which is `string | string[] | undefined`, an array whenever
 * the parameter is repeated. Anything unrecognised falls back rather than
 * refusing: a mistyped query string should show the diary, not an error page.
 * That is also what happens to `?view=mvp` and `?view=flop`, which were real
 * slugs until the five views became three — an old bookmark opens the diary
 * rather than breaking.
 */
export function parseView(value: unknown): DiaryView {
  const slug = Array.isArray(value) ? value[0] : value
  return DIARY_VIEWS.find((view) => view.slug === slug) ?? DIARY_VIEWS[0]
}

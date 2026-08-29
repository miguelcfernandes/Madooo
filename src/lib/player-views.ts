/**
 * The tabs on a player profile — Diary, Notes and Teams of the week — and the
 * only place they are written down.
 *
 * The same table as [`diary-views.ts`](./diary-views.ts), for the same reasons:
 * one list read by the tab strip, the empty state and the query, so a slug
 * cannot exist in the URL that nothing knows how to query. Pure, so `parseView`
 * — which reads an untrusted URL parameter — is testable without Prisma in the
 * loop.
 *
 * **Views rather than filters, which is the diary's word and now this file's
 * too.** Two of the three narrow the list of judgements written about a player;
 * `elevens` replaces it with a different list altogether — the teams of the week
 * he was picked for — and has no `JudgementWhereInput` to contribute. That is
 * the union below, and the discriminant is load-bearing for the same reason it
 * is there: handing the elevens view to `playerEntries` is a compile error
 * rather than a query that silently returns everything.
 */

import type { Prisma } from '../generated/prisma/client'

/** What every view carries, whichever kind it is. */
interface PlayerViewBase {
  /** What appears in the URL: `/players/44?view=notes`. */
  slug: string
  label: string
  /** What the list says when this view holds nothing. */
  empty: string
}

export type PlayerView =
  | (PlayerViewBase & { kind: 'entries'; where: Prisma.JudgementWhereInput })
  | (PlayerViewBase & { kind: 'elevens' })

/** The kind, named, so `players.ts` can require one without restating the union. */
export type EntriesView = Extract<PlayerView, { kind: 'entries' }>

/**
 * In the order the design draws them, and `diary` is first because it is the
 * default — `parseView` falls back to whatever is at index 0.
 *
 * `notes` is `{ not: null }` and nothing else, the same reading the diary's own
 * filter takes: `setNote` stores a cleared note as no judgement or as a null
 * column, never as an empty string.
 *
 * **`elevens` is last, and it is the only tab in the app that is not always
 * drawn.** Almost nobody is in a team of the week, so a tab that was always
 * there would be an empty room on nearly every profile — see the page, which
 * offers it only when there is something behind it.
 *
 * **It is spelled out here where the sidebar abbreviates it**, and the
 * difference is the space each has. TOTW earns its four letters in a 232px
 * navigation row a reader passes every day; a tab strip has the width, and this
 * one is read by somebody who has arrived on a player rather than by somebody
 * who lives in the app. The slug is `elevens` for the same reason — a URL is
 * read by people.
 */
const DIARY: EntriesView = {
  slug: 'diary',
  label: 'Diary',
  kind: 'entries',
  empty: 'Nothing recorded about this player yet.',
  where: {},
}

export const PLAYER_VIEWS: readonly PlayerView[] = [
  DIARY,
  {
    slug: 'notes',
    label: 'Notes',
    kind: 'entries',
    empty: 'No notes on this player yet.',
    where: { note: { not: null } },
  },
  {
    slug: 'elevens',
    label: 'Teams of the week',
    kind: 'elevens',
    // Reachable only by falling back into it, since the tab is drawn only when
    // there is something behind it. Written anyway: a view that owns no empty
    // state is a view that borrows somebody else's.
    empty: 'This player is in none of your teams of the week.',
  },
]

/**
 * The view an entries query falls back to, typed as an `EntriesView` rather than
 * as a member of the union.
 *
 * It is the same object as `PLAYER_VIEWS[0]`, named separately only so it can
 * carry the narrower type: the profile hands it to `playerEntries` when the URL
 * asked for a tab that reads no entries, and taking it out of the table there
 * would need a narrowing dance to prove it has a `where` at all.
 */
export const DEFAULT_ENTRIES_VIEW = DIARY

/**
 * Which view a URL asked for, defaulting to the diary.
 *
 * `unknown` rather than `string`, because this is the raw value out of
 * `searchParams`. Anything unrecognised falls back rather than refusing: a
 * mistyped query string should show the profile, not an error page.
 *
 * **`offered` is what makes the conditional tab safe.** The elevens view exists
 * in the table for every player and is *drawn* for very few, so a stale
 * `?view=elevens` has to land somewhere — and the answer is the same one
 * `parseLeagues` and `back.ts` give: what survives is what could have been
 * offered. The page passes the tabs it is actually drawing; the default is the
 * whole table, for callers that have not asked the question yet.
 */
export function parseView(
  value: unknown,
  offered: readonly PlayerView[] = PLAYER_VIEWS,
): PlayerView {
  const slug = Array.isArray(value) ? value[0] : value
  return offered.find((view) => view.slug === slug) ?? offered[0] ?? PLAYER_VIEWS[0]
}

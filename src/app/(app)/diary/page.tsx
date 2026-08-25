import type { ReactNode } from 'react'
import { requireDbUser } from '@/lib/auth'
import { groupByMonth } from '@/lib/dates'
import { diaryEntries, diaryMatches, diaryTotals } from '@/lib/diary'
import { DIARY_VIEWS, parseView } from '@/lib/diary-views'
import { season } from '@/lib/env'
import { DiaryEntry } from '@/components/diary-entry'
import { DiaryMatchRow } from '@/components/diary-match-row'
import { DiaryTabs } from '@/components/diary-tabs'
import { PageHeader } from '@/components/page-header'
import { DIARY_TILES, StatTiles } from '@/components/stat-tiles'

/**
 * Render on every request rather than once during `next build`, for the same
 * reason `/fixtures` does: a prerendered diary would freeze whatever the
 * database held when the deployment was built.
 */
export const dynamic = 'force-dynamic'

/**
 * One row of either list, reduced to the two things the page itself needs: the
 * date it files under, and what to draw. The React key is set on the node where
 * it is built, since only that branch knows which id is stable.
 *
 * **Why the two lists converge here rather than in two return statements.** They
 * share everything around the rows — the header, the tiles, the tabs, the month
 * sections with their rule and count chip — and differ only in what a row is and
 * which date it is filed by. Branching the whole return would have duplicated
 * that shell so the duplicate could drift; branching into this shape leaves one
 * of each. Passing the differing part as a node is the move `JudgementEntry`
 * already makes with its `children` slot.
 */
type DiaryRow = { date: Date; node: ReactNode }

/**
 * The diary: what this user has recorded, newest first, cut into calendar
 * months.
 *
 * Three views, in [`diary-views.ts`](../../../lib/diary-views.ts). Two list
 * judgements — everything, or only what carries a note — dated by when they were
 * written. The third lists matches, dated by kickoff, and exists because a
 * reader could not find a match in a list where one match is eight rows.
 *
 * The chosen view lives in the URL — `/diary?view=matches` — which is what keeps
 * this a server component with no JavaScript of its own.
 */
export default async function Diary({ searchParams }: PageProps<'/diary'>) {
  const currentSeason = season()
  const { view } = await searchParams
  const current = parseView(view)

  // A diary belongs to one user, so both reads below need our own `User.id`.
  // The upsert behind this is memoised per request and the shell layout already
  // calls it, so it costs one indexed lookup.
  const user = await requireDbUser()

  // Where a player profile opened from here sends the reader back — the view
  // included, so Back returns to the diary they actually left. Only the two
  // entry views build one; a match row links to the match, which needs none.
  const from = current.slug === DIARY_VIEWS[0].slug ? '/diary' : `/diary?view=${current.slug}`

  // The tiles are season-wide and deaf to the view, so they go out alongside
  // whichever list ran rather than after it: the page waits for the slower of
  // the two rather than for the sum.
  const [totals, rows] = await Promise.all([
    diaryTotals(currentSeason, user.id),
    current.kind === 'matches'
      ? diaryMatches(currentSeason, user.id).then((matches): DiaryRow[] =>
          matches.map((match) => ({
            date: match.kickoff,
            node: <DiaryMatchRow key={match.id} match={match} />,
          })),
        )
      : diaryEntries(currentSeason, user.id, current).then((entries): DiaryRow[] =>
          entries.map((entry) => ({
            date: entry.createdAt,
            node: <DiaryEntry key={entry.id} entry={entry} from={from} />,
          })),
        ),
  ])

  // Postgres already sorted them; this only cuts the run into months. See
  // `groupByMonth` for why it must not sort.
  const months = groupByMonth(rows, (row) => row.date)

  return (
    <>
      {/* Not "every verdict": a
          note with no tag is an entry here too, and it is not a verdict. */}
      <PageHeader title="Diary">
        Everything you have written this season, newest first.
      </PageHeader>

      <StatTiles tiles={DIARY_TILES} totals={totals} />
      <DiaryTabs current={current} />

      {months.length === 0 ? (
        // Each view carries its own sentence, so "no notes" does not read as
        // "no diary" to someone who has written plenty.
        <p className="text-body text-muted">{current.empty}</p>
      ) : (
        months.map((month) => (
          <section key={month.label} className="mb-8 last:mb-0">
            {/* The heading row: the month, a rule taking whatever width is
                left, and the count of what is shown under it. The count follows
                the view because it counts the list; the tiles above do not,
                because they count the season. */}
            <div className="flex items-center gap-3">
              <h2 className="text-caps text-muted">{month.label}</h2>
              {/* Decorative, so it is a bare span rather than an <hr>, which
                  would announce itself as a thematic break between two things
                  that are one thing. A border rather than a 1px filled box: the
                  border is foundations' primary separator, and `--border-w` is
                  the token that says how thick a hairline is. */}
              <span className="flex-1 border-t border-border" />
              {/* `--surface-alt` would be invisible against `--page` in light,
                  which is the same value; one step further down the ramp is the
                  quiet fill this needs. */}
              <span className="bg-surface-sunken px-1.5 py-0.5 text-data text-muted">
                {month.items.length}
              </span>
            </div>

            <ul className="divide-y divide-border border-b border-border">
              {month.items.map((row) => row.node)}
            </ul>
          </section>
        ))
      )}
    </>
  )
}

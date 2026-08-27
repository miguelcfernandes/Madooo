import { PageHeader } from '@/components/page-header'
import { CHANGELOG, type ChangelogEntry } from '@/lib/changelog'
import { entryDate, groupByMonth } from '@/lib/dates'

/**
 * What has changed in the app, newest first, cut into calendar months.
 *
 * **The one route under `(app)` that is not `force-dynamic`**, and the only one
 * that could be: it reads no database, no session and no search parameters, so
 * there is nothing for a per-request render to discover. `layout.tsx` reads
 * nothing either, so Next prerenders this at build time and serves it from the
 * CDN. That is not a micro-optimisation, it is the shape of the thing — the
 * entries are a module in the repository, so the build is exactly the moment
 * they are known, and they cannot change again until the next deploy.
 *
 * Two consequences worth having in view. It carries **no `loading.tsx`**, and
 * needs none: `architecture.md` records that a *dynamic* route is not prefetched
 * without one, and a static route prefetches whole — `(app)/loading.tsx` is
 * still there as the group's fallback if this ever grows a read. And it is
 * still behind the login, because the guard is `proxy.ts`, which runs on the
 * request whether or not the response was prerendered. A route added under
 * `(app)` has to be listed there by hand or it ships unprotected.
 */
export default function ChangelogPage() {
  // Already newest-first in the module, which `changelog.test.ts` asserts —
  // `groupByMonth` preserves the order it is handed and never imposes one.
  const months = groupByMonth(CHANGELOG, (entry) => entry.date)

  return (
    <>
      <PageHeader title="What&rsquo;s new">
        What has changed in the app, newest first.
      </PageHeader>

      {months.map((month) => (
        <section key={month.label} className="mb-8 last:mb-0">
          {/*
            The diary's month heading, less its count. There the number tells you
            how much of your own season is in the month below it, which is a
            finding about the reader; here it would count how many things the
            author shipped in August, which is a fact about nobody who is
            reading. The rule stays: it separates the heading from the list
            without drawing a second horizontal line across the page.
          */}
          <div className="flex items-center gap-3">
            <h2 className="text-caps text-muted">{month.label}</h2>
            <span className="flex-1 border-t border-border" />
          </div>

          <ul className="divide-y divide-border border-b border-border">
            {month.items.map((entry) => (
              <Entry key={`${entry.date.toISOString()}-${entry.title}`} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

/**
 * One entry.
 *
 * **`JudgementEntry`'s geometry without `JudgementEntry`.** The two rows are the
 * same object at a glance — a monospaced date in a left column, what happened in
 * the right, stacking to one column below `md` where 85px of date leaves too
 * little beside it — and the shared grid is deliberate. What is not shared is
 * the component: that one is typed to a verdict, carries a badge, and draws a
 * sentence when there is no note. None of the three has a meaning here, and
 * three optional props to suppress them would make a changelog row a special
 * case of a judgement, which it is not.
 *
 * Local to this page rather than a file in `components/`, because it has one
 * caller. `SiteFooter` on the landing page is the same shape.
 */
function Entry({ entry }: { entry: ChangelogEntry }) {
  return (
    <li className="flex flex-col gap-2 py-4 md:grid md:grid-cols-[auto_1fr] md:gap-x-6 md:gap-y-0">
      {/* A date is counted, not spoken, so it is monospaced — and uppercased in
          CSS, as every date in the app is. */}
      <span className="text-data uppercase text-muted">{entryDate(entry.date)}</span>

      <div>
        <p className="text-body text-text">{entry.title}</p>

        {/*
          Muted and one step down the scale, which is the whole of the hierarchy:
          the headline carries the news and this only qualifies it. Foundations
          keeps `--text-caption` for exactly this — a sub-label under something
          that has already been said.
        */}
        {entry.note === undefined ? null : (
          <p className="mt-1 text-caption text-muted">{entry.note}</p>
        )}

        {/* Never links. None of these is a destination, and a name that is not
            a link is what this system draws in grey. No `list-none` — the base
            layer already resets it. */}
        {entry.items === undefined ? null : (
          <ul className="mt-1 flex flex-col gap-0.5">
            {entry.items.map((item) => (
              <li key={item} className="text-caption text-muted">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

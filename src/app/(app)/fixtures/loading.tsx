import { Skeleton, SkeletonBox, SkeletonHeader, SkeletonLine, SkeletonTiles } from '@/components/skeleton'

/**
 * `/fixtures` while its queries run.
 *
 * The screen this stands in for is a header, the four season tiles, the day
 * pager, and a card per fixture under a heading per competition — so this is the
 * same four things, drawn as blocks in the same containers.
 *
 * **One league section, and six cards under it.** Both numbers are drawings
 * rather than predictions, and neither is knowable: a skeleton renders before
 * anything has been asked, and how many competitions play on a given day is
 * exactly what the query is for — a Saturday has four and a Tuesday in June has
 * none. `/diary` draws one month group for the same reason. Six cards fills a
 * first screen at desktop height without running so far past a quiet day that
 * the list visibly shortens when the real cards arrive.
 */
export default function Loading() {
  return (
    <Skeleton>
      <SkeletonHeader />
      <SkeletonTiles />

      {/* The day pager, in the wrapper `page.tsx` gives it — centred below
          `sm`, hard left from there up. One block for the whole control rather
          than three for its arrows and label: the arrows are chrome and the
          reader is not waiting to read them. */}
      <div className="mb-6 flex justify-center sm:justify-start">
        <SkeletonBox className="h-11 w-64" />
      </div>

      {/* The league heading: the competition, a rule taking whatever width is
          left, and the count in its own sunken chip. The rule is drawn for real
          rather than as a grey block — it is chrome, not content. */}
      <div className="mb-3 flex items-center gap-3">
        <SkeletonLine className="text-caps w-36" />
        <span className="flex-1 border-t border-border" />
        <SkeletonBox className="h-5 w-6 rounded-sm" />
      </div>

      <ul className="flex flex-col gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}>
            {/* `FixtureCard`'s three bands: the venue strip, the two clubs
                either side of the score, and the tally footer. Each keeps the
                card's own background so the skeleton reads as the same object
                rather than as a grey rectangle. */}
            <article className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="flex items-center justify-between gap-4 bg-surface-header px-4 py-2">
                <SkeletonLine className="text-caps w-40" />
                <SkeletonLine className="text-caps w-20" />
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBox className="size-8 shrink-0" />
                  <SkeletonLine className="text-label md:text-heading w-full max-w-32" />
                </div>
                <SkeletonBox className="h-8 w-12" />
                <div className="flex min-w-0 items-center justify-end gap-3">
                  <SkeletonLine className="text-label md:text-heading w-full max-w-32" />
                  <SkeletonBox className="size-8 shrink-0" />
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-border bg-surface-alt px-4 py-2">
                <SkeletonLine className="text-caption w-20" />
                <SkeletonLine className="text-caption w-16" />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </Skeleton>
  )
}

import { Skeleton, SkeletonBox, SkeletonHeader, SkeletonLine, SkeletonTiles } from '@/components/skeleton'

/**
 * `/fixtures` while its queries run.
 *
 * The screen this stands in for is a header, the four season tiles, the day
 * pager, and one bordered block per competition with a row per fixture inside it
 * — so this is the same four things, drawn as blocks in the same containers.
 *
 * **One league block, and six rows in it.** Both numbers are drawings rather
 * than predictions, and neither is knowable: a skeleton renders before anything
 * has been asked, and how many competitions play on a given day is exactly what
 * the query is for — a Saturday has seven and a Tuesday in June has none.
 * `/diary` draws one month group for the same reason. Six rows fills a first
 * screen at desktop height without running so far past a quiet day that the list
 * visibly shortens when the real rows arrive.
 *
 * **It follows the rows rather than the card it replaced**, which is the whole
 * reason this file changed with `page.tsx`. A skeleton shaped like the old
 * three-band card would have flashed a different layout than the one that
 * arrived — the failure a skeleton exists to prevent.
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

      <section className="border border-border bg-surface">
        {/* The block header: the competition, its round, and the count in its
            own sunken chip. The marine rule is drawn for real rather than as a
            grey block — it is the brand naming the block, not content the
            reader is waiting for. */}
        <div className="flex items-center gap-3 border-b-2 border-brand bg-surface-alt px-4 py-2">
          <SkeletonLine className="text-caps w-36" />
          <SkeletonLine className="text-caps w-20" />
          <span className="flex-1" />
          <SkeletonBox className="h-5 w-6" />
        </div>

        <ul className="divide-y divide-border">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              {/* A row's four parts: the kickoff in the left margin, the two
                  clubs either side of the centre slot, and the right margin —
                  which is left undrawn, because it is empty on most real rows
                  and a skeleton that promised something there would be
                  promising the reader a tally they mostly do not have. */}
              <div className="flex min-h-(--row-h-lg) items-center gap-4 px-4 py-2">
                <SkeletonLine className="text-data w-12 shrink-0" />

                <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <SkeletonBox className="size-5 shrink-0" />
                    <SkeletonLine className="text-label w-full max-w-32" />
                  </div>
                  <SkeletonBox className="h-6 w-10" />
                  <div className="flex min-w-0 items-center justify-end gap-2">
                    <SkeletonLine className="text-label w-full max-w-32" />
                    <SkeletonBox className="size-5 shrink-0" />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Skeleton>
  )
}

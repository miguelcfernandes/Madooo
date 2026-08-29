import { Skeleton, SkeletonBox, SkeletonHeader, SkeletonLine } from '@/components/skeleton'

/**
 * The list of saved elevens while its one query runs.
 *
 * A header, the filled button that starts a new one, and the grid of pitches.
 * **Three cards at 4-3-3**, which is the fallback's one unavoidable guess: how
 * many elevens a reader has and what shape each stood in are both unknowable
 * before the read, and a grid drawn empty says nothing while it waits. The
 * columns and the geometry inside a card are copied from the page rather than
 * approximated, so what moves when this is replaced is a count and never a
 * layout.
 */
export default function Loading() {
  return (
    <Skeleton>
      <SkeletonHeader />

      {/* The button's own height and the `mb-8` under it, copied from the page. */}
      <div className="mb-8">
        <SkeletonBox className="h-(--control-h-lg) w-40" />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, card) => (
          <li key={card} className="border border-border bg-surface">
            <div className="flex items-center justify-between gap-3 border-b-2 border-brand bg-surface-alt px-4 py-2">
              <SkeletonLine className="text-label w-28" />
              <SkeletonLine className="text-data w-10" />
            </div>
            <div className="flex flex-col gap-6 bg-surface-sunken px-2 py-6 sm:px-4 md:px-8">
              {[3, 3, 4, 1].map((across, line) => (
                <div key={line} className="flex items-start justify-center gap-1 sm:gap-2">
                  {Array.from({ length: across }, (_, place) => (
                    <span
                      key={place}
                      className="flex min-w-0 max-w-20 flex-1 flex-col items-center gap-1"
                    >
                      <SkeletonBox className="size-10" />
                      <SkeletonBox className="h-9 w-12" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
            {/* The footer strip: the span it covers, and the competitions. */}
            <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2">
              <SkeletonLine className="text-caption w-20" />
              <SkeletonBox className="h-3 w-16" />
            </div>
          </li>
        ))}
      </ul>
    </Skeleton>
  )
}

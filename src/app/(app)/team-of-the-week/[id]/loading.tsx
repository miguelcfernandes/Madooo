import { Skeleton, SkeletonBox, SkeletonHeader, SkeletonLine } from '@/components/skeleton'

/**
 * One saved eleven while it is read.
 *
 * **The pitch is drawn at 4-3-3 and the real one may be any of six shapes**, so
 * this is the one fallback in the app that cannot promise its geometry. The
 * alternative — an empty box the height of a pitch — moves further when it is
 * replaced, not less, and says nothing while it waits. The lines are in the
 * right places and the count in two of them may change.
 */
export default function Loading() {
  return (
    <Skeleton>
      <SkeletonHeader />

      <div className="border border-border bg-surface">
        {/* The name, and the formation opposite it. */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-brand bg-surface-alt px-4 py-2">
          <SkeletonLine className="text-label w-40" />
          <SkeletonLine className="text-data w-10" />
        </div>
        <div className="flex flex-col gap-6 bg-surface-sunken px-2 py-6 sm:px-4 md:px-8">
          {[3, 3, 4, 1].map((across, line) => (
            <div key={line} className="flex items-start justify-center gap-1 sm:gap-2">
              {Array.from({ length: across }, (_, place) => (
                <span key={place} className="flex min-w-0 max-w-20 flex-1 flex-col items-center gap-1">
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
      </div>

      <div className="mt-8 border border-border bg-surface">
        <div className="border-b-2 border-brand bg-surface-alt px-4 py-2">
          <SkeletonLine className="text-caps w-24" />
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: 11 }, (_, i) => (
            <li
              key={i}
              className="grid min-h-(--row-h-lg) grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2"
            >
              <SkeletonBox className="h-5 w-9" />
              <span className="min-w-0">
                <SkeletonLine className="text-body w-40" />
                <SkeletonLine className="text-caption mt-1 w-48" />
              </span>
              <SkeletonBox className="h-7 w-20" />
            </li>
          ))}
        </ul>
      </div>
    </Skeleton>
  )
}

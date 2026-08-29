import { Skeleton, SkeletonBox, SkeletonHeader, SkeletonLine } from '@/components/skeleton'

/**
 * The builder while the pool is read.
 *
 * The span form, then the two columns: the pitch on the left and the four pool
 * blocks on the right. The pitch's four lines are drawn at the default
 * formation's shape, because that is what the builder opens on — a fallback
 * showing a different number of places would move the moment it was replaced.
 */
export default function Loading() {
  return (
    <Skeleton>
      <SkeletonHeader />

      {/* `TotwRangeForm`: a block header, two date fields, a row of
          competitions, and the submit. */}
      <div className="mb-6 border border-border bg-surface">
        <div className="border-b-2 border-brand bg-surface-alt px-4 py-2">
          <SkeletonLine className="text-caps w-20" />
        </div>
        <div className="flex flex-col gap-5 px-4 py-4">
          <div className="flex flex-wrap gap-4">
            <SkeletonBox className="h-(--control-h-lg) w-40" />
            <SkeletonBox className="h-(--control-h-lg) w-40" />
          </div>
          {/* `TotwLeaguePicker`: the label and its two bulk buttons, then the
              two groups — five top competitions and two others. */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SkeletonLine className="text-caps w-24" />
              <span className="flex gap-2">
                <SkeletonBox className="h-(--control-h) w-20" />
                <SkeletonBox className="h-(--control-h) w-14" />
              </span>
            </div>
            {[5, 2].map((count, group) => (
              <div key={group} className="flex flex-col gap-3">
                <SkeletonLine className="text-caption w-28" />
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {Array.from({ length: count }, (_, i) => (
                    <SkeletonBox key={i} className="h-4 w-32" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <SkeletonBox className="h-(--control-h-lg) w-32" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonBox className="h-(--control-h-lg) w-28" />
            <SkeletonLine className="text-data w-20" />
            <SkeletonBox className="ml-auto h-(--control-h-lg) w-36" />
          </div>

          <div className="border border-border bg-surface">
            <div className="border-b-2 border-brand bg-surface-alt px-4 py-2">
              <SkeletonLine className="text-label w-28" />
            </div>
            {/* 4-3-3, the default formation, drawn top down: three forwards,
                three midfielders, four defenders, a keeper. */}
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
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, block) => (
            <div key={block} className="border border-border bg-surface">
              <div className="flex items-center justify-between border-b-2 border-brand bg-surface-alt px-4 py-2">
                <SkeletonLine className="text-caps w-24" />
                <SkeletonLine className="text-data w-8" />
              </div>
              <ul className="divide-y divide-border">
                {Array.from({ length: 3 }, (_, row) => (
                  <li
                    key={row}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2"
                  >
                    <SkeletonBox className="h-5 w-9" />
                    <span className="min-w-0">
                      <SkeletonLine className="text-body w-32" />
                      <SkeletonLine className="text-caption mt-1 w-40" />
                    </span>
                    <SkeletonBox className="h-7 w-20" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Skeleton>
  )
}

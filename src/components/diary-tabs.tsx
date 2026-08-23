import { DIARY_FILTERS, type DiaryFilter } from '@/lib/diary-filters'
import { TabStrip } from './tab-strip'

/**
 * The diary's filter row: All, MVPs, Standouts, Flops, With notes.
 *
 * **The selected filter lives in the URL**, and that one choice is what keeps
 * `/diary` a server component — the same reasoning as the fixtures page's day
 * pager. These are links, no JavaScript ships, and a filtered diary can be
 * bookmarked and reached with the back button.
 *
 * The drawing is [`tab-strip.tsx`](./tab-strip.tsx)'s, which 7.2 introduced and
 * this row moved onto: these choose which entries the diary shows, which is the
 * underline tab's job. The pill it used to wear belonged to the league row on
 * `/fixtures`, where the choice was which competition the screen was drawn for;
 * nothing draws a pill tab now that the page is indexed by day.
 */
export function DiaryTabs({ current }: { current: DiaryFilter }) {
  return (
    <TabStrip
      label="Filter"
      tabs={DIARY_FILTERS.map((filter) => ({
        href: `/diary?filter=${filter.slug}`,
        label: filter.label,
        current: filter.slug === current.slug,
      }))}
    />
  )
}

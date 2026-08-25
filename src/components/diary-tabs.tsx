import { DIARY_VIEWS, type DiaryView } from '@/lib/diary-views'
import { TabStrip } from './tab-strip'

/**
 * The diary's view row: All, Matches, With notes.
 *
 * **The selected view lives in the URL**, and that one choice is what keeps
 * `/diary` a server component — the same reasoning as the fixtures page's day
 * pager. These are links, no JavaScript ships, and a chosen view can be
 * bookmarked and reached with the back button.
 *
 * The drawing is [`tab-strip.tsx`](./tab-strip.tsx)'s, which 7.2 introduced and
 * this row moved onto: these choose what the diary shows, which is the underline
 * tab's job. The pill it used to wear belonged to the league row on `/fixtures`,
 * where the choice was which competition the screen was drawn for — and the
 * rebrand retired the pill outright, so the underline is now the only tab this
 * design has.
 *
 * There were five, and three of them were tag filters. Why they went is in
 * [`diary-views.ts`](../lib/diary-views.ts), beside the table itself.
 */
export function DiaryTabs({ current }: { current: DiaryView }) {
  return (
    <TabStrip
      label="View"
      tabs={DIARY_VIEWS.map((view) => ({
        href: `/diary?view=${view.slug}`,
        label: view.label,
        current: view.slug === current.slug,
      }))}
    />
  )
}

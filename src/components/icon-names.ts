/**
 * The icon vocabulary, and the only place it is written down.
 *
 * `docs/design/foundations.md` fixes the set: Madooo's own glyphs, drawn to one
 * grammar, and nothing else. This array is both the type `<Icon>` accepts and
 * the list [`icon-sprite.tsx`](./icon-sprite.tsx) walks to build the sprite, so
 * the two cannot drift — a name here with no geometry in
 * [`icon-paths.tsx`](./icon-paths.tsx) is a compile error, and geometry with no
 * name is unreachable.
 *
 * **It was a subset request and is not any more.** Until the rebrand this array
 * was sent to Google's font API by `npm run icons`, which rejected an unsorted
 * list with a bare `400: Invalid selector`. That is gone along with the font.
 * The alphabetical order stays for a plainer reason: the icon board lists all
 * the vocabulary in `foundations.md` in this order, so the two can be read down
 * side by side.
 */
export const ICON_NAMES = [
  'add_comment',
  'arrow_forward',
  'article',
  'calendar_today',
  'check',
  'chevron_left',
  'chevron_right',
  'close',
  'dark_mode',
  'delete',
  'edit_note',
  'expand_more',
  'grid_view',
  'groups',
  'how_to_reg',
  'inbox',
  'light_mode',
  'lock_open',
  'menu',
  'more_horiz',
  'notifications',
  'search',
  'settings',
  'share',
  'sports',
  'sports_soccer',
  'stadium',
  'star',
  'trending_down',
  'trending_up',
  'trophy',
  'two_pager',
  'view_agenda',
  'view_list',
  'visibility',
] as const

/**
 * `as const` above makes the array readonly and narrows each element to its own
 * literal type rather than `string`, so this is a union of exactly the names
 * listed above and nothing else.
 * A typo in `<Icon name="stadiun" />` is then a compile error instead of a blank
 * square nobody notices until it ships.
 */
export type IconName = (typeof ICON_NAMES)[number]

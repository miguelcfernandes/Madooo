import { UserButton } from '@clerk/nextjs'
import { NavItem } from './nav-item'
import type { IconName } from './icon-names'

/**
 * The destinations, in the order the design puts them. Fixtures is the app's
 * front door; Players, Teams and Diary followed in step 7.
 *
 * **`trophy` rather than a new glyph.** Foundations is firm that a screen
 * needing a mark the set does not have should get a new drawing rather than the
 * nearest existing one, because a near-miss teaches the wrong word — and this
 * was checked against that bar rather than assumed past it. A team of the week
 * is an *award the reader gives out*, which is what a trophy means; the glyph
 * was in the set and drawn by nobody, and the meaning was not absent.
 *
 * **TOTW is the app's only abbreviated nav label**, at the author's request, and
 * it is the one place a row here is not simply the name of the screen it opens.
 * It buys the row back the width that "Team of the week" spent, and it is what
 * the thing is called by the people who use it. It costs an `sr-only`
 * expansion: four letters read aloud are four letters, and the accessible name
 * still opens with the visible one, which is what WCAG's label-in-name rule
 * asks.
 */
const DESTINATIONS: { href: string; icon: IconName; label: React.ReactNode }[] = [
  { href: '/fixtures', icon: 'view_agenda', label: 'Fixtures' },
  { href: '/players', icon: 'groups', label: 'Players' },
  { href: '/teams', icon: 'stadium', label: 'Teams' },
  {
    href: '/team-of-the-week',
    icon: 'trophy',
    label: (
      <>
        TOTW<span className="sr-only"> — team of the week</span>
      </>
    ),
  },
  { href: '/diary', icon: 'two_pager', label: 'Diary' },
]

export function Sidebar() {
  return (
    /*
      Placement is not this component's job — `AppFrame` decides whether it is a
      grid column or an off-canvas drawer, and owns the classes that say so. What
      stays here is what the sidebar *is* at any width: 232px wide, full height,
      a column, and separated from the content by a border.

      `--sidebar-w` is fixed on purpose and does not scale with the viewport. A
      sidebar's width is set by what is in it; a fluid one would be dead space on
      a wide screen and would truncate its own labels on a narrow one.
    */
    <aside className="flex h-full w-(--sidebar-w) flex-col border-r border-border bg-surface">
      {/* The wordmark sits at exactly the top bar's height, so the two line up
          across the sidebar's border. */}
      <div className="flex h-(--rail-w) shrink-0 items-center px-5">
        <span className="text-wordmark">Madooo</span>
      </div>

      {/* px-2 here plus px-3 on each item puts the icons 20px in, level with the
          wordmark above, while leaving the active row's fill inset from the
          sidebar's edge rather than running into it. */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="flex flex-col gap-1">
          {DESTINATIONS.map(({ href, icon, label }) => (
            <li key={href}>
              <NavItem href={href} icon={icon}>
                {label}
              </NavItem>
            </li>
          ))}
        </ul>
      </nav>

      {/*
        The signed-in identity, moved here out of the old dashboard header.

        This is Clerk's own component rather than our markup, which is a
        deliberate trade: it carries the account menu, and that menu is the only
        way to sign out. `appearance.elements` takes ordinary class names — ours
        win over Clerk's because `cssLayerName` puts Clerk in a layer below the
        utilities layer — so the name can be given the app's type even though the
        markup around it is not ours.

        Known mismatch with `foundations.md`, and left as it is on purpose: the
        avatar is the Google profile photo, or a coloured gradient when there is
        none, and the design forbids both photography and gradients.
      */}
      <div className="shrink-0 border-t border-border p-3">
        <UserButton
          showName
          appearance={{
            elements: {
              userButtonBox: 'w-full gap-3',
              userButtonTrigger: 'w-full px-2 py-1.5 focus-visible:focus-ring',
              // Clerk puts the name before the avatar in the DOM and offers no
              // prop to swap them. `flex-direction` is not the lever: Clerk's
              // own generated class sets it and wins the cascade, even though
              // our type utilities on the same element land. `order` is
              // untouched by Clerk, so nothing competes with it.
              userButtonOuterIdentifier: 'order-2 text-body text-text',
              userButtonAvatarBox: 'order-1 size-7',
            },
          }}
        />
      </div>
    </aside>
  )
}

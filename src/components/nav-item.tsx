'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCloseDrawer } from './drawer-context'
import { Icon } from './icon'
import type { IconName } from './icon-names'

/**
 * `'use client'` marks this whole module as running in the browser as well as on
 * the server. Almost everything in this app is a server component — rendered
 * once, on the server, with no JavaScript shipped — but `usePathname` is a hook,
 * and hooks need React's client runtime.
 *
 * It has to be a hook: a layout is not re-rendered on client-side navigation and
 * is never told the current URL, so there is no server-side way for the sidebar
 * to know which of its four links is the live one.
 *
 * The directive is per-file and infectious downwards, which is why this is its
 * own small file rather than part of `sidebar.tsx` — keeping it narrow keeps the
 * sidebar itself, and the Clerk user button it holds, on the server.
 */

type Props = {
  href: string
  icon: IconName
  children: React.ReactNode
}

export function NavItem({ href, icon, children }: Props) {
  const pathname = usePathname()
  // A no-op above `md`, where the sidebar is a column and there is nothing open
  // to close. Below it, this is what dismisses the drawer on the way out.
  const closeDrawer = useCloseDrawer()

  // `startsWith` on purpose: /fixtures/12 is still Fixtures. The trailing slash
  // stops /fixtures matching a hypothetical /fixtures-archive.
  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      onClick={closeDrawer}
      // Read by screen readers as the current page, and the only part of the
      // active state that is not purely visual.
      aria-current={active ? 'page' : undefined}
      // `no-underline` because the base stylesheet gives every <a> the link
      // colour and a hover underline. That is right for prose and wrong for
      // chrome, so navigation opts out explicitly.
      // 44px below `md`, 36px from there up: `--row-h-lg` is foundations' touch
      // row, and a drawer opened by thumb is where it earns its place. Written
      // unprefixed-then-`md:` because Tailwind's variants are min-width only, so
      // the small-screen case is necessarily the one without a prefix.
      // Marine at 600 on --surface-alt is the active item — the second of the
      // three things the brand colour marks, "where you are". The weight
      // carries it too, so the state does not rest on colour alone.
      className={`t-hover flex h-(--row-h-lg) items-center gap-3 px-3 no-underline focus-visible:focus-ring md:h-(--row-h) ${
        active
          ? 'bg-surface-alt font-semibold text-brand'
          : 'text-muted hover:bg-surface-alt hover:text-text'
      }`}
    >
      {/* Not filled when active, which is a change the icon set brought with it.
          A filled glyph was the old set's way of saying "on"; here the marine
          and the weight say it, and filling `view_agenda` or `stadium` would
          put a solid black shape in a sidebar of line drawings. */}
      <Icon name={icon} />
      {children}
    </Link>
  )
}

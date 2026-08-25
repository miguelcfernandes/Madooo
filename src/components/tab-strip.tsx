import Link from 'next/link'

/**
 * The app's tab strip: switching the view of the screen you are already on.
 *
 * **The app's only tab, since the rebrand.** There used to be two vocabularies:
 * this 40px underline tab, which changes the *view* of the screen you are on —
 * the diary's filter, a player's Diary or Notes — and a 28px pill tab, which
 * chose the *scope* the screen was drawn for. The league row was the pill's only
 * instance and `/fixtures` retired it when the page became a day rather than a
 * league and a matchday; zero radius then retired the control itself, because a
 * pill in a system with no corners is a contradiction. The distinction it drew
 * outlives it and is recorded in `foundations.md`, against the `<select>` that
 * now carries scope.
 *
 * **The underline sits under the selected tab alone, with no rule spanning the
 * strip.** That is what
 * lets the strip wrap: a continuous rule under a strip that had wrapped would
 * underline only the last row, leaving the selected tab on the first row
 * detached from it. Wrapping rather than scrolling sideways is 7.1's decision,
 * kept — a horizontal scroller hides its own overflow.
 *
 * Which tab is on arrives as a prop rather than being read from the location,
 * because every caller has already parsed the parameter to run its query.
 * Asking again in a client hook would give the answer two sources.
 */

export type Tab = {
  href: string
  label: string
  current: boolean
}

export function TabStrip({ label, tabs }: { label: string; tabs: readonly Tab[] }) {
  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap items-center gap-x-6">
      {tabs.map((tab) =>
        tab.current ? (
          /*
            Not a link to the page you are already on. `aria-current` says what
            the underline says visually.

            Marine, and the label stays ink. The underline is one of the six
            places the brand colour is allowed — it says which view of this
            screen you are looking at, which is "where you are" exactly as the
            active nav item is. Colouring the word as well would make the tab
            compete with the nav item for the same signal.
          */
          <span
            key={tab.href}
            aria-current="page"
            className="inline-flex h-(--control-h-lg) items-center border-b-2 border-brand text-label text-text"
          >
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.href}
            href={tab.href}
            // Muted going to full ink on hover, foundations' rule for muted text.
            // `no-underline` in both states because the base stylesheet gives
            // every <a> the link colour and a hover underline, which is right for
            // prose and wrong for a tab — and here it would collide with the
            // selected tab's own underline.
            className="t-hover inline-flex h-(--control-h-lg) items-center border-b-2 border-transparent text-label text-muted no-underline hover:border-border-strong hover:text-text hover:no-underline focus-visible:focus-ring"
          >
            {tab.label}
          </Link>
        ),
      )}
    </nav>
  )
}

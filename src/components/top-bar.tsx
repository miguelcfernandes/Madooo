'use client'

import Link from 'next/link'

import { GITHUB_URL } from '@/lib/links'
import { GithubMark } from './github-mark'
import { Icon } from './icon'
import { SuggestionBox } from './suggestion-box'
import { ThemeToggle } from './theme-toggle'

type Props = {
  menuOpen: boolean
  onMenuClick: () => void
  /**
   * Forwarded to the menu button so `AppFrame` can return focus here when the
   * drawer closes. A `ref` is React's escape hatch to the real DOM node — the
   * one thing JSX otherwise keeps you away from — and since React 19 it is an
   * ordinary prop rather than something `forwardRef` has to wrap.
   */
  ref?: React.Ref<HTMLButtonElement>
}

/**
 * The top bar: the suggestion box, the changelog, the source link and the theme
 * toggle, and below `md` a menu button.
 *
 * The design puts a search field in here too, and it is deliberately not here:
 * search belongs to the screen that has something to search, next to the filters
 * it works with, which is where `/players` and `/teams` each carry their own.
 * The bar is doing work without it: it is the fixed boundary the content scrolls
 * under, and it holds the frame at the height the page's own controls line up to.
 *
 * The menu button is not in the design at all. It is here because the reference
 * images have no mobile state to have put it in, and it exists only below `md`,
 * where the sidebar has become a drawer and needs something to open it. Which
 * is why the right-hand group carries `ml-auto` rather than the header carrying
 * `justify-between`: at `md` and up the menu button is not there to be spaced
 * away from, and the group would drift to the left edge.
 *
 * The source link is the third thing in here, and the bar is where it is
 * precisely because it is *not* a destination. It sat at the sidebar's foot
 * first, borrowing `NavItem`'s row height, icon column and hover fill, and
 * read as a fifth place to go. Up here it is chrome among chrome, beside the
 * only other control that leaves the page alone.
 *
 * **The suggestion box is the fourth, and it is the only one carrying a label.**
 * The same argument puts it here — it opens a dialog, so it navigates nowhere —
 * but not the same treatment, because it is the one control in the bar that has
 * to be found by someone who was not looking for it. It also takes the left, so
 * the bar now has an occupant at both ends at every width; `ml-auto` on the
 * right-hand group, which existed for the menu button's sake below `md`, is
 * what keeps the two apart.
 *
 * **The changelog is the fifth, and it is the first thing in here that
 * navigates.** Everything above was argued into this bar for the same reason —
 * it leaves the page alone — and a `<Link>` to `/changelog` plainly does not.
 * The rule it keeps is the one underneath that: **the bar holds what is about
 * the app, and the sidebar holds what is about the football.** Fixtures,
 * Players, Teams and Diary are one loop and a fifth `<nav>` row would claim to
 * be part of it; a page saying what changed in the app belongs beside the
 * source link and the suggestion box, which is the reader's half of the same
 * conversation.
 *
 * It is a **bare glyph**, and that is the suggestion box's argument used the
 * other way. The label there is loud because it is the only run of words in the
 * bar; a second one would halve that for a control nobody needs to be ambushed
 * by. So this is chrome a reader goes looking for, like the theme and the
 * repository, and it carries its name in an `aria-label` as they do.
 */
export function TopBar({ menuOpen, onMenuClick, ref }: Props) {
  return (
    <header className="flex h-(--rail-w) items-center border-b border-border bg-surface px-2 md:px-5">
      <button
        ref={ref}
        type="button"
        onClick={onMenuClick}
        // `<Icon>` is always aria-hidden, because in this design every icon sits
        // beside a label that already says the same thing. This one does not, so
        // the control around it carries the name instead.
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
        className="t-hover flex size-(--control-h-lg) items-center justify-center text-muted hover:bg-surface-alt hover:text-text focus-visible:focus-ring md:hidden"
      >
        <Icon name={menuOpen ? 'close' : 'menu'} size="lg" />
      </button>

      <SuggestionBox />

      {/*
        `ml-auto` moved off the toggle and onto this group when the source link
        joined it: controls pinned right are the bar's arrangement to make, not
        something any one of them should assert about itself.

        `gap-0.5` rather than the usual `gap-2`. Every child is already a
        `--control-h-lg` box with its glyph centred inside, so the visible space
        between two marks is most of that box, and a full gap on top of it reads
        as unrelated controls instead of one cluster.

        The changelog leads the group: it is the only one of the three that stays
        inside the app, and the two that leave it — for another site, or for the
        other theme — sit together at the edge.
      */}
      <div className="ml-auto flex items-center gap-0.5">
        {/*
          A `<Link>`, so it prefetches and navigates without a document load
          like every other destination in the app. `no-underline` because the
          base stylesheet styles every `<a>` as prose, which is right for a
          sentence and wrong for a control — the same note the source link
          below carries.

          `article` is a **thirty-fifth glyph, drawn for this**. The set had
          no mark for it, and `notifications` shipped here first: a bell
          promises an alert, where this is a page you go and read. Since the
          rebrand our set is the authority rather than Material's, so a missing
          meaning is answered by drawing a glyph rather than by spending a near
          one. See `icon-paths.tsx` for the three drawings that lost.
        */}
        <Link
          href="/changelog"
          aria-label="What's new"
          className="t-hover flex size-(--control-h-lg) items-center justify-center text-muted no-underline hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
        >
          <Icon name="article" size="lg" />
        </Link>

        {/*
          20px, not the toggle's 22px. The mark is a solid silhouette where our
          own glyphs are a 1.75 stroke, so matching their box sizes puts far more
          ink on screen for the same nominal size — at 22px it read as the
          loudest thing in a bar that is meant to be quiet.

          The anchor carries the name, because `<GithubMark>` is `aria-hidden`
          and there is no visible label beside it to do the job. The same shape
          as the menu button above, and for the same reason.
        */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Source on GitHub"
          className="t-hover flex size-(--control-h-lg) items-center justify-center text-muted no-underline hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
        >
          <GithubMark className="size-5" />
        </a>

        <ThemeToggle />
      </div>
    </header>
  )
}

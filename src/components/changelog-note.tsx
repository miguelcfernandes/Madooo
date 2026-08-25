'use client'

import { Icon } from './icon'
import { CHANGELOG_NOTE_ID, CHANGELOG_STORAGE_KEY } from '@/lib/changelog'
import { usePreference, writePreference } from './use-preference'

/**
 * **TEMPORARY — a note at the foot of the sidebar saying what just changed.**
 *
 * Meant to be deleted rather than maintained. To remove it: delete this file and
 * the `<ChangelogNote />` in `sidebar.tsx`. Nothing else references it, and it
 * adds no token, no utility and no rule to the design.
 *
 * **It is the app's own block, not a new kind of object**: a bordered card with
 * a `--surface-alt` strip under a 2px marine rule, which is what `SquadPanel`,
 * `VerdictSplit` and every browser header already are. That matters for the
 * colour rule — a block header's bottom rule is one of marine's permitted
 * places, "the brand naming something", so this borrows a category rather than
 * inventing one. The padding drops from the usual `px-4` to `px-3` because the
 * sidebar is 232px wide, not because the block is different.
 *
 * **The card carries its own border and the wrapper carries none.** A rule above
 * it as well would draw two lines a few pixels apart — the sidebar's own divider
 * and the card's top edge — which reads as a mistake rather than as structure.
 * The one divider left in this column is the account block's, which was there
 * before this note and will be there after it.
 *
 * **Dismissal takes two mechanisms, and it needs both.**
 *
 * `usePreference` is the React half: it removes the note from the DOM once the
 * browser's storage has been read. But that hook takes a separate server
 * snapshot by design, so its *first* client render always shows the default —
 * which for this component means a dismissed note painting to the screen and
 * then vanishing. Invisible for a preference that reorders a list. Not invisible
 * at all for one that decides whether an element exists: it read as a bug, and
 * was reported as one.
 *
 * So `CHANGELOG_INIT_SCRIPT` in [`changelog.ts`](../lib/changelog.ts) is the
 * other half — the theme toggle's trick, which is the only thing in this
 * codebase that settles a stored preference before the browser paints. It marks
 * `<html>` during head parsing and the `.changelog-note` rule in `globals.css`
 * does the hiding, so the element never gets a frame on screen. React then
 * catches up and removes it for real.
 *
 * The class on the wrapper is what that rule targets, and it is on the *wrapper*
 * rather than the card: hiding the card alone would leave its `p-3` behind as a
 * band of empty sidebar.
 */

/**
 * **Everything this branch adds over what is deployed**, in three entries.
 *
 * **The label carries the news and the detail stays a short phrase.** A note in
 * a 232px column is a list of headlines, not a set of release notes — somebody
 * reading it wants to know what changed, and the app itself is the explanation.
 * Anything that needs a sentence to justify it belongs in the roadmap.
 *
 * Two things are deliberately folded in rather than given lines of their own.
 * The **app icon** is the same identity arriving on the tab and the home screen.
 * The **dark theme** is part of the new look by definition — it is the same
 * palette seen the other way round, and splitting it implies the two were
 * separate pieces of work to a reader who does not care that they were.
 *
 * Ordered by what a reader notices first rather than by when it landed.
 *
 * **`items` and `note` are separate on purpose.** `items` is a list of names and
 * renders as one — three leagues are three things. `note` is a phrase and
 * renders as a paragraph, so it wraps to the column instead of being hand-broken
 * into fake list rows at whatever width the sidebar happened to be.
 */
type Entry = { label: string; items?: string[]; note?: string }

const ENTRIES: Entry[] = [
  { label: 'A new look', note: 'New type, colour and icons' },
  { label: 'Fixtures by competition', note: 'One block per league' },
  { label: 'Leagues added', items: ['Bundesliga', 'Ligue 1', 'Allsvenskan'] },
]

export function ChangelogNote() {
  // Called unconditionally, before the early return below: the value decides
  // whether anything renders, and a hook cannot sit behind that decision.
  const seen = usePreference(CHANGELOG_STORAGE_KEY)
  if (seen === CHANGELOG_NOTE_ID) return null

  return (
    <div className="changelog-note shrink-0 p-3">
      <section aria-labelledby="changelog-note-title" className="border border-border">
        <header className="flex items-center justify-between gap-2 border-b-2 border-brand bg-surface-alt py-1.5 pr-1.5 pl-3">
          <h2 id="changelog-note-title" className="text-caps text-muted">
            What&rsquo;s new
          </h2>

          {/*
            16px in a 24px box, where foundations puts a button's glyph at 18px.
            It sits beside 11px caps in a strip two thirds the height of a normal
            block header, and at 18px it outweighed the label it is meant to sit
            next to. `<Icon>` is always aria-hidden, so the button carries the
            name itself — the same shape as the menu button in the top bar.
          */}
          <button
            type="button"
            aria-label="Dismiss what's new"
            onClick={() => writePreference(CHANGELOG_STORAGE_KEY, CHANGELOG_NOTE_ID)}
            className="t-hover flex size-6 shrink-0 items-center justify-center text-muted hover:bg-surface hover:text-text focus-visible:focus-ring"
          >
            <Icon name="close" size="sm" />
          </button>
        </header>

        <div className="flex flex-col gap-2.5 px-3 py-2.5">
          {ENTRIES.map(({ label, items, note }) => (
            <div key={label}>
              <p className="text-label text-text">{label}</p>

              {/*
                Muted, and never a link: none of these is a destination, and a
                name that is not a link is what this system draws in grey.
                No `list-none` — the base layer already resets it.
              */}
              {items ? (
                <ul className="mt-0.5 flex flex-col gap-0.5">
                  {items.map((item) => (
                    <li key={item} className="text-caption text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-0.5 text-caption text-muted">{note}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

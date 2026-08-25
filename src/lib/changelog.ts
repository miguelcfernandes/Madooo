/**
 * **TEMPORARY, and paired with `src/components/changelog-note.tsx`.** Delete
 * this file with it, along with the `<script>` in `layout.tsx` and the
 * `.changelog-note` rule in `globals.css`.
 *
 * The same two-part shape as [`theme.ts`](./theme.ts), and for exactly the same
 * reason: the note's dismissal has to be settled *before the browser paints*,
 * and nothing running after hydration can do that. `useEffect` runs after paint,
 * `useLayoutEffect` runs after React has loaded, and `useSyncExternalStore` —
 * which is what the note used at first — takes a separate server snapshot on
 * purpose, so its first client render deliberately shows the default. For a
 * preference that reorders a list that is invisible. For one that decides
 * whether an element exists, it is a dismissed note flashing back onto the
 * screen on every reload.
 *
 * So the constants live here rather than in the component: the script runs
 * during head parsing, the component runs in React, and the two have to agree on
 * a key and an id without either importing the other's world.
 */

export const CHANGELOG_STORAGE_KEY = 'madooo-changelog-seen'

/**
 * The id of the note currently written in `changelog-note.tsx`, stored on
 * dismissal.
 *
 * A string rather than a boolean, so that changing the note's content and
 * bumping this brings it back for somebody who dismissed the previous one. It
 * lives here rather than beside the copy it describes because the script below
 * has to compare against it, and a second literal in the script would be a
 * second source of truth for the same fact.
 */
export const CHANGELOG_NOTE_ID = '2026-08-rebrand-leagues-and-fixtures'

/**
 * Marks `<html>` before first paint when this exact note has been dismissed, so
 * that CSS can keep it off the screen for the frame React has not reached yet.
 *
 * A *string* of JavaScript, injected into a `<script>` in the document head,
 * where it runs synchronously as the HTML is parsed. Hence the plain style: no
 * imports, no modern syntax worth risking, and a `try` around `localStorage`,
 * which throws outright rather than returning null in some privacy modes. An
 * uncaught throw here would abort parsing the document.
 *
 * The comparison happens *in the script* rather than in a CSS attribute
 * selector, which is what keeps `CHANGELOG_NOTE_ID` a single literal: the
 * stylesheet only ever asks whether the attribute is present, so bumping the id
 * above needs no CSS edit and cannot leave the two disagreeing.
 *
 * Only the dismissed case is ever written, so there is nothing to undo for a
 * reader who has not dismissed it — the absence of the attribute is the default.
 */
export const CHANGELOG_INIT_SCRIPT =
  `(function(){try{if(localStorage.getItem(${JSON.stringify(CHANGELOG_STORAGE_KEY)})===` +
  `${JSON.stringify(CHANGELOG_NOTE_ID)}){document.documentElement.dataset.changelogSeen=""}}catch(e){}})()`

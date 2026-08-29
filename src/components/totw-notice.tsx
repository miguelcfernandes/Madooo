'use client'

import { useCallback, useId, useRef, useState } from 'react'

import { useFirstTime, writePreference } from './use-preference'
import { Icon } from './icon'

/**
 * A word to whoever opens the team of the week for the first time: it is new,
 * and the suggestion box is where to say when it is wrong.
 *
 * **The one dialog in the app that opens by itself.** Every other one — the
 * suggestion box, the delete confirmation, the save dialog — is the answer to a
 * button somebody pressed, and taking over the screen unasked is a thing to do
 * approximately never. What earns it here is that it is *once*: a reader sees
 * this on their first visit to the screen and never again, so the interruption
 * is paid for one time in the life of a browser. An aside on the page was built
 * first and was the wrong shape for the job — something that has to be read
 * before it is useful cannot be something the eye can skip.
 *
 * **`localStorage`, so it is per-browser and does not survive a new device.**
 * That is the honest trade for a dismissible announcement: the alternative is a
 * column on `User`, which means a migration and a Server Action to close a
 * dialog. The app's own rule admits it — this is not a location, and it is close
 * enough to a preference to live on the same shelf.
 *
 * **It is the one client island on `/team-of-the-week`**, which was otherwise a
 * server component end to end. Nothing else on that page needs the browser, so
 * this is the whole of what it costs.
 */

/**
 * Prefixed like every other key this app writes, because `localStorage` is one
 * namespace shared with everything else on the origin. Declared here rather than
 * in a lib module because this component is its only reader — `PLAYERS_*_KEY`
 * and `THEME_STORAGE_KEY` live outside their components because they have more
 * than one.
 */
const SEEN_KEY = 'madooo-totw-notice'

export function TotwNotice() {
  const first = useFirstTime(SEEN_KEY)

  /**
   * Dismissed in *this* visit, which is not the same fact as the stored one.
   *
   * `writePreference` swallows a storage failure by design — a private window,
   * a full quota — and notifies its listeners either way, so `useFirstTime`
   * would come back `true` and the dialog would refuse to close at all. This is
   * what makes the gesture work regardless: the choice applies now, and only
   * surviving a reload depends on storage, which is the same bargain the theme
   * toggle strikes.
   */
  const [dismissed, setDismissed] = useState(false)

  // Mounted only while it is owed, which is the suggestion box's rule and what
  // makes the entrance in `globals.css` need `@starting-style`. Unmounting is
  // also how the dialog closes: React removing it takes it out of the top layer,
  // so nothing here has to call `close()` to make it go away.
  if (!first || dismissed) return null

  return (
    <NoticeDialog
      onDismiss={() => {
        writePreference(SEEN_KEY, 'seen')
        setDismissed(true)
      }}
    />
  )
}

/**
 * **Every exit writes the flag itself, rather than routing through `onClose`.**
 * The other three dialogs in this app close and let a `close` handler reset a
 * boolean their parent owns, which is right for them: the worst a missed one
 * could cost is a control that needs a second press. This one's closing *is* a
 * write, and a dismissal that failed to record would bring the dialog back on
 * every visit for ever — so each of the three gestures says so directly and none
 * of them depends on an event firing.
 *
 * The three are the button, the backdrop, and Escape by way of `onCancel` — the
 * event the platform fires for that key before it closes anything.
 */
function NoticeDialog({ onDismiss }: { onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  /*
    A callback ref rather than an effect, and memoised — the suggestion dialog's
    reason, which is that React holds a ref by identity and would re-run an
    inline one on every render. `showModal()` needs no user activation, which is
    what lets this one open on arrival at all.
  */
  const openDialog = useCallback((element: HTMLDialogElement | null) => {
    dialog.current = element
    element?.showModal()
  }, [])

  return (
    <dialog
      ref={openDialog}
      // Escape. `cancel` is the event the platform fires for it, and it arrives
      // before the dialog closes rather than after — which is what makes it the
      // right hook for something that has to be recorded.
      onCancel={onDismiss}
      // Mouse *down* rather than click: a click's target after a drag is the
      // nearest common ancestor, so releasing outside the dialog after pressing
      // inside it would count as a press on the backdrop.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onDismiss()
      }}
      aria-labelledby={titleId}
      className="dialog m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden border border-border bg-surface p-0 text-text shadow-3"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id={titleId} className="truncate text-heading">
          Team of the week is new
        </h2>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close"
          className="t-hover flex size-(--control-h) shrink-0 cursor-pointer items-center justify-center text-muted hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
        >
          <Icon name="close" size="md" />
        </button>
      </div>

      <div className="px-5 py-4">
        <p className="text-body text-muted">
          If something here does not work, or does not do what you expected, say so with{' '}
          {/* The control's own label, weighted rather than coloured: it has to
              be findable in the bar above, and a colour would be one more thing
              claiming to mean something. Ink rather than muted, because the
              point of the sentence is that this is the thing to look for. */}
          <span className="font-medium text-text">Suggest a feature</span> at the top of the screen.
        </p>
      </div>

      <div className="flex justify-end border-t border-border px-5 py-4">
        {/*
          `autoFocus` moves focus off the close button in the header, which is
          what `showModal()` would otherwise pick. On a dialog that only has
          something to say, the acknowledgement is where a reader's hand already
          is — the suggestion box does the same on its "sent" screen.
        */}
        <button
          type="button"
          onClick={onDismiss}
          autoFocus
          className="t-hover flex h-(--control-h-lg) cursor-pointer items-center bg-brand-action px-5 text-label text-brand-action-ink hover:bg-brand-action-hover active:translate-y-px focus-visible:focus-ring"
        >
          Got it
        </button>
      </div>
    </dialog>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useId, useRef, useState, useTransition } from 'react'

import { deleteTeamOfTheWeek } from '@/lib/actions'
import { refreshSession } from './fresh-session'
import { Icon } from './icon'

/**
 * Deleting a saved eleven, and the dialog that asks first.
 *
 * **The one destructive control in the app, and the only one that asks.** Every
 * other write here is a set: a verdict overwrites a verdict, an empty note
 * clears a note, and the gesture that undid something is the gesture that did
 * it. This one throws away eleven decisions and the app has no undo, so the
 * confirmation is not politeness — it is the undo.
 *
 * **A native `<dialog>` opened with `showModal()`**, following the suggestion
 * box exactly: the platform supplies the focus trap, Escape, the inert
 * background and the top layer, and the top layer is what earns it — `<main>` is
 * `position: relative`, so anything `fixed` inside it would be contained by the
 * scroll container rather than by the viewport.
 *
 * **The button is an outline, not a red fill.** Foundations gives the app one
 * filled surface for an action and it is marine, for the primary thing on a
 * screen; a red button would be a second filled vocabulary invented for one
 * control, and `--flop` is a verdict rather than a danger colour. What marks the
 * gesture is the word, the glyph and the question — which is the same answer
 * this design gives everywhere: a fact worth stating is stated in words.
 */
export function DeleteTotw({ id, label }: { id: number; label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="t-hover flex h-(--control-h-lg) cursor-pointer items-center gap-2 border border-border px-4 text-label text-muted hover:border-border-strong hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
      >
        <Icon name="delete" size="md" />
        Delete this eleven
      </button>

      {/* Mounted only while open, the suggestion dialog's rule — which is what
          makes the entrance in `globals.css` need `@starting-style`. */}
      {open ? <ConfirmDialog id={id} label={label} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function ConfirmDialog({
  id,
  label,
  onClose,
}: {
  id: number
  label: string
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const router = useRouter()
  const titleId = useId()
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  function close() {
    // Never unmount straight from a handler: `close()` is what returns focus to
    // the button that opened this and what fires `onClose`, so Escape and both
    // buttons leave through one path.
    dialog.current?.close()
  }

  /*
    A callback ref rather than an effect, and memoised — the suggestion
    dialog's reason, which is that React holds a ref by identity and re-runs an
    inline one on every render. Nothing is focused by hand here: `showModal()`
    focuses the first focusable descendant, which is the close button, and on a
    dialog that asks a question rather than taking typing that is the right
    place for focus to land.
  */
  const openDialog = useCallback((element: HTMLDialogElement | null) => {
    dialog.current = element
    element?.showModal()
  }, [])

  function remove() {
    setError(false)

    startTransition(async () => {
      try {
        // Clerk will not renew an expired session cookie on a POST, and a
        // Server Action is one. See `fresh-session.ts`.
        await refreshSession()
        await deleteTeamOfTheWeek(id)
      } catch (thrown) {
        console.error('team of the week failed to delete', thrown)
        setError(true)
        return
      }

      // The page this was fired from no longer has a row behind it, so there is
      // nothing here to re-render — the list is the screen that changed.
      //
      // **`router.refresh()` was here and had to come out**, which is worth
      // recording because it is the obvious thing to reach for and it hangs.
      // `refresh()` re-renders the *current* route, and the current route is the
      // team that has just been deleted — so it re-runs a page whose query now
      // returns null and calls `notFound()`. Inside the same transition as the
      // push, React waits on both, one of them never settles, and the dialog
      // sits on "Deleting…" for ever while the server has quietly done the work.
      //
      // The push on its own is enough. Next's client router cache holds dynamic
      // routes for zero seconds by default, and every route in this app that
      // reads anything is `force-dynamic`, so the list is fetched again rather
      // than replayed from a copy still holding the deleted row.
      router.push('/team-of-the-week')
    })
  }

  return (
    <dialog
      ref={openDialog}
      onClose={onClose}
      // Mouse *down* rather than click: a click's target after a drag is the
      // nearest common ancestor, so releasing outside the dialog after pressing
      // inside it would count as a backdrop press.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      aria-labelledby={titleId}
      className="dialog m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden border border-border bg-surface p-0 text-text shadow-3"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id={titleId} className="truncate text-heading">
          Delete this eleven?
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="t-hover flex size-(--control-h) shrink-0 cursor-pointer items-center justify-center text-muted hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
        >
          <Icon name="close" size="md" />
        </button>
      </div>

      <div className="px-5 py-4">
        {/* The span is repeated here rather than assumed: a dialog that says
            "this one" is a dialog you have to remember what you clicked. */}
        <p className="text-body text-muted">
          {label} will be removed. Nothing in your diary changes — the verdicts it
          was picked from stay where they are.
        </p>
        {error ? (
          <p role="status" className="mt-2 text-caption text-alert">
            That did not delete. Try again in a moment.
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={close}
          className="t-hover flex h-(--control-h-lg) cursor-pointer items-center border border-border px-5 text-label text-text hover:border-border-strong hover:bg-surface-alt focus-visible:focus-ring"
        >
          Keep it
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="t-hover flex h-(--control-h-lg) cursor-pointer items-center bg-brand-action px-5 text-label text-brand-action-ink hover:bg-brand-action-hover active:translate-y-px focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </dialog>
  )
}

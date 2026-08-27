'use client'

import { startTransition, useCallback, useId, useOptimistic, useRef, useState } from 'react'

import { refreshSession } from './fresh-session'
import { Icon } from './icon'
import { SaveFailure } from './save-failure'
import { setNote } from '@/lib/actions'
import { NOTE_MAX_LENGTH } from '@/lib/verdicts'
import type { ReactNode } from 'react'

/**
 * The write controls on a squad row: the three verdict chips, the note button,
 * and the note itself once there is one.
 *
 * **Why this owns the chips rather than sitting beside them.** The note button
 * and the note text are in two different cells of the row's grid — the button
 * beside the chips, the note on its own line underneath — but they share one
 * piece of optimistic state, and state has to have a single owner above both.
 * This component is that owner, and returning a **fragment** is what lets it
 * place two children into the parent's grid: a fragment produces no DOM of its
 * own, so both remain direct children of the `<li>` and the grid sees them.
 *
 * The chips arrive as `children` rather than through an import — the same
 * composition the shell uses to pass `<Sidebar />` into `AppFrame`. It keeps
 * `VerdictControls` free of any knowledge of notes, and keeps the row's markup
 * in `squad-panel.tsx` reading left to right the way it draws.
 */

type Props = {
  matchSquadId: number
  /** For the button's accessible name and the dialog's title. */
  playerName: string
  note: string | null
  /** The verdict chips. */
  children: ReactNode
}

export function PlayerControls({ matchSquadId, playerName, note, children }: Props) {
  /*
    The same hook as the chips, for the same reason: it holds what was just
    typed until `refresh()` brings the server's own answer back, and then drops
    it. No `useState` copy of the note is kept, so there is nothing to fall out
    of step with the database.
  */
  const [shown, setShown] = useOptimistic(note)
  const [open, setOpen] = useState(false)

  /*
    The note whose write failed, kept so the retry can re-send it, and how it
    failed, because the two failures want different words. A `useState` and not
    a `useOptimistic`, for the reason the chips give: every other piece of state
    here is a guess about what the server will say and is thrown away when it
    answers, and this is a record of what the server *did* say.

    **Nothing caught this before, which made a lost note worse than a lost
    verdict.** `c718dd8` fixed exactly this for the chips a row's width away and
    the note was left as it was: the text appeared, the transition ended,
    `useOptimistic` discarded it and the line vanished — indistinguishable from
    a note that saved and was then deleted, except that the reader had typed
    sentences rather than tapped a chip.
  */
  const [failed, setFailed] = useState<{ value: string; offline: boolean } | null>(null)

  function save(draft: string) {
    // Trimmed here as well as in the action, and neither is redundant: the
    // action cannot trust a value that crossed the network, and this side needs
    // the same value the server will store or the optimistic text would differ
    // from what appears a moment later.
    const text = draft.trim()

    // Clear the previous complaint before making a new attempt, or a retry that
    // works would leave its own error message sitting under a note that saved.
    setFailed(null)

    startTransition(async () => {
      setShown(text === '' ? null : text)
      try {
        // Bring the session cookie up to date first, or a note written in a
        // background tab is turned away before it reaches the action at all.
        // `fresh-session.ts` is the whole of that argument.
        await refreshSession()
        await setNote(matchSquadId, text)
      } catch (error) {
        // `TypeError` is what `fetch` rejects with when the request never
        // completed; anything else travelled to the server and came back. The
        // same split the chips make, for the same reason.
        setFailed({ value: text, offline: error instanceof TypeError })

        // The note itself is deliberately not logged. A verdict is one of three
        // words and naming it in a console line costs nothing, but a note is
        // what the reader actually wrote, and a diary is private — the id says
        // which row to look at without copying its contents anywhere.
        console.error('[madooo] note did not save', { matchSquadId, playerName, error })
      }
    })
  }

  const empty = shown === null

  return (
    <>
      {/*
        `col-end-[-1]` is the last grid line whichever layout is in force, so one
        pair of classes covers both: below `md` the controls span columns 2–3 on
        a second row, and at `md` they are the fourth column of the first.
      */}
      <div className="col-start-2 col-end-[-1] flex gap-1 justify-self-start md:col-start-4 md:justify-self-end">
        {children}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${empty ? 'Add' : 'Edit'} note on ${playerName}`}
          className={[
            // The same box as a chip, and deliberately without its border: the
            // design draws this one borderless, which is what keeps a row of
            // four controls from reading as four equal choices.
            'flex size-(--control-h-lg) items-center justify-center md:size-(--control-h)',
            'active:translate-y-px focus-visible:focus-ring',
            empty
              ? 't-hover text-muted hover:bg-surface-alt hover:text-text'
              : // One step further down the surface ramp than the resting
                // hover, and no hover of its own — the same reasoning as a
                // selected chip, which has nothing below its tint to darken to.
                // The glyph does not fill: filled means "on" for the states
                // foundations lists, and a note is not one of them — nor could
                // it, since `edit_note` is three open rules with no inside.
                'bg-surface-sunken text-text',
          ].join(' ')}
        >
          <Icon name="edit_note" size="md" />
        </button>
      </div>

      {empty ? null : (
        // Indented to the name above it and marked with a rule, as the design
        // draws it. `whitespace-pre-line` keeps the line breaks that were typed
        // — the textarea allows them, so throwing them away here would silently
        // rewrite what the reader wrote.
        <p className="col-start-2 col-end-[-1] border-l-2 border-border pl-3 text-body whitespace-pre-line text-muted">
          {shown}
        </p>
      )}

      {failed === null ? null : (
        // Indented to the name like the note is, and a wrapper rather than
        // classes on `SaveFailure` itself: this is the one place the line lands
        // in a grid rather than a flex column, and the placement is this row's
        // business rather than the message's.
        <div className="col-start-2 col-end-[-1]">
          <SaveFailure offline={failed.offline} onRetry={() => save(failed.value)} />
        </div>
      )}

      {open ? (
        <NoteDialog
          playerName={playerName}
          note={shown}
          onSave={save}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

type DialogProps = {
  playerName: string
  note: string | null
  onSave: (draft: string) => void
  onClose: () => void
}

/**
 * The note dialog.
 *
 * A native `<dialog>` opened with `showModal()`, not a hand-rolled overlay. The
 * platform gives the focus trap, Escape, the inert background and the top layer
 * for free — and the top layer is the one that matters most here, because
 * `<main>` is `position: relative` and would otherwise be the containing block
 * for anything fixed inside it.
 *
 * It is mounted only while it is open, which is what makes the draft
 * disposable: Cancel discards by unmounting, and there is no stale text to
 * clear. It is also what makes the entrance animation in `globals.css` need
 * `@starting-style`.
 */
function NoteDialog({ playerName, note, onSave, onClose }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const [draft, setDraft] = useState(note ?? '')

  function close() {
    // Never unmount straight from a handler. `close()` is what returns focus to
    // the button that opened this, and it is what fires `onClose` below — so
    // Escape and every button here leave through one path.
    dialog.current?.close()
  }

  /*
    A callback ref, rather than an effect: it runs as soon as the element is in
    the DOM and before paint, which is when `showModal()` has to be called — a
    `<dialog>` is inert markup until it is, and the attribute form (`open`)
    gives a non-modal dialog with no backdrop.

    React attaches a child's ref before its parent's, so the textarea is
    already known here. Focusing it after `showModal()` is deliberate:
    `showModal()` moves focus to the first focusable descendant, which is the
    close button, and this puts it where the typing goes. The caret goes to the
    end, so editing an existing note appends rather than prepends.

    **`useCallback` is not a micro-optimisation here, it is the whole of a bug
    fix.** React holds a ref by identity, so a ref written inline is a new
    function on every render and React detaches and re-attaches it each time —
    which ran this body again after every keystroke and put the caret back at
    the end of the box. Clicking into the middle of a note bought you exactly
    one character before the next one landed at the end. Memoised with no
    dependencies the function is stable, so React attaches it once when the
    dialog mounts, and this runs when it is meant to: on the way in, once.
  */
  const openDialog = useCallback((element: HTMLDialogElement | null) => {
    dialog.current = element
    element?.showModal()

    const textarea = field.current
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, [])

  return (
    <dialog
      ref={openDialog}
      onClose={onClose}
      // Dismiss on a press on the backdrop. On mouse *down* rather than click,
      // because a click's target after a drag is the nearest common ancestor —
      // so selecting text in the textarea and releasing outside it would count
      // as a click on the dialog and throw the draft away.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      aria-labelledby={titleId}
      // No padding of its own: the three sections carry their own, and the
      // backdrop test above only holds while there is no dialog surface to
      // click on. `m-auto` is not decoration — Tailwind's preflight zeroes every
      // margin, including the `margin: auto` the browser uses to centre a modal.
      className="dialog m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden border border-border bg-surface p-0 text-text shadow-3"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id={titleId} className="truncate text-heading">
          Note on {playerName}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="t-hover flex size-(--control-h) shrink-0 items-center justify-center text-muted hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
        >
          <Icon name="close" size="md" />
        </button>
      </div>

      <div className="px-5 py-4">
        <textarea
          ref={field}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Any notes on his performance?"
          className="w-full resize-y border border-border bg-surface px-3 py-2 text-body text-text placeholder:text-faint focus:focus-field"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={close}
          className="t-hover flex h-(--control-h-lg) cursor-pointer items-center border border-border px-5 text-label text-text hover:border-border-strong hover:bg-surface-alt focus-visible:focus-ring"
        >
          Cancel
        </button>
        {/*
          Saving an empty box is how a note is deleted — there is no delete
          button, and the design draws none.
        */}
        <button
          type="button"
          onClick={() => {
            onSave(draft)
            close()
          }}
          className="t-hover flex h-(--control-h-lg) cursor-pointer items-center bg-brand-action px-5 text-label text-brand-action-ink hover:bg-brand-action-hover active:translate-y-px focus-visible:focus-ring"
        >
          Save note
        </button>
      </div>
    </dialog>
  )
}

'use client'

import { useCallback, useId, useRef, useState } from 'react'

import { TOTW_NAME_MAX_LENGTH } from '@/lib/totw-picks'
import { Icon } from './icon'

/**
 * Naming an eleven on the way to saving it.
 *
 * **The name is the one thing about a team of the week the app cannot work
 * out**, so it asks — and because the obvious answer is nearly always right, the
 * box opens with a suggestion already in it and the reader can send it straight
 * back. The other suggestions are one tap away, and typing over any of them is
 * the third option rather than the only one.
 *
 * **A native `<dialog>` opened with `showModal()`**, following the suggestion
 * box exactly: the platform supplies the focus trap, Escape, the inert
 * background and the top layer, and the top layer is what earns it — `<main>` is
 * `position: relative`, so anything `fixed` inside it would be contained by the
 * scroll container rather than by the viewport.
 *
 * **The failure lives in here, not on the page behind it.** Saving used to
 * report inline under the formation row, which was right when the button was the
 * whole of the gesture; now the gesture ends in a dialog holding a name the
 * reader typed, and closing that to show an error somewhere else would throw the
 * name away. So the dialog stays open, says what happened, and the name is still
 * there to send again.
 */
export function SaveElevenDialog({
  suggestions,
  saving,
  failure,
  onSave,
  onClose,
}: {
  /** Names to offer, best first — the first is what the box opens on. */
  suggestions: readonly string[]
  saving: boolean
  /** What went wrong last time, or null. Drawn in place, not on the page. */
  failure: string | null
  onSave: (name: string) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const hintId = useId()

  const [name, setName] = useState(suggestions[0] ?? '')

  function close() {
    // Never unmount straight from a handler: `close()` is what returns focus to
    // the button that opened this and what fires `onClose`, so Escape and every
    // button here leave through one path.
    dialog.current?.close()
  }

  /*
    A callback ref rather than an effect, and memoised — the suggestion dialog's
    reason, which is that React holds a ref by identity and would re-run an
    inline one on every render, pulling focus back into the box on every
    keystroke. `select()` rather than `focus()`: the box already holds a
    suggestion, and a reader who wants their own name should be able to type over
    it rather than clear it first.
  */
  const openDialog = useCallback((element: HTMLDialogElement | null) => {
    dialog.current = element
    element?.showModal()
    field.current?.select()
  }, [])

  const empty = name.trim().length === 0
  const tooLong = name.trim().length > TOTW_NAME_MAX_LENGTH

  return (
    <dialog
      ref={openDialog}
      onClose={onClose}
      // Mouse *down* rather than click: a click's target after a drag is the
      // nearest common ancestor, so selecting text in the box and releasing
      // outside it would count as a press on the backdrop and throw the name
      // away.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      aria-labelledby={titleId}
      className="dialog m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden border border-border bg-surface p-0 text-text shadow-3"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id={titleId} className="truncate text-heading">
          Name this eleven
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

      <div className="flex flex-col gap-4 px-5 py-4">
        <div>
          <input
            ref={field}
            value={name}
            onChange={(event) => setName(event.target.value)}
            // Enter saves, which is what a one-field dialog should do. It is a
            // bare input rather than a `<form>` because the page behind this is
            // already a form and nesting one inside another is invalid markup
            // the browser silently unpicks.
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !empty && !tooLong && !saving) onSave(name.trim())
            }}
            maxLength={TOTW_NAME_MAX_LENGTH}
            aria-describedby={hintId}
            placeholder="Team of the week"
            className="w-full border border-border bg-surface px-3 py-2 text-body text-text placeholder:text-faint focus:focus-field"
          />
          <p
            id={hintId}
            // Foundations' error state: the hint line is replaced by the message
            // rather than the message being added underneath it.
            className={`mt-2 text-caption ${failure === null ? 'text-muted' : 'text-alert'}`}
          >
            {failure ?? 'This is what the eleven will be called on your list.'}
          </p>
        </div>

        {suggestions.length > 1 ? (
          <div className="flex flex-col gap-2">
            <span className="text-caps text-muted">Or use one of these</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setName(suggestion)
                    field.current?.focus()
                  }}
                  // A bordered control rather than the filled one: these
                  // rearrange the box above them, and the screen's one filled
                  // button is Save. `aria-pressed` rather than a selected style,
                  // because tapping one is a way of typing rather than a mode.
                  aria-pressed={name === suggestion}
                  className={`t-hover flex h-(--control-h) cursor-pointer items-center border px-3 text-label focus-visible:focus-ring ${
                    name === suggestion
                      ? 'border-border-strong bg-surface-alt text-text'
                      : 'border-border text-muted hover:border-border-strong hover:bg-surface-alt hover:text-text'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={close}
          className="t-hover flex h-(--control-h-lg) cursor-pointer items-center border border-border px-5 text-label text-text hover:border-border-strong hover:bg-surface-alt focus-visible:focus-ring"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(name.trim())}
          // An unnamed eleven is not saveable, and neither is a second press
          // while the first is in flight. Foundations' disabled state is opacity
          // and a cursor, and nothing else.
          disabled={empty || tooLong || saving}
          className="t-hover flex h-(--control-h-lg) cursor-pointer items-center bg-brand-action px-5 text-label text-brand-action-ink hover:bg-brand-action-hover active:translate-y-px focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </dialog>
  )
}

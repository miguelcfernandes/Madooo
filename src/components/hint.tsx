'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Icon } from './icon'

/**
 * A mark you can hover, tap or tab to, and the sentence it reveals.
 *
 * **The app's only floating explanation, and the only one it should have.** A
 * design whose answer to an unclear screen is a tooltip is a design that has
 * stopped writing labels, and `foundations.md`'s voice section is explicit that
 * a fact worth saying is said in words on the page. This exists for the one case
 * where the fact is *conditional and rare* — a match being played whose lineup
 * the provider has not published — and where saying it on the row would put a
 * sentence in a column two characters wide.
 *
 * It is deliberately general in shape and specific in use: one caller today,
 * in [`fixture-row.tsx`](./fixture-row.tsx). A second one is a decision to make
 * on its own rather than a precedent this file already granted.
 *
 * **Hover, click and focus all open it, and that is three affordances for three
 * inputs rather than three ideas.** A mouse hovers, a phone taps, a keyboard
 * tabs. `pointerType` is what keeps the first two from fighting: a tap fires
 * `pointerenter` *and* `click`, so opening on every enter would have the click
 * immediately toggle it shut again. Only a mouse gets the hover.
 *
 * **The panel is always in the DOM, and `aria-describedby` always points at
 * it.** Hover is not a thing a screen reader does, so a description that existed
 * only while a pointer was over the glyph would be a description that reader
 * never gets. The accessible name and the description are therefore both
 * present at rest; `open` decides only whether it is painted.
 */
export function Hint({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  const wrapper = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)

  /*
    Dismissal from outside the glyph: Escape wherever focus is, and a press
    anywhere else on the page.

    Both are on the document rather than on the element, because neither event
    is guaranteed to reach it. A hint opened by hovering has focus somewhere
    else entirely, so a `keydown` handler here would never see Escape; and a tap
    elsewhere on the page is by definition not on this element. `blur` alone is
    not enough either — a button is not reliably focused by a tap on Safari.

    Bound only while open, so a page of forty rows adds no listeners at rest.
  */
  useEffect(() => {
    if (!open) return

    function dismiss(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && wrapper.current?.contains(target)) return
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span
      ref={wrapper}
      className="relative inline-flex"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setOpen(false)
      }}
    >
      <button
        type="button"
        // The glyph is `aria-hidden` as every glyph in this app is, so a control
        // whose only content is one has no accessible name at all without this.
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        /*
          26px — foundations' small icon button, and the size this wants rather
          than the 32px the day pager's arrows take. It stands beside a 28px
          badge in a row that is 36px tall at `md`; the pager's arrows stand
          alone. The glyph is 16px inside it, one step down from the 18px a
          full-size button gets, for the same reason.
        */
        className="t-hover flex size-6.5 cursor-pointer items-center justify-center text-muted hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
      >
        <Icon name="info" size="sm" />
      </button>

      {/*
        `--shadow-3`, which is the one shadow in the system and until now was
        spent on dialogs and toasts alone.

        **That list was an inventory of what floats, not a closed set**, and this
        is the third thing to do it: a panel drawn over the rows below, in a
        layer of its own. The rule behind the list — "if it looks like it needs
        to float, it needs a rule instead" — is about cards, tiles and rows, all
        of which sit *in* the page. Everything else here stays in the palette:
        `--surface` with a `--border` outline, exactly as a dialog is drawn.

        Left-centred on the glyph and hanging below it. `z-10` is what puts it
        over the rows that follow, which paint after it in document order and
        would otherwise cut it in half.
      */}
      <span
        id={id}
        role="tooltip"
        className={`absolute top-full left-1/2 z-10 mt-1 w-64 -translate-x-1/2 border border-border bg-surface p-3 text-body text-text shadow-3 ${
          open ? '' : 'hidden'
        }`}
      >
        {children}
      </span>
    </span>
  )
}

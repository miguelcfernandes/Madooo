import { Icon } from './icon'

/**
 * A checkbox: the app's first, and foundations' 16px box.
 *
 * **Native underneath, styled on top** — the same trade `SelectField` makes and
 * for the same reasons. The `<input>` is really there and really checked, so
 * the keyboard, the form's own serialisation and every assistive technology get
 * the control they already know; what is drawn is a `<span>` beside it that
 * reads the input's state through Tailwind's `peer-` variants. The input is
 * `sr-only` rather than `hidden`, because a hidden input is not focusable and a
 * checkbox you cannot tab to is not a checkbox.
 *
 * **The box is what lets the competition filter still submit as a form.**
 * Checkboxes are what a browser serialises into a repeated query parameter,
 * which is exactly the shape `searchParams` hands back — so the chosen
 * competitions live in the URL, the page stays a server component, and the back
 * button works. That survived the group becoming a client island for its
 * "Select all" button: the island holds which boxes are ticked, and the browser
 * still does the submitting.
 *
 * **Controlled, not `defaultChecked`.** It was uncontrolled while nothing could
 * change a box except a click on it; a Select-all button can, and an
 * uncontrolled box would ignore it.
 *
 * `--surface-inverse` when checked, not marine: this is a *state*, and
 * foundations puts ink on the selected segmented button for exactly that
 * distinction — marine is something to press, ink is something already chosen.
 */
export function CheckboxField({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** The visible label. A node rather than a string, so a flag can sit in it. */
  children: React.ReactNode
}) {
  return (
    // The input is inside the label, so this needs no `id` and any number of
    // them can share a page — `SelectField`'s arrangement.
    <label className="flex cursor-pointer items-center gap-2 select-none text-body text-text">
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      {/*
        `text-transparent` unchecked is the whole of how the tick hides: the
        glyph is always in the DOM and takes `currentColor`, so there is one box
        rather than two swapped by a condition. The focus ring is on this span
        because the input it belongs to is off screen.
      */}
      <span className="t-hover flex size-4 shrink-0 items-center justify-center border border-border-strong bg-surface text-transparent peer-checked:border-transparent peer-checked:bg-surface-inverse peer-checked:text-inverse peer-focus-visible:focus-ring">
        <Icon name="check" size="xs" />
      </span>
      {children}
    </label>
  )
}

import { TotwLeaguePicker } from './totw-league-picker'
import type { LeagueIdentity } from '@/lib/leagues'

/**
 * Which football the eleven is picked from: a span of days, and which
 * competitions count.
 *
 * **A GET form.** Its two answers decide what the server queries, which by the
 * app's own rule makes them a *location* rather than a preference: they belong
 * in the URL, where they can be linked to and reached with the back button, and
 * where they keep this page a server component. A browser already knows how to
 * put a form's fields into a query string, so submitting is a navigation.
 *
 * It shipped no JavaScript at all until the competitions gained a "Select all",
 * which is a button no markup can express — see
 * [`TotwLeaguePicker`](./totw-league-picker.tsx), which is the only part of this
 * that runs in the browser. The dates are still two plain inputs.
 *
 * The fields are the platform's own — `<input type="date">` and a checkbox
 * apiece — for the reason `SelectField` states at length: the keyboard
 * behaviour, the phone's date wheel and the popup's own light-or-dark rendering
 * arrive for nothing, and `color-scheme` already re-points them with the theme.
 * What is styled is the closed box, which is the part the design draws.
 */
export function TotwRangeForm({
  fromDay,
  toDay,
  leagues,
  chosen,
}: {
  fromDay: string
  toDay: string
  /** Every competition with squads this season, out of our own `League` table. */
  leagues: readonly (LeagueIdentity & { id: number; name: string })[]
  /** The ids currently ticked, which on a bare address is none of them. */
  chosen: readonly number[]
}) {
  return (
    <form className="mb-6 overflow-hidden border border-border bg-surface">
      <header className="border-b-2 border-brand bg-surface-alt px-4 py-2">
        <h2 className="text-caps">The week</h2>
      </header>

      <div className="flex flex-col gap-5 px-4 py-4">
        <div className="flex flex-wrap items-end gap-4">
          <DayField name="from" label="From" value={fromDay} />
          <DayField name="to" label="To" value={toDay} />
        </div>

        <TotwLeaguePicker leagues={leagues} chosen={chosen} />

        <div className="flex flex-wrap items-center gap-4">
          {/* Foundations' filled button: the primary action on the screen, and
              the only marine fill in the app. */}
          <button
            type="submit"
            className="t-hover flex h-(--control-h-lg) cursor-pointer items-center bg-brand-action px-5 text-label text-brand-action-ink hover:bg-brand-action-hover active:translate-y-px focus-visible:focus-ring"
          >
            Find players
          </button>
          <p className="text-caption text-muted">
            Everyone you marked MVP or standout in a match played in these days.
          </p>
        </div>
      </div>
    </form>
  )
}

/**
 * One date field. Its label is visible, unlike the filter row's selects, because
 * "From" and "To" are not guessable from the value in the box — two identical
 * date fields side by side say nothing about which end is which.
 */
function DayField({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-caps text-muted">{label}</span>
      {/*
        `defaultValue` rather than `value`: this is an uncontrolled field in an
        uncontrolled form, and the server has already put the current span in
        the URL that rendered it. A `value` with no `onChange` is a field React
        will not let the reader type in.
      */}
      <input
        type="date"
        name={name}
        defaultValue={value}
        className="t-hover h-(--control-h-lg) border border-border bg-surface px-3 text-body text-text hover:border-border-strong focus:focus-field md:h-(--control-h)"
      />
    </label>
  )
}

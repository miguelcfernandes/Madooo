'use client'

import { useId, useState } from 'react'
import { splitByStanding, type LeagueIdentity } from '@/lib/leagues'
import { CheckboxField } from './checkbox-field'
import { LeagueFlag } from './league-flag'

/**
 * Which competitions the pool is drawn from: two groups of checkboxes, and the
 * two buttons that fill or empty them.
 *
 * **The one client island in an otherwise plain GET form**, and it is bought by
 * "Select all" alone. A button that ticks seven boxes cannot be expressed in
 * HTML, and the alternative — a link carrying every id in the query string —
 * would submit the form as a side effect and throw away any date the reader had
 * typed but not yet submitted. So the ticked set is React state, the boxes stay
 * real `<input type="checkbox" name="league">`, and the browser still serialises
 * them into the URL on submit. Nothing else about the form changed.
 *
 * **Nothing is ticked when the page opens.** The filter used to arrive with
 * every box on, which made the common case one click and the narrow case seven
 * un-clicks; the reader asked for the opposite, and it is the better default for
 * a list that is going to grow. It costs an empty pool on arrival, which the
 * builder says out loud rather than drawing as an absence.
 *
 * **Top competitions and the rest, split by `LEAGUE_ORDER`'s own ranking**
 * rather than by a list written here. That is what keeps a new league from
 * costing code: an unranked competition sorts last and appears under "Other",
 * which is where a new one belongs until somebody says otherwise.
 */
export function TotwLeaguePicker({
  leagues,
  chosen,
}: {
  leagues: readonly (LeagueIdentity & { id: number; name: string })[]
  /** What the URL that rendered this already had ticked. */
  chosen: readonly number[]
}) {
  const [picked, setPicked] = useState(() => new Set(chosen))
  const labelId = useId()
  const { top, other } = splitByStanding(leagues)

  function toggle(id: number, on: boolean) {
    setPicked((held) => {
      const next = new Set(held)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/*
        `role="group"` with `aria-labelledby` rather than `<fieldset>` and
        `<legend>`, because the two buttons belong on the label's line and a
        legend that contained them would read them out as part of the group's
        name. The grouping and the label are what a screen reader needs; the
        element they arrive on is not.
      */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span id={labelId} className="text-caps text-muted">
          Competitions
        </span>
        <span className="flex gap-2">
          <Bulk onClick={() => setPicked(new Set(leagues.map((league) => league.id)))}>
            Select all
          </Bulk>
          <Bulk onClick={() => setPicked(new Set())}>Clear</Bulk>
        </span>
      </div>

      <div role="group" aria-labelledby={labelId} className="flex flex-col gap-4">
        <Group label="Top competitions" leagues={top} picked={picked} onToggle={toggle} />
        <Group label="Other competitions" leagues={other} picked={picked} onToggle={toggle} />
      </div>
    </div>
  )
}

/**
 * One group of boxes under its own heading.
 *
 * Drawn only when it holds something: with seven leagues both groups are full,
 * and with an eighth in neither the heading would name an empty row. The
 * headings are `--text-caption` rather than a second run of micro-labels — the
 * group above them is already capitalised, and two levels of caps in one card
 * reads as two headings competing.
 */
function Group({
  label,
  leagues,
  picked,
  onToggle,
}: {
  label: string
  leagues: readonly (LeagueIdentity & { id: number; name: string })[]
  picked: ReadonlySet<number>
  onToggle: (id: number, on: boolean) => void
}) {
  if (leagues.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <span className="text-caption text-faint">{label}</span>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {leagues.map((league) => (
          <CheckboxField
            key={league.id}
            name="league"
            value={String(league.id)}
            checked={picked.has(league.id)}
            onChange={(on) => onToggle(league.id, on)}
          >
            <span className="flex items-center gap-2">
              <LeagueFlag league={league} />
              {league.name}
            </span>
          </CheckboxField>
        ))}
      </div>
    </div>
  )
}

/**
 * "Select all" and "Clear": bordered, at the control height, and quiet.
 *
 * Not the filled button — that is the screen's primary action and there is one,
 * "Find players", six inches below. These two only rearrange the boxes above
 * them, so they take the outline every secondary control in this app takes.
 *
 * `type="button"` is load-bearing: this sits inside a `<form>`, where a button
 * with no type is a submit button and would navigate on the way to ticking
 * anything.
 */
function Bulk({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="t-hover flex h-(--control-h) cursor-pointer items-center border border-border px-3 text-label text-muted hover:border-border-strong hover:bg-surface-alt hover:text-text focus-visible:focus-ring"
    >
      {children}
    </button>
  )
}

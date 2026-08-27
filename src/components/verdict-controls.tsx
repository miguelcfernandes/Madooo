'use client'

import { useOptimistic, useState, useTransition } from 'react'

import { refreshSession } from './fresh-session'
import { Icon } from './icon'
import { SaveFailure } from './save-failure'
import { setVerdict } from '@/lib/actions'
import type { IconName } from './icon-names'
import type { JudgementTag } from '@/lib/verdicts'

/**
 * The three verdict chips on a squad row.
 *
 * A small client island per row; the row around it stays a server component, so
 * nothing but this goes into the browser bundle. `'use client'` marks the
 * boundary — everything imported from here down is client code, and importing a
 * Server Action across it is the one exception, because what crosses is a
 * reference rather than the function body.
 */

/**
 * Left to right as the design draws them, each with the glyph and the word.
 *
 * The selected classes are written out per verdict rather than composed from the
 * tag, because Tailwind finds class names by scanning the source as text — a
 * name built at runtime is a name it never sees, and the CSS for it is never
 * generated.
 *
 * `satisfies` rather than a type annotation: it checks the shape without
 * widening it, so `tag` stays the three literals TypeScript can narrow on and
 * does not decay into `string`.
 */
const CHIPS = [
  {
    tag: 'STANDOUT',
    icon: 'trending_up',
    label: 'Standout',
    selected: 'border-standout bg-standout-bg text-standout',
  },
  {
    tag: 'FLOP',
    icon: 'trending_down',
    label: 'Flop',
    selected: 'border-flop bg-flop-bg text-flop',
  },
  {
    tag: 'MVP',
    icon: 'star',
    label: 'MVP',
    selected: 'border-mvp bg-mvp-bg text-mvp',
  },
] as const satisfies readonly {
  tag: JudgementTag
  icon: IconName
  label: string
  selected: string
}[]

/**
 * Resting is a plain outlined chip in muted grey, and it has to be: most players
 * stay unrated, so this is the state the page is mostly made of.
 *
 * The hover here is foundations' standard one — the surface darkens a step, the
 * border strengthens, muted ink goes to full. A **selected** chip deliberately
 * gets none of it: foundations' hover rule is "surfaces darken one step", and a
 * verdict tint has no step below it to darken to. Inventing a hex for one would
 * break the rule the whole token system exists for. Press and the focus ring
 * apply to both states, which is affordance enough.
 */
const RESTING =
  't-hover border-border bg-surface text-muted hover:border-border-strong hover:bg-surface-alt hover:text-text'

type Props = {
  matchSquadId: number
  /** Only for the group's accessible name — the buttons are icons and say nothing on their own. */
  playerName: string
  tag: JudgementTag | null
}

export function VerdictControls({ matchSquadId, playerName, tag }: Props) {
  /*
    `useOptimistic` holds the verdict the user just tapped while the round trip
    is in flight, then drops it the moment the server's own answer arrives in the
    re-render `refresh()` triggers. It is the hook that exists specifically
    because the server is the source of truth: no `useState` copy of the tag is
    kept, so there is nothing to fall out of step with the database.
  */
  const [shown, setShown] = useOptimistic(tag)

  /*
    `useTransition` rather than the module-level `startTransition`, for the one
    thing it adds: `saving` is true for exactly as long as this row's round trip
    is in the air. Nothing else about the transition changes.
  */
  const [saving, startTransition] = useTransition()

  /*
    The verdict whose write failed, kept so the retry can re-send it, and how it
    failed, because the two failures want different words.

    A `useState` and not a `useOptimistic`, and the distinction is the point:
    every other piece of state here is a guess about what the server will say and
    is thrown away when it answers. This is a record of what the server *did*
    say, so it has to survive the re-render that discards the guess.
  */
  const [failed, setFailed] = useState<{ value: JudgementTag | null; offline: boolean } | null>(
    null,
  )

  function write(value: JudgementTag | null) {
    // Clear the previous complaint before making a new attempt, or a retry that
    // works would leave its own error message sitting under a chip that saved.
    setFailed(null)

    // Both calls have to be inside the transition: `setShown` because an
    // optimistic update outside one has nothing to be discarded against, and the
    // action because that is how React knows the transition is still pending.
    startTransition(async () => {
      setShown(value)
      try {
        // Bring the session cookie up to date first, or a tap made in a
        // background tab is turned away before it reaches the action at all.
        // `fresh-session.ts` is the whole of that argument.
        await refreshSession()
        await setVerdict(matchSquadId, value)
      } catch (error) {
        /*
          **Nothing caught this before, and that was the bug worth finding.** An
          uncaught rejection here ends the transition, `useOptimistic` drops the
          tag it was holding, and the chip returns to how it was — which is
          indistinguishable from a verdict that saved and was then removed. Every
          failure the app can have looked identical, said nothing, and reached no
          log, because a request that never arrives cannot be counted by the
          server that never saw it.

          `TypeError` is what `fetch` itself rejects with when the request never
          completed — "Failed to fetch", or "Load failed" in Safari. Anything
          else travelled to the server and came back, so the server is what
          refused it. That is the only split worth drawing here: one of them is
          the reader's connection and the other one is ours.
        */
        setFailed({ value, offline: error instanceof TypeError })

        // The last place the real reason survives. The message above is written
        // for whoever is holding the phone; this is for whoever is reading a
        // console, and the two want completely different things.
        console.error('[madooo] verdict did not save', {
          matchSquadId,
          playerName,
          tag: value,
          error,
        })
      }
    })
  }

  function choose(next: JudgementTag) {
    /*
      **A repeat tap on the chip that is already lit is ignored while the write
      is in the air.** A lit chip does not say whether it is saved or still
      saving, so during that window a second tap on it is as likely to mean "did
      that register?" as "undo that" — and read as the second, it silently
      deletes what the first tap just wrote. Tapping a *different* chip is not
      ambiguous and is left alone.
    */
    if (saving && shown === next) return

    // Tapping the active verdict clears it. The decision is made here rather
    // than in the action because this is what knows the current state, which is
    // what lets the action be a plain idempotent "set it to this".
    write(shown === next ? null : next)
  }

  return (
    /*
      A column rather than the bare chip row it used to be, so the failure can
      speak underneath the chips it belongs to. With nothing to say it collapses
      to exactly the old markup plus one wrapper, and `items-start` keeps that
      wrapper sized to the chips instead of stretching across the cell it sits
      in.
    */
    <div className="flex flex-col items-start gap-1 md:items-end">
      {/* `role="group"` with a name, so a screen reader reaching three
          identically shaped buttons is told whose they are before hearing them. */}
      <div role="group" aria-label={`Verdict for ${playerName}`} className="flex gap-1">
        {CHIPS.map((chip) => {
          const selected = shown === chip.tag

          return (
            <button
              key={chip.tag}
              type="button"
              onClick={() => choose(chip.tag)}
              // A toggle, not a radio: a radio group cannot be un-chosen, and
              // clearing a verdict is the requirement.
              aria-pressed={selected}
              className={[
                // 40px for a thumb, 32px from `md` up as drawn — the same
                // arrangement-not-scaling move the rows themselves make.
                'flex size-(--control-h-lg) items-center justify-center border',
                'active:translate-y-px focus-visible:focus-ring md:size-(--control-h)',
                selected ? chip.selected : RESTING,
              ].join(' ')}
            >
              {/* Filled means "on", and an applied verdict is the example
                  foundations gives for it. Only the star has an outline that
                  closes, so it is the only one of the three this paints; the
                  two arrows carry the state in the chip's tint instead. */}
              <Icon name={chip.icon} size="md" filled={selected} />
              <span className="sr-only">{chip.label}</span>
            </button>
          )
        })}
      </div>

      {failed === null ? null : (
        <SaveFailure offline={failed.offline} onRetry={() => write(failed.value)} />
      )}
    </div>
  )
}

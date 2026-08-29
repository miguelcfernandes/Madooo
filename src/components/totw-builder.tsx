'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { saveTeamOfTheWeek } from '@/lib/actions'
import { scoreline, type Scored } from '@/lib/text'
import {
  DEFAULT_FORMATION,
  emptyPicks,
  fitToFormation,
  FORMATIONS,
  formationName,
  isComplete,
  LINE_LABELS,
  LINES,
  lineSizes,
  orderedPicks,
  parseFormation,
  pickedCount,
  suggestNames,
  TOTW_LIMIT_PER_USER,
  type Formation,
  type Line,
  type PickedTag,
  type Picks,
  type Pool,
} from '@/lib/totw-picks'
import { Badge, VERDICT_BADGE } from './badge'
import { CrestChip } from './crest-chip'
import { refreshSession } from './fresh-session'
import { Icon } from './icon'
import { Pitch, type PitchPlayer } from './pitch'
import { SaveElevenDialog } from './save-eleven-dialog'
import { SelectField } from './select-field'
import type { LeagueIdentity } from '@/lib/leagues'
import type { TeamIdentity } from '@/lib/teams/identity'

/**
 * Picking an eleven out of the pool, and saving it.
 *
 * **The only client island the feature has, and it holds exactly one thing: the
 * team that does not exist yet.** Everything the server decided — which days,
 * which competitions, who is eligible — is in the URL and arrives as props. What
 * is here is the artefact under construction, which is neither a location nor a
 * preference: nobody bookmarks a half-picked side, and nobody wants last week's
 * one restored. It lives in React state until it is saved and then it is a row.
 *
 * **The formation is state rather than URL, and that follows from the same
 * rule.** It changes nothing the server queried — the pool is the same eleven
 * hundred performances under 4-4-2 as under 3-5-2 — so putting it in the address
 * would cost a navigation that threw away the picks to redraw the same page.
 * It is part of the thing being built, and it is saved with it, in the only
 * form the schema keeps: the count of players in each line.
 *
 * **Picking is a tap, not a drag.** A drag-and-drop pitch is the obvious design
 * and it was not built: it needs a pointer, a keyboard equivalent that is a
 * second implementation of the same feature, and a library. A tap on a name puts
 * that player in the next empty place of his own line, and a tap on him — in the
 * pool or on the pitch — takes him out again. Which place in the line is not a
 * decision the reader is making: this app holds no position finer than the four
 * letters, so a left-back and a right-back are the same fact and moving one
 * along the line would be moving nothing.
 */

/** What the builder needs of a pool row. Structural, so the page's query fits. */
export interface PoolPlayer {
  matchSquadId: number
  tag: PickedTag
  position: string | null
  shirtNumber: number | null
  player: { id: number; name: string }
  team: TeamIdentity & { id: number }
  match: Scored & { id: number }
}

export function TotwBuilder({
  fromDay,
  toDay,
  label,
  leagues,
  pool,
}: {
  fromDay: string
  toDay: string
  /** `17–23 Aug` — what the pitch's own header says this eleven is. */
  label: string
  /** The competitions ticked in the form above, which the save records. */
  leagues: readonly (LeagueIdentity & { id: number; name: string })[]
  pool: Pool<PoolPlayer>
}) {
  const router = useRouter()
  const [formation, setFormation] = useState<Formation>(DEFAULT_FORMATION)
  const [picks, setPicks] = useState<Picks<PoolPlayer>>(() => emptyPicks<PoolPlayer>())
  const [failure, setFailure] = useState<string | null>(null)
  const [naming, setNaming] = useState(false)
  const [saving, startTransition] = useTransition()

  const sizes = lineSizes(formation)
  const chosen = new Set(orderedPicks(picks).map((pick) => pick.matchSquadId))
  // The graphic's shape rather than the pool's, and the mapping is the whole of
  // the difference: `PitchPlayer` is flat because a picture wants a name, where
  // a pool row wants the player the name belongs to.
  const onPitch: Picks<PitchPlayer> = {
    G: picks.G.map(toPitchPlayer),
    D: picks.D.map(toPitchPlayer),
    M: picks.M.map(toPitchPlayer),
    F: picks.F.map(toPitchPlayer),
  }
  const filled = pickedCount(picks)
  const ready = isComplete(picks, formation)

  // **Two different silences, and telling them apart is the whole of it.** With
  // no competition ticked the pool was never asked a question, and a block
  // saying "nobody was marked in these days" would be a screen inventing an
  // absence out of one the reader has not filled in yet. The boxes open empty,
  // so this is the state the page arrives in rather than an edge of it.
  const emptyLine =
    leagues.length === 0
      ? 'Tick a competition above to see who you marked.'
      : 'Nobody in this line was marked in these days.'

  /** In if there is room, out if already in. One gesture, both directions. */
  function toggle(line: Line, player: PoolPlayer) {
    setPicks((held) => {
      const inLine = held[line]
      if (inLine.some((one) => one.matchSquadId === player.matchSquadId)) {
        return { ...held, [line]: inLine.filter((one) => one.matchSquadId !== player.matchSquadId) }
      }
      if (inLine.length >= sizes[line]) return held
      return { ...held, [line]: [...inLine, player] }
    })
  }

  /**
   * A shorter line drops whoever no longer fits, rather than the change being
   * refused — `fitToFormation` holds the argument for that. Setting both pieces
   * of state in one handler keeps them from ever disagreeing about how many
   * midfielders there are.
   */
  function reshape(next: Formation) {
    setFormation(next)
    setPicks((held) => fitToFormation(held, next))
  }

  function save(name: string) {
    setFailure(null)

    startTransition(async () => {
      let result
      try {
        // Clerk refuses to renew an expired session cookie on a POST, and a
        // Server Action is one. `fresh-session.ts` is the whole of that
        // argument; this write earns it more than most, because it is the end
        // of several minutes of work rather than a tap that can be repeated.
        await refreshSession()
        result = await saveTeamOfTheWeek(
          name,
          fromDay,
          toDay,
          leagues.map((league) => league.id),
          orderedPicks(picks).map((pick) => pick.matchSquadId),
        )
      } catch (thrown) {
        // The reason reaches a log rather than the reader, exactly as a failed
        // verdict's does. `TypeError` is what `fetch` rejects with when the
        // request never completed, which is the only distinction worth drawing
        // for whoever is holding the phone: their connection, or ours.
        console.error('team of the week failed to save', thrown)
        setFailure(
          thrown instanceof TypeError
            ? 'That did not save — check your connection.'
            : 'That did not save — something went wrong.',
        )
        return
      }

      if (result.ok) {
        router.push(`/team-of-the-week/${result.id}`)
        return
      }

      // A refusal is not a failure to save and does not borrow that wording: the
      // write reached us, was understood, and was declined for a reason the
      // reader can act on.
      setFailure(
        result.reason === 'limit'
          ? `You already have ${TOTW_LIMIT_PER_USER} teams of the week. Delete one to make another.`
          : 'That eleven could not be saved. Try picking it again.',
      )
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      {/* The pitch column sticks while the pool scrolls past it, which is the
          whole reason the two are side by side at `lg` — you pick a forward and
          watch him arrive. Below `lg` they stack and the pitch leads, because
          what you are making should be the first thing on the screen. */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-0">
        <div className="flex flex-wrap items-center gap-3">
          <SelectField
            label="Formation"
            value={formationName(formation)}
            options={FORMATIONS.map((one) => ({
              value: formationName(one),
              label: formationName(one),
            }))}
            onChange={(value) => reshape(parseFormation(value))}
            className="w-28"
          />
          {/* Monospaced: it is a number you can add up, and it counts down to
              eleven. Zero is drawn, as every count in this app is. */}
          <span className="text-data text-muted">
            {filled}/{ELEVEN} picked
          </span>
          <button
            type="button"
            onClick={() => setNaming(true)}
            disabled={!ready || saving}
            className="t-hover ml-auto flex h-(--control-h-lg) cursor-pointer items-center bg-brand-action px-5 text-label text-brand-action-ink hover:bg-brand-action-hover active:translate-y-px focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save this eleven'}
          </button>
        </div>

        {/*
          Mounted only while naming, which is the suggestion dialog's rule and
          what makes the draft disposable. **The failure is drawn inside it**
          rather than out here: the dialog holds a name the reader may have
          typed, and closing it to show an error on the page behind would throw
          that away.
        */}
        {naming ? (
          <SaveElevenDialog
            suggestions={suggestNames(label, leagues)}
            saving={saving}
            failure={failure}
            onSave={save}
            onClose={() => {
              setNaming(false)
              setFailure(null)
            }}
          />
        ) : null}

        <Pitch
          formation={formation}
          players={onPitch}
          label={label}
          onRemove={(player) => {
            // The pitch knows where a player is standing but not what line that
            // is, so the line is found here rather than passed down — a graphic
            // that had to be told about lines would be a graphic that could
            // disagree with the picks it is drawing.
            const line = LINES.find((one) =>
              picks[one].some((pick) => pick.matchSquadId === player.matchSquadId),
            )
            if (line !== undefined) {
              setPicks((held) => ({
                ...held,
                [line]: held[line].filter((pick) => pick.matchSquadId !== player.matchSquadId),
              }))
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        {LINES.map((line) => (
          <PoolBlock
            key={line}
            line={line}
            entries={pool.lines[line]}
            picked={picks[line].length}
            room={sizes[line]}
            chosen={chosen}
            empty={emptyLine}
            onToggle={(player) => toggle(line, player)}
          />
        ))}

        {/* Only when it is not zero, and never as a number on its own: a pool
            that quietly leaves somebody out is a screen lying by omission, and a
            reader who marked eleven players and can find ten deserves the
            sentence rather than the silence. */}
        {pool.unplaceable > 0 ? (
          <p className="text-caption text-muted">
            {pool.unplaceable} judged {pool.unplaceable === 1 ? 'player has' : 'players have'} no
            position recorded and cannot be placed on a pitch.
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** Eleven places. Written out here as well as in the action, because this one
    is a label and that one is a bound on a query. */
const ELEVEN = 11

/**
 * One line's worth of candidates: a card with the app's block header, counting
 * how many of its places are filled.
 *
 * The count is `2/4` rather than `2` because this list has a target, unlike
 * every other counted block in the app. A squad panel's header counts what is
 * there; this one counts what is left.
 */
function PoolBlock({
  line,
  entries,
  picked,
  room,
  chosen,
  empty,
  onToggle,
}: {
  line: Line
  entries: Pool<PoolPlayer>['lines'][Line]
  picked: number
  room: number
  chosen: Set<number>
  /** What an empty block says — see `emptyLine`, which decides which silence. */
  empty: string
  onToggle: (player: PoolPlayer) => void
}) {
  const full = picked >= room

  return (
    <section className="overflow-hidden border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b-2 border-brand bg-surface-alt px-4 py-2">
        <h2 className="truncate text-caps">{LINE_LABELS[line]}</h2>
        <span className="shrink-0 text-data text-muted">
          {picked}/{room}
          <span className="sr-only"> picked</span>
        </span>
      </header>

      {entries.length === 0 ? (
        <p className="px-4 py-3 text-body text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map(({ entry, judged }) => (
            <li key={entry.matchSquadId}>
              <PoolRow
                player={entry}
                judged={judged}
                picked={chosen.has(entry.matchSquadId)}
                full={full}
                onToggle={() => onToggle(entry)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * One candidate. The club he played for, his name, the match that earned him
 * the place, and the verdict the reader gave him.
 *
 * **A picked row is `--surface-alt` and a tick, and nothing marine.** Foundations
 * gives a *state* the ink treatment rather than the brand — a selected segmented
 * button fills with `--surface-inverse` for exactly this distinction — and a row
 * is far too large a surface to fill with ink. One step along the ramp plus a
 * tick in the app's own ink is the quiet version of the same thing, and it is
 * the version a list of forty rows can carry.
 *
 * **A full line disables the rows that are not in it**, rather than hiding them
 * or silently ignoring the tap. Foundations' disabled state is opacity and a
 * cursor and nothing else, and it is right here: the reader can see the players
 * they did not pick, and see that the line is the reason.
 */
function PoolRow({
  player,
  judged,
  picked,
  full,
  onToggle,
}: {
  player: PoolPlayer
  judged: number
  picked: boolean
  full: boolean
  onToggle: () => void
}) {
  const badge = VERDICT_BADGE[player.tag]

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={full && !picked}
      // `aria-pressed` rather than a checkbox: this is a toggle button, and the
      // tick beside it is a picture of the same state rather than a second one.
      aria-pressed={picked}
      className={`t-hover grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 text-left focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40 ${
        picked ? 'bg-surface-alt' : 'cursor-pointer hover:bg-surface-alt'
      }`}
    >
      <CrestChip team={player.team} />
      <span className="min-w-0">
        <span className="block truncate text-body text-text">{player.player.name}</span>
        <span className="block truncate text-caption text-muted">
          {scoreline(player.match)}
          {/* Only when there is more than one, because "1 judged" is not a
              finding. It is what says the pool is showing this player's best
              week rather than his only one — see `buildPool`. */}
          {judged > 1 ? ` · best of ${judged}` : ''}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge icon={badge.icon} label={player.tag} classes={badge.classes} />
        {/* In the flow rather than absolutely placed, and drawn only when
            picked: a permanently reserved 18px column would push every name in
            a forty-row list to buy a mark most of them never draw. */}
        {picked ? <Icon name="check" size="md" className="text-text" /> : null}
      </span>
    </button>
  )
}

/** A pool row as the graphic wants it. */
function toPitchPlayer(player: PoolPlayer): PitchPlayer {
  return {
    matchSquadId: player.matchSquadId,
    name: player.player.name,
    shirtNumber: player.shirtNumber,
    team: player.team,
    tag: player.tag,
  }
}


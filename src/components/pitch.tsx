import {
  formationName,
  isPickedTag,
  LINES,
  lineSizes,
  type Formation,
  type Line,
  type PickedTag,
  type Picks,
} from '@/lib/totw-picks'
import { Icon } from './icon'
import { ShirtTile } from './shirt-tile'
import type { TeamIdentity } from '@/lib/teams/identity'

/**
 * An eleven standing on a pitch — the thing this whole feature exists to
 * produce, and the one screen in the app drawn to be screenshotted.
 *
 * **A pitch drawn in rules, not a picture of one.** `foundations.md` forbids
 * gradients, photography, illustration, texture and pattern outright, and rule
 * three forbids the rest of it by implication: a green ground would be colour
 * that means nothing, where in this system colour means a verdict, a club, the
 * brand or interactive state. So the markings are borders on two neutral
 * surfaces — `--surface-sunken` for the field with `--surface` lines over it,
 * which is white-on-grey in light and light-on-dark in dark, and reads as a
 * pitch in both without any colour being spent. **The only colour on it comes
 * from the clubs**, through the same `crest()` the rest of the app uses, and
 * from a star on the players the reader called MVP. That is the graphic: eleven
 * club colours and the verdicts, with the design's own furniture around them.
 *
 * **The centre circle is the one round thing in a zero-radius system**, and it
 * is the exception foundations already grants — the switch and the radio keep
 * their circles "because they are not boxes", and neither is this. Every box on
 * here, the shirt tiles and the empty slots included, is square.
 *
 * **One component for the builder and for a saved team**, which is what makes
 * "what you are building is what you will get" true rather than approximately
 * true. The difference is one optional prop: given `onRemove`, a filled place
 * is a button; given nothing, it is a span. A page that passes nothing is a
 * server component and stays one — there is no `'use client'` here, so this
 * joins the client graph only when the builder imports it.
 */

/** What the graphic needs of a player. Structural, so both callers satisfy it. */
export interface PitchPlayer {
  /** The squad row, unique within an eleven — the React key, and what a pick is. */
  matchSquadId: number
  name: string
  shirtNumber: number | null
  team: TeamIdentity
  tag: PickedTag
}

/**
 * A saved eleven, structurally — what the graphic needs off a stored pick.
 *
 * Written out here rather than imported from [`totw.ts`](../lib/totw.ts),
 * because that module imports Prisma and this one is in the client graph: the
 * builder imports it, so anything it reaches would ship to the browser. Both
 * call sites satisfy this without saying so, which is the same trade
 * `TeamIdentity` and `Judgeable` make.
 */
interface SavedShape {
  /**
   * `string`, not the enum, and the looseness is the point: this is read off a
   * stored row rather than out of a `where` clause, so `pitchPlayers` below
   * *checks* it rather than trusting it.
   */
  tag: string
  matchSquad: {
    id: number
    shirtNumber: number | null
    player: { name: string }
    team: TeamIdentity
  }
}

/**
 * A saved eleven as the graphic wants it, line by line.
 *
 * One function rather than one per screen: the list and the saved team both draw
 * the same picture off the same rows, and two mappings would be two chances for
 * a card and the page it opens to disagree about what is on the pitch.
 *
 * **`isPickedTag` rather than a cast.** A FLOP cannot reach here — the action
 * refuses to write one — but what guarantees that is code that ran in the past,
 * not a type. Checking costs nothing and a row edited by hand loses its star
 * instead of taking the page down.
 */
export function pitchPlayers<T extends SavedShape>(picks: Picks<T>): Picks<PitchPlayer> {
  const one = (pick: T): PitchPlayer => ({
    matchSquadId: pick.matchSquad.id,
    name: pick.matchSquad.player.name,
    shirtNumber: pick.matchSquad.shirtNumber,
    team: pick.matchSquad.team,
    tag: isPickedTag(pick.tag) ? pick.tag : 'STANDOUT',
  })

  return { G: picks.G.map(one), D: picks.D.map(one), M: picks.M.map(one), F: picks.F.map(one) }
}

/**
 * Forwards at the top, goalkeeper at the bottom — a team sheet drawn the way a
 * television graphic draws one, which is the opposite of `LINES`.
 *
 * `LINES` is storage order, goalkeeper first, because that is how an eleven is
 * *counted*. This is drawing order. Reversing one to get the other in place
 * would leave the reason for the reversal at the call site rather than here.
 */
const DRAWN: readonly Line[] = [...LINES].reverse()

type Props = {
  formation: Formation
  players: Picks<PitchPlayer>
  /**
   * `17–23 Aug`, or whatever else names this eleven. Sits in the block header.
   *
   * A node rather than a string, for `PageHeader`'s reason: on the list every
   * card *is* a link to the eleven it draws, and the heading is where that link
   * goes — so the card's accessible name is the span it covers rather than the
   * eleven names inside it.
   */
  label: React.ReactNode
  /**
   * Given, every filled place becomes a button that takes that player back out.
   * Omitted, the eleven is a picture. The builder is the only caller that passes
   * one.
   */
  onRemove?: (player: PitchPlayer) => void
  /**
   * A strip under the field, inside the card's own outline — the span the eleven
   * covers and the competitions it was drawn from.
   *
   * A slot rather than the two facts as props, because the header above it is
   * already a slot and the two callers put different things here: the builder
   * draws no footer at all, since the form six inches above it is still saying
   * both.
   */
  footer?: React.ReactNode
  /** Added to the card's outline. The list uses it for the hover state. */
  className?: string
}

export function Pitch({ formation, players, label, onRemove, footer, className }: Props) {
  const sizes = lineSizes(formation)

  return (
    <section className={`overflow-hidden border border-border bg-surface ${className ?? ''}`}>
      {/* The app's block header, unchanged: `--surface-alt` under a 2px marine
          rule. It is the brand naming the block, which is the only reason there
          is any marine on a graphic that leaves the app — the eleven's own
          colours belong to the clubs. */}
      <header className="flex items-center justify-between gap-3 border-b-2 border-brand bg-surface-alt px-4 py-2">
        {/*
          **`--text-label`, not `--text-caps` — the one block header in the app
          that is not capitalised.** Every other one names a *kind* of thing —
          "Starting XI", "Substitutes", a competition — and micro-labels are one
          of the two places foundations allows uppercase. This one holds a name
          the reader typed, and shouting somebody's own words back at them
          breaks that rule outright; tracked caps also spend about a third more
          width, so a name truncated at 272px truncates sooner for nothing.
        */}
        <h2 className="truncate text-label">{label}</h2>
        {/* Three numbers with a rhythm to them, which is what makes a formation
            one of the things foundations monospaces. */}
        <span className="shrink-0 text-data text-muted">{formationName(formation)}</span>
      </header>

      {/*
        `relative` so the markings below resolve against the field rather than
        against `<main>`, which is the app shell's own positioned ancestor.
        `overflow-hidden` keeps the centre circle inside the field when a narrow
        screen squeezes it.
      */}
      <div className="relative overflow-hidden bg-surface-sunken px-2 py-6 sm:px-4 md:px-8">
        <Markings />

        {/*
          `relative` again, one layer up from the markings, so the eleven draws
          over the lines rather than under them. `gap-6` between lines and
          `justify-center` across each: the pitch is a diagram of a shape, not a
          scale drawing, so nothing here is positioned by coordinates.
        */}
        <div className="relative flex flex-col gap-6">
          {DRAWN.map((line) => (
            <div key={line} className="flex items-start justify-center gap-1 sm:gap-2">
              {/*
                The empty places are drawn, not implied. A 4-3-3 with two
                forwards picked has to look like a shape with a hole in it, or
                the reader cannot see what is left to do — and on a saved team
                there are never any, because the action refuses an incomplete
                eleven.
              */}
              {Array.from({ length: sizes[line] }, (_, index) => {
                // `.at` rather than `[index]`: `noUncheckedIndexedAccess` is
                // off, so a bare index types as a player and the emptiness test
                // below would be a compile error about comparing to undefined.
                const player = players[line].at(index)
                return player === undefined ? (
                  <EmptyPlace key={`${line}-${index}`} />
                ) : (
                  <Place key={player.matchSquadId} player={player} onRemove={onRemove} />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {footer === undefined ? null : (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-4 py-2">
          {footer}
        </div>
      )}
    </section>
  )
}

/**
 * The lines on the grass: a halfway line, a centre circle and a penalty area at
 * each end. Four elements, because four is what makes a rectangle read as a
 * pitch and a fifth starts to be a scale drawing.
 *
 * Percentages rather than fixed sizes, so the markings hold their proportions
 * from a phone to a wide screen — foundations says layout changes arrangement at
 * a breakpoint rather than scaling, and this is the exception that proves it:
 * these are not layout, they are a picture of a pitch, and a pitch does scale.
 *
 * `aria-hidden` on the group. There is nothing here to announce — the eleven is
 * the content, and "penalty area" read aloud in the middle of it is noise.
 */
function Markings() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute inset-x-0 top-1/2 border-t border-surface" />
      {/* The one round thing in the app besides the switch and the radio. */}
      <span className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface" />
      <span className="absolute inset-x-[28%] top-0 h-14 border-x border-b border-surface" />
      <span className="absolute inset-x-[28%] bottom-0 h-14 border-x border-t border-surface" />
    </span>
  )
}

/**
 * One player on the pitch: his club's colour under his shirt number, his name
 * under that, and a star if the reader called him the best player on the day.
 *
 * **The star is the only verdict on the graphic, and it is a fact rather than
 * decoration.** Everybody here was marked MVP or STANDOUT — that is what being
 * in the pool means — so a badge on all eleven would say nothing. The star marks
 * the ones the reader called the single best player in a match, which is the
 * app's most exclusive judgement, and it is the one glyph in the set with an
 * inside to fill.
 *
 * **The name wraps to two lines rather than truncating.** Five across a phone
 * gives a place about 56px, which is four characters of "Gabriel Magalhães" —
 * and the surname-only alternative was declined for the reason the app declines
 * every other inference about a player: the last word of a name is not reliably
 * a surname, and "van Dijk" comes out as "Dijk". Two clamped lines are truthful
 * at every width, and the fixed height keeps the four rows level.
 */
function Place({ player, onRemove }: { player: PitchPlayer; onRemove?: (p: PitchPlayer) => void }) {
  const body = (
    <>
      <span className="relative">
        <ShirtTile team={player.team} shirtNumber={player.shirtNumber} size="sm" />
        {player.tag === 'MVP' ? (
          // Over the tile's corner rather than beside it: a place is 56px wide
          // on a phone and a badge on its own line would take the room the name
          // needs. Square, on its own surface, so it stays legible over any club
          // colour underneath.
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center border border-mvp bg-mvp-bg text-mvp">
            <Icon name="star" size="xs" filled />
          </span>
        ) : null}
      </span>
      {/*
        `break-words` is what stops a long surname being sliced down the middle.
        `line-clamp` ends an overflowing line with an ellipsis only when the
        overflow is *vertical*; a single unbreakable word wider than a 57px place
        overflows horizontally instead, and was clipped mid-letter with nothing
        to say it had been — "Barrenetxea" came out as "Barrenet:". Allowing the
        break turns it into a third line, which the clamp then ends properly.

        `h-9` rather than `h-8`, and the 4px matters: `--text-caption` is 12px
        over 1.35, so two lines are 32.4px and a 32px box clipped the descenders
        off the second one. The height is fixed at all because every card on the
        list has to come out the same height — a name that took one line where
        its neighbour took two would leave a grid of ragged pitches.
      */}
      <span className="line-clamp-2 h-9 w-full break-words text-center text-caption text-text">
        {player.name}
      </span>
      {player.tag === 'MVP' ? <span className="sr-only">MVP</span> : null}
    </>
  )

  if (onRemove === undefined) return <span className={PLACE}>{body}</span>

  return (
    <button
      type="button"
      onClick={() => onRemove(player)}
      // The name is inside the button, so the accessible name is already the
      // player's; this says what pressing it does, which the picture cannot.
      aria-label={`Take ${player.name} out of the eleven`}
      // The place's own classes go on the button rather than on a span inside
      // it: the button *is* the flex child of the line, so `flex-1` anywhere
      // further in would be sizing something whose width had already been
      // decided by its contents.
      className={`${PLACE} t-hover cursor-pointer focus-visible:focus-ring active:translate-y-px`}
    >
      {body}
    </button>
  )
}

/** A place nobody is standing in. A word rather than a glyph, as ever — and the
    word is for screen readers only, because on a pitch an empty square already
    says it. */
function EmptyPlace() {
  return (
    <span className={PLACE}>
      <span className="size-10 shrink-0 border border-border-strong bg-surface" />
      <span className="h-9 text-center text-caption text-faint">
        <span className="sr-only">Empty place</span>
      </span>
    </span>
  )
}

/**
 * One standing place, filled or empty.
 *
 * **It shares the line's width rather than claiming a fixed one**, and that was
 * a bug before it was a decision. Fixed at 56px, a five-man midfield came to
 * 296px across an inner width of 272 on a 320px screen, and the field's
 * `overflow-hidden` quietly clipped the fifth man off the right-hand edge — the
 * one arrangement of the six formations that a phone could not draw. `flex-1`
 * with a cap lets the places share whatever is there: 80px each once the pitch
 * is wide enough, narrower when it is not, and never wider, so a back three does
 * not spread into three enormous tiles. The 40px tile is `shrink-0` and five of
 * them plus gaps come to 216, which fits, so only the name ever gives ground.
 */
const PLACE = 'flex min-w-0 max-w-20 flex-1 flex-col items-center gap-1'

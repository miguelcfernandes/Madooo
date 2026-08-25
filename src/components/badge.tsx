import { Icon } from './icon'
import type { IconName } from './icon-names'
import type { JudgementTag } from '@/lib/verdicts'

/**
 * A verdict read back: the glyph, the word, and the tint that belongs to it.
 *
 * 28px — the chip height — because this is the same object as a selected verdict
 * chip, seen after the fact rather than pressed. It is a label, not a control:
 * nothing here is clickable, and no screen that draws one lets you change the
 * verdict from it.
 *
 * Extracted from [`judgement-entry.tsx`](./judgement-entry.tsx) when the landing
 * page needed the same badge over content that never came out of the database.
 * Two copies of this markup would be two opinions about what a verdict looks
 * like, and the landing page is the one place nobody would notice them drifting.
 */

/**
 * **A fourth key over a three-value enum.** `NOTE` is not a `JudgementTag` and
 * never reaches the database — it is how a judgement carrying a note and no tag
 * is drawn, which 6.5 made a valid row. It is grey for the same reason the Notes
 * tile is: a note is not a verdict, and colour in this design means a verdict, a
 * club, the brand or interactive state.
 */
export type BadgeKey = JudgementTag | 'NOTE'

/**
 * The tints, written out per key rather than composed, for the reason Tailwind
 * forces: it finds class names by scanning source text, so a name assembled at
 * runtime never reaches the stylesheet. The three tags reuse the selected-chip
 * vocabulary from [`verdict-controls.tsx`](./verdict-controls.tsx) exactly.
 *
 * A caller with a key of its own — the landing page's `UNRATED`, which exists in
 * no enum because the app has no such state — writes its own entry beside this
 * one rather than adding to it. What is in here is what a real judgement can be.
 */
export const VERDICT_BADGE: Record<BadgeKey, { icon: IconName; classes: string }> = {
  MVP: { icon: 'star', classes: 'border-mvp bg-mvp-bg text-mvp' },
  STANDOUT: { icon: 'trending_up', classes: 'border-standout bg-standout-bg text-standout' },
  FLOP: { icon: 'trending_down', classes: 'border-flop bg-flop-bg text-flop' },
  /* Grey, since `--info` retired with the rebrand — a second cool colour beside
     marine would be a second thing claiming to mean something, which is what
     the colour rule forbids. The string is the resting chip, and it is written
     out rather than shared with `CALLED_OFF_BADGE` below even though the two
     are identical today: they are different facts that happen to look alike,
     they never appear on the same screen, and tying them together would make
     retuning one silently retune the other. */
  NOTE: { icon: 'edit_note', classes: 'border-border bg-surface text-muted' },
}

/**
 * A match being played, drawn where its score would go.
 *
 * Deliberately outside `VERDICT_BADGE`: that table is what a real judgement can
 * be, and this is a fact about the fixture rather than anything the reader said.
 * It takes `--live`, which resolves to the same red as `--flop` and is still its
 * own token — `foundations.md` states why.
 *
 * No icon, and that is now a choice rather than a shortage. With Madooo's own
 * set there is no glyph we could not draw for "in play" — there is no good one,
 * which is a different sentence, and the word is better than a mediocre picture.
 */
export const LIVE_BADGE = 'border-live bg-live-bg text-live'

/**
 * A fixture whose team news has landed, drawn where its score will go.
 *
 * **The positive state is the one that is drawn, and that is the whole design.**
 * `/fixtures` used to print "Team news is not out yet" on every card — true, and
 * on a Saturday morning true twenty-eight times over, which is a page saying
 * nothing at length. Nothing marks a fixture still waiting now; this marks the
 * one that is ready to judge. It also agrees with what the row already does: a
 * fixture with a squad is a link and one without is inert, so the mark and the
 * affordance say the same thing.
 *
 * **Marine, and an edge rather than a fill.** foundations gives marine to "what
 * you can act on", which is this badge's entire meaning. The clause worth
 * naming is the one saying marine may not touch "the scoreline itself" — this
 * sits in the scoreline's column, and the reading taken is that the clause
 * protects the score, a number, rather than the slot it occupies; `LIVE_BADGE`
 * below already puts a non-score fact there in `--live`. A fill was never in
 * question: the filled button is the only marine fill in the app.
 *
 * No icon, for the reason the other two fixture-state badges have none — the
 * word is better than a mediocre picture.
 */
export const LINEUPS_BADGE = 'border-brand bg-surface text-brand'

/**
 * A match that will not be played as scheduled, drawn where its kickoff time
 * would go.
 *
 * **No token of its own, and that is the decision rather than an omission.** This
 * is foundations' resting chip exactly — the string `verdict-controls.tsx` gives
 * an unpressed verdict chip, minus its hover, and the same one the landing page's
 * `UNRATED` badge reuses. Grey is what absence looks like in this system, and a
 * called-off match is an absence; the word carries the weight.
 *
 * Deliberately not `--live`, which is a match in play — the opposite fact. No
 * icon, for the reason the live badge has none: "did not happen" has no glyph
 * worth drawing, and the word carries it.
 */
export const CALLED_OFF_BADGE = 'border-border bg-surface text-muted'

type Props = {
  /**
   * Optional, because a badge saying *no* verdict was given has no glyph to
   * show: the three verdicts each own one, and the absence of them is not a
   * thing a picture can say. That badge is a word, and the word is the design.
   */
  icon?: IconName
  /** Uppercased by `text-caps`, so it is written here in the case it is read in. */
  label: string
  /** The border, tint and ink as one string — an entry from a table like `VERDICT_BADGE`. */
  classes: string
  /**
   * Filled means "on", and a badge is almost always something that was applied.
   * The exception is a badge saying a verdict was *not* given, which is off and
   * has to look it. Only the star has an outline that closes, so it is the only
   * one this actually paints; the other three carry their state in the tint.
   */
  filled?: boolean
}

export function Badge({ icon, label, classes, filled = true }: Props) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 border px-2 text-caps ${classes}`}
    >
      {icon ? <Icon name={icon} size="sm" filled={filled} /> : null}
      {label}
    </span>
  )
}

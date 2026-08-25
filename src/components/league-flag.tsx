/**
 * The national flag of the country a competition is played in, beside its name.
 *
 * **A mark, not an icon**, which is what lets it exist at all: `foundations.md`
 * bans every glyph from outside our own set under Iconography, because anything
 * else is an attempt to say what an interface glyph should be saying — and a
 * flag competes for no slot in that vocabulary. There is no drawing of
 * "England" that belongs beside a note glyph and a chevron. The rule it answers
 * to instead is the club mark's: it renders `League.country` as the sync stored
 * it, and nothing at a call site chooses which flag appears.
 *
 * `aria-hidden` for `CrestChip`'s reason: the league's name is the next thing in
 * the heading and says the same thing. Every caller has to keep that true.
 *
 * **Nothing at all for a country we have no file for**, rather than a hidden
 * span — an empty span is still a flex item, and the heading's `gap` would leave
 * a phantom 8px where the mark would have been. Returning `null` is what makes
 * an unmapped league draw exactly the heading it drew before flags existed.
 */

import { flagClass, type LeagueIdentity } from '@/lib/leagues'

export function LeagueFlag({ league }: { league: LeagueIdentity }) {
  const flag = flagClass(league)
  if (flag === null) return null

  /*
    12x16 at 4:3, both on Tailwind's default scale, which is foundations'
    spacing scale — no arbitrary value. 12px tall against the 13px --text-label
    beside it is the weight a mark wants; the 20px of a badge would crowd it.
    Square, like everything else: a flag is one of the few marks in the world
    that is genuinely rectangular, so zero radius costs it nothing.

    Whole class strings, `CrestChip`'s rule: Tailwind finds class names by
    scanning source as text, so `flag` arrives from `flagClass` as one of seven
    literals that appear in globals.css rather than assembled here.
  */
  return <span aria-hidden className={`flag ${flag} inline-block h-3 w-4 shrink-0`} />
}

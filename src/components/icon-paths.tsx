import type { ReactElement } from 'react'
import type { IconName } from './icon-names'

/**
 * The geometry of all thirty-five glyphs, and the only place it is written down.
 *
 * `docs/design/foundations.md` fixes the grammar every one of them obeys: a
 * 20×20 grid with a one-unit safe margin, a uniform 1.75 stroke that never
 * tapers, butt caps, mitre joins, zero corner radius except where an object is
 * genuinely round, and `currentColor` throughout. Those five properties are set
 * once on the `<svg>` in [`icon.tsx`](./icon.tsx) rather than per path, so a
 * glyph added here cannot quietly opt out of them — there is nowhere to write
 * the exception.
 *
 * Coordinates only, no `stroke` or `fill` attributes. A path that carried its
 * own would be the one glyph that stopped following the theme.
 */
export const ICON_PATHS: Record<IconName, ReactElement> = {
  add_comment: (
    <>
      <path d="M3 4 L17 4 L17 13.5 L8 13.5 L4.5 17 L4.5 13.5 L3 13.5 Z" />
      <path d="M10 6.6 L10 10.9" />
      <path d="M7.85 8.75 L12.15 8.75" />
    </>
  ),
  arrow_forward: (
    <>
      <path d="M3 10 L16.5 10" />
      <path d="M11.5 5 L16.5 10 L11.5 15" />
    </>
  ),
  /* A page of dated entries: a closed sheet, a short line where a date goes and
     two full ones under it.

     **The third drawing for `/changelog`, and the first that reads.** The set
     had no mark for "what changed", and the two before this each failed in
     their own way. `notifications` was a near-miss that promised an alert. A
     `history` clock — a ring with a gap and an arrowhead perched on it — read
     as a rendering fault rather than a decision, which is what an open contour
     with something in the break always looks like. A megaphone closed the
     contour and fixed that, and was still wrong: it announces, where this page
     is read.

     Three interior lines, not four. The version with two date-and-entry pairs
     says "a list" more literally and puts five strokes in a twelve-unit box,
     which silts up at the 22px this actually ships at. One short line is enough
     to say the rows are dated.

     It has two near neighbours and is told from both by construction:
     `two_pager` carries a spine, so it reads as an open book, and `edit_note`
     is ruled lines with no sheet around them. */
  article: (
    <>
      <path d="M4 2.5 L16 2.5 L16 17.5 L4 17.5 Z" />
      <path d="M6.5 7 L10 7" />
      <path d="M6.5 10.5 L13.5 10.5" />
      <path d="M6.5 14 L13.5 14" />
    </>
  ),
  calendar_today: (
    <>
      <path d="M3 5.5 L17 5.5 L17 17 L3 17 Z" />
      <path d="M3 9.5 L17 9.5" />
      <path d="M7 3 L7 7" />
      <path d="M13 3 L13 7" />
    </>
  ),
  check: <path d="M3.5 10.5 L8 15 L16.5 5.5" />,
  chevron_left: <path d="M12.5 4 L6.5 10 L12.5 16" />,
  chevron_right: <path d="M7.5 4 L13.5 10 L7.5 16" />,
  close: (
    <>
      <path d="M4.5 4.5 L15.5 15.5" />
      <path d="M15.5 4.5 L4.5 15.5" />
    </>
  ),
  dark_mode: <path d="M17.5 10.66 A7.5 7.5 0 1 1 9.34 2.5 A5.83 5.83 0 0 0 17.5 10.66 Z" />,
  delete: (
    <>
      <path d="M3 6 L17 6" />
      <path d="M7.8 6 L7.8 3.4 L12.2 3.4 L12.2 6" />
      <path d="M4.9 6 L4.9 17 L15.1 17 L15.1 6" />
      <path d="M8.4 9 L8.4 14" />
      <path d="M11.6 9 L11.6 14" />
    </>
  ),
  /* No pencil. Three ruled lines say "written" without putting a tool in the
     picture, and a pencil at 14px is a diagonal smudge in every set that has
     one. A departure from Material, and a deliberate one. */
  edit_note: (
    <>
      <path d="M3 5.5 L17 5.5" />
      <path d="M3 10 L17 10" />
      <path d="M3 14.5 L11 14.5" />
    </>
  ),
  expand_more: <path d="M4.5 7.5 L10 13 L15.5 7.5" />,
  grid_view: (
    <>
      <path d="M3 3 L8 3 L8 8 L3 8 Z" />
      <path d="M12 3 L17 3 L17 8 L12 8 Z" />
      <path d="M3 12 L8 12 L8 17 L3 17 Z" />
      <path d="M12 12 L17 12 L17 17 L12 17 Z" />
    </>
  ),
  /* A larger centre figure in front of two smaller ones. Material gets its depth
     from fills, where a figure in front occludes the one behind; a stroked set
     has no occlusion, so the depth is made by gaps — the back figures' shoulders
     stop clear of the front torso and the white does the work a fill would. The
     cost is that the back two are a head and one sloping shoulder rather than
     whole people, which is a drawing convention and reads as one. */
  groups: (
    <>
      <circle cx="3.4" cy="7.4" r="1.7" />
      <path d="M1.2 16.2 L1.9 12.5 L4.6 12.5" />
      <circle cx="16.6" cy="7.4" r="1.7" />
      <path d="M18.8 16.2 L18.1 12.5 L15.4 12.5" />
      <circle cx="10" cy="8.8" r="2.4" />
      <path d="M6 17 L7 13.1 L13 13.1 L14 17" />
    </>
  ),
  how_to_reg: (
    <>
      <circle cx="6.5" cy="6.5" r="2.5" />
      <path d="M1.8 17 L2.9 12.5 L10.1 12.5 L11.2 17" />
      <path d="M12.2 12.5 L14.4 14.7 L18.4 10.7" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 4 L17 4 L17 16.5 L3 16.5 Z" />
      <path d="M3 11.5 L7 11.5 L8.2 13.5 L11.8 13.5 L13 11.5 L17 11.5" />
    </>
  ),
  light_mode: (
    <>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2 L10 4.2" />
      <path d="M10 15.8 L10 18" />
      <path d="M2 10 L4.2 10" />
      <path d="M15.8 10 L18 10" />
      <path d="M14.1 5.9 L15.66 4.34" />
      <path d="M5.9 5.9 L4.34 4.34" />
      <path d="M14.1 14.1 L15.66 15.66" />
      <path d="M5.9 14.1 L4.34 15.66" />
    </>
  ),
  /* The sweep flag on the shackle is 0, and it was 1 until someone looked at
     the glyph at 120px. SVG's y axis points down, so a sweep of 1 runs the arc
     *clockwise on screen* — which took the shackle from the right leg down
     through the body and out the left, drawing a box with a bite out of its top
     rather than a padlock. It is the kind of error that is invisible at 14px
     and unmistakable once enlarged, which is the argument for drawing every
     glyph at size before trusting it. */
  lock_open: (
    <>
      <path d="M3.5 9.5 L16.5 9.5 L16.5 17 L3.5 17 Z" />
      <path d="M13.3 9.5 L13.3 6.3 A3.5 3.5 0 0 0 6.5 6.3" />
    </>
  ),
  menu: (
    <>
      <path d="M3 6 L17 6" />
      <path d="M3 10 L17 10" />
      <path d="M3 14 L17 14" />
    </>
  ),
  more_horiz: (
    <>
      <circle cx="4.6" cy="10" r="1" />
      <circle cx="10" cy="10" r="1" />
      <circle cx="15.4" cy="10" r="1" />
    </>
  ),
  notifications: (
    <>
      <path d="M5.8 14.4 L5.8 9.2 A4.2 4.2 0 0 1 14.2 9.2 L14.2 14.4" />
      <path d="M3.8 14.4 L16.2 14.4" />
      <path d="M8.4 15.6 A1.7 1.7 0 0 0 11.6 15.6" />
    </>
  ),
  search: (
    <>
      <circle cx="8.8" cy="8.8" r="5" />
      <path d="M12.5 12.5 L17 17" />
    </>
  ),
  /* Sliders, not a gear. A gear is a wheel of teeth: curves and fine detail in
     every direction, and it collapses into a blob below 18px. Three rails with
     handles says the same word, survives 14px, and is built from the straight
     lines this grammar is made of. */
  settings: (
    <>
      <path d="M3 6 L17 6" />
      <path d="M3 10 L17 10" />
      <path d="M3 14 L17 14" />
      <path d="M7 4 L7 8" />
      <path d="M13 8 L13 12" />
      <path d="M6 12 L6 16" />
    </>
  ),
  share: (
    <>
      <circle cx="5" cy="10" r="1.9" />
      <circle cx="15" cy="5.5" r="1.9" />
      <circle cx="15" cy="14.5" r="1.9" />
      <path d="M6.7 9.1 L13.3 6.4" />
      <path d="M6.7 10.9 L13.3 13.6" />
    </>
  ),
  sports: (
    <>
      <circle cx="7.6" cy="11.8" r="4.2" />
      <circle cx="7.6" cy="11.8" r="1.3" />
      <path d="M11.5 10.4 L17.6 10.4 L17.6 13.2 L11.5 13.2" />
    </>
  ),
  /* The busiest glyph in the set by a distance: a circle, a pentagon and five
     spokes is eleven segments inside twenty units. `foundations.md` records the
     fallback if it fails at 14px — a plain circle with one pentagon and no
     spokes, which stops being a football and becomes a ball. */
  sports_soccer: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 7 L12.85 9.07 L11.76 12.43 L8.24 12.43 L7.15 9.07 Z" />
      <path d="M10 7 L10 3" />
      <path d="M12.85 9.07 L16.66 7.84" />
      <path d="M11.76 12.43 L14.11 15.66" />
      <path d="M8.24 12.43 L5.89 15.66" />
      <path d="M7.15 9.07 L3.34 7.84" />
    </>
  ),
  /* The bowl seen from above with the pitch inside it, rather than an elevation.
     The outer form is literally the geometric shape called a stadium, and the
     hard-cornered rectangle inside is what stops it reading as a capsule — the
     one place this set mixes a round object with a squared one on purpose.

     A ground, not a crest: it says "club" without going anywhere near a
     trademark, which is the same instinct that keeps `Team.logo` stored and
     never rendered. */
  stadium: (
    <>
      <path d="M6.8 4.8 L13.2 4.8 A 5.2 5.2 0 0 1 13.2 15.2 L6.8 15.2 A 5.2 5.2 0 0 1 6.8 4.8 Z" />
      <path d="M6.6 7.8 L13.4 7.8 L13.4 12.2 L6.6 12.2 Z" />
    </>
  ),
  /* The one closed outline in the set, and so the only glyph `filled` can act
     on — see FILLABLE below. Sharper points and a heavier core than Material's,
     because it has to survive 14px inside a chip. */
  star: (
    <path d="M10 3.3 L12 7.75 L16.85 8.28 L13.23 11.55 L14.23 16.33 L10 13.9 L5.77 16.33 L6.77 11.55 L3.15 8.28 L8 7.75 Z" />
  ),
  /* An exact mirror of `trending_up`, which Material's pair is not. On a squad
     row where both sit side by side forty times, that asymmetry was visible. */
  trending_down: (
    <>
      <path d="M2.5 6.5 L8 12 L11 9 L17.5 15.5" />
      <path d="M12.5 15.5 L17.5 15.5 L17.5 10.5" />
    </>
  ),
  trending_up: (
    <>
      <path d="M2.5 13.5 L8 8 L11 11 L17.5 4.5" />
      <path d="M12.5 4.5 L17.5 4.5 L17.5 9.5" />
    </>
  ),
  trophy: (
    <>
      <path d="M6.2 3.5 L13.8 3.5 L13.8 8.2 A3.8 3.8 0 0 1 6.2 8.2 Z" />
      <path d="M6.2 5 L3.8 5 L3.8 7.6 A2.4 2.4 0 0 0 6.2 10" />
      <path d="M13.8 5 L16.2 5 L16.2 7.6 A2.4 2.4 0 0 1 13.8 10" />
      <path d="M10 12 L10 15" />
      <path d="M6.8 17 L13.2 17" />
    </>
  ),
  /* A bound book with a spine and two ruled lines, rather than Material's two
     abstract panes. It is the diary, so it should look like one. */
  two_pager: (
    <>
      <path d="M3.5 3 L16.5 3 L16.5 17 L3.5 17 Z" />
      <path d="M7 3 L7 17" />
      <path d="M9.5 7.5 L14 7.5" />
      <path d="M9.5 11 L14 11" />
    </>
  ),
  /* Two panels with a 4.5-unit gap between them. The obvious 2-unit gap does not
     survive: each panel's ink spreads half a stroke inward, which leaves a
     quarter of a unit of white — under a pixel at 14px, where the pair fuses
     into one divided box instead of reading as two cards. */
  view_agenda: (
    <>
      <path d="M3 3.25 L17 3.25 L17 7.75 L3 7.75 Z" />
      <path d="M3 12.25 L17 12.25 L17 16.75 L3 16.75 Z" />
    </>
  ),
  /* Dashes and lines, not squares and lines. A leading square wide enough to
     read needs a channel wide enough to survive a 1.75 stroke, and the two
     together did not fit three times over. A short dash carries the same meaning
     with half the ink. */
  view_list: (
    <>
      <path d="M3 5.3 L5 5.3" />
      <path d="M7.5 5.3 L17 5.3" />
      <path d="M3 10 L5 10" />
      <path d="M7.5 10 L17 10" />
      <path d="M3 14.7 L5 14.7" />
      <path d="M7.5 14.7 L17 14.7" />
    </>
  ),
  visibility: (
    <>
      <path d="M2.5 10 A8.5 5.5 0 0 1 17.5 10" />
      <path d="M17.5 10 A8.5 5.5 0 0 1 2.5 10" />
      <circle cx="10" cy="10" r="2.5" />
    </>
  ),
}

/**
 * The glyphs a fill can act on, which is one of them.
 *
 * Filled means "on" — that rule survives the move off Material Symbols
 * unchanged. What changes is that Material had a FILL axis on every glyph,
 * where a stroked set only has an inside to fill if the outline closes. Every
 * icon above but `star` is one or more open paths; painting those would close
 * each one implicitly and draw a wedge, so `<Icon filled>` leaves them alone.
 *
 * Nothing is lost by it. The two arrows and the note only ever appear filled
 * inside a chip that is already carrying the state in its tint, its border and
 * its ink — which is where the design put the weight in the first place.
 */
export const FILLABLE: ReadonlySet<IconName> = new Set<IconName>(['star'])

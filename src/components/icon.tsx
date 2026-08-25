import type { IconName } from './icon-names'
import { FILLABLE } from './icon-paths'

/** The sizes `foundations.md` allows, by the role each one is for. */
const SIZES = {
  /** 14px — badges and micro-labels. */
  xs: 'icon-xs',
  /** 16px — chips. */
  sm: 'icon-sm',
  /** 18px — buttons and fields. */
  md: 'icon-md',
  /** 20px — the default. */
  base: '',
  /** 22px — large icon buttons. */
  lg: 'icon-lg',
} as const

type Props = {
  name: IconName
  /**
   * "On" — an applied verdict. Nothing else fills.
   *
   * Honoured only for a glyph whose outline closes, which in this set is the
   * star alone; see `FILLABLE` in [`icon-paths.tsx`](./icon-paths.tsx) for why
   * an open path has no inside to paint. Callers pass it by meaning and the
   * icon module decides whether there is anything to do, which is the way round
   * that keeps glyph geometry out of the call sites.
   */
  filled?: boolean
  size?: keyof typeof SIZES
  className?: string
}

/**
 * One glyph from Madooo's own set.
 *
 * The geometry lives in the sprite `IconSprite` renders once per document; this
 * is a `<use>` pointing into it. The name reaches the DOM as a fragment
 * reference rather than as text, which is the substantive difference from the
 * Material Symbols ligature this replaces — a misspelled name there rendered
 * the literal word "trending_up" on screen until the font arrived, and there is
 * no font here to arrive. `IconName` makes a typo a compile error either way.
 *
 * Always `aria-hidden`: every icon in this design sits beside a label that
 * already says the same thing, so announcing it would just repeat. An icon that
 * ever stands alone needs a label on the control around it, not here.
 *
 * Colour is never set here. The stroke is `currentColor`, so an icon takes the
 * colour of whatever holds it — which is what keeps a chip's glyph and its text
 * from ever drifting apart.
 */
export function Icon({ name, filled = false, size = 'base', className }: Props) {
  const classes = ['icon', SIZES[size], filled && FILLABLE.has(name) && 'icon-filled', className]
    .filter(Boolean)
    .join(' ')

  return (
    <svg aria-hidden focusable="false" className={classes}>
      <use href={`#i-${name}`} />
    </svg>
  )
}

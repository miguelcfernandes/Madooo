import { ICON_NAMES } from './icon-names'
import { ICON_PATHS } from './icon-paths'

/**
 * Every glyph in the set, defined once per document.
 *
 * `<Icon>` draws a `<use href="#i-name">`, which is a reference rather than a
 * copy — so a squad page with forty rows and three chips on each sends the
 * geometry once and points at it a hundred and twenty times. Inlining the paths
 * per instance would put the same twenty-odd path commands into the payload on
 * every one of them.
 *
 * Rendered as the first child of `<body>` in the root layout, which is the only
 * place that satisfies both halves of what `<use>` needs: a reference resolves
 * within its own document, and the symbol has to already be in it. The root
 * layout is not re-rendered on client-side navigation, so it is also the only
 * place the sprite survives a route change without being torn down and rebuilt.
 *
 * `<symbol>` never renders where it is defined, so the wrapper is invisible by
 * construction rather than by the styles below — those exist so the element
 * cannot take part in layout at all, which `display: none` would achieve at the
 * cost of making every reference into it resolve to nothing in Safari.
 */
export function IconSprite() {
  return (
    <svg
      aria-hidden
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {ICON_NAMES.map((name) => (
          <symbol key={name} id={`i-${name}`} viewBox="0 0 20 20">
            {ICON_PATHS[name]}
          </symbol>
        ))}
      </defs>
    </svg>
  )
}

import { Icon } from './icon'
import type { Layout } from '@/lib/rankings'

/**
 * Rows or cards: the app's first segmented control.
 *
 * Two buttons rather than a third `<select>`, because the choice is between two
 * things and both fit on screen — foundations' own reason for preferring tabs to
 * a dropdown wherever the options are few.
 *
 * **The selected one fills with `--surface-inverse`**, which is what the filled
 * button uses. The glyph itself does not fill: foundations scopes that to an
 * applied verdict, and the inverse fill already says "on" here without borrowing
 * a signal that means something else. It would be a no-op in any case — the two
 * layout glyphs are open paths, and only a closed outline has an inside.
 *
 * `aria-pressed` rather than `role="tablist"`: these do not switch between
 * panels, they redraw one. A tablist would promise arrow-key navigation between
 * tab stops that do not exist.
 */

const OPTIONS: readonly { layout: Layout; icon: 'view_list' | 'grid_view'; label: string }[] = [
  { layout: 'list', icon: 'view_list', label: 'Show as rows' },
  { layout: 'grid', icon: 'grid_view', label: 'Show as cards' },
]

/** Written out per state, since Tailwind reads class names as source text. */
const SELECTED = 'bg-surface-inverse text-inverse'
const RESTING = 't-hover text-muted hover:bg-surface-alt hover:text-text'

export function LayoutToggle({
  layout,
  onChange,
}: {
  layout: Layout
  onChange: (layout: Layout) => void
}) {
  return (
    <div role="group" aria-label="Layout" className="flex items-center gap-1">
      {OPTIONS.map((option) => {
        const current = option.layout === layout

        return (
          <button
            key={option.layout}
            type="button"
            aria-pressed={current}
            onClick={() => onChange(option.layout)}
            className={`flex size-(--control-h-lg) items-center justify-center focus-visible:focus-ring md:size-(--control-h) ${
              current ? SELECTED : RESTING
            }`}
          >
            <Icon name={option.icon} size="md" />
            {/* The icon is `aria-hidden`, as every icon in this app is, so the
                button would otherwise have no accessible name at all. */}
            <span className="sr-only">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

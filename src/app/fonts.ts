/**
 * The two typefaces `docs/design/foundations.md` specifies, loaded once.
 *
 * Two, where there were three. The third was Material Symbols, and the rebrand
 * retired it: the icons are Madooo's own now, drawn as SVG, so there is no icon
 * font to fetch, no subset to keep in sync with the code, and no render-blocking
 * request in front of the first paint. See `src/components/icon-paths.tsx`.
 *
 * Next's own guidance is that every call to a font loader creates a separate
 * hosted instance of that font, so the same family loaded in two files is
 * downloaded twice. Hence one module that everything imports.
 *
 * Both are self-hosted: `next/font` downloads them at build time and serves
 * them from our own origin, so the browser never talks to Google. That is a
 * privacy property, not just a speed one.
 */

import { DM_Mono, Schibsted_Grotesk } from 'next/font/google'

/**
 * Everything spoken. Variable, so no `weight` is needed — the whole 400–900
 * axis comes in one file, which covers the five weights the type scale uses.
 */
export const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-schibsted-grotesk',
})

/**
 * Everything counted: scores, tallies, shirt numbers, dates, minute marks.
 *
 * Not a variable font, so each weight is a separate file and the ones asked for
 * here are the ones downloaded. The scale uses two — 400 for `text-data` and
 * 500 for the three larger numeric roles — so those two are what it fetches.
 * The brand also names 300; nothing draws it, and a third file for a weight no
 * role uses is bytes on every page load. It goes in the moment a role wants it.
 *
 * 500 is also the ceiling of the family, which is a known and accepted
 * consequence rather than an oversight: JetBrains Mono went to 700, so the
 * scoreline is quieter now than it used to be. `foundations.md` records why
 * that is not a bug to fix.
 */
export const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-mono',
})

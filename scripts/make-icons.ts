/**
 * Draws the app icon — the letter M, white on marine, square — and writes the
 * three files Next serves it from.
 *
 * **Why this exists as a script rather than as `icon.tsx`.** Next can generate
 * an icon per request from a route file, and that would put a font fetch and a
 * rasteriser in the build of every deployment to produce three bytes-identical
 * files. `foundations.md` calls the icon a fixed mark; a fixed mark is an asset.
 * So this runs by hand, writes the assets, and they are committed.
 *
 * **Why it was blocked until now.** The rebrand shipped without it because
 * rendering the real Schibsted Grotesk letterform needs a font toolchain the
 * repository did not appear to have, and `foundations.md` is explicit that
 * hand-drawing an approximate M is not an acceptable substitute — it would put a
 * letterform that is not the brand's typeface on the one mark that carries the
 * brand alone. The toolchain turned out to be present: `next/og` bundles satori
 * and resvg, so Next ships both a shaper and a rasteriser, and neither is a new
 * dependency.
 *
 * Run with `npm run icons`.
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { ImageResponse } from 'next/og'

/**
 * `--brand` in light, which is `--marine-700`.
 *
 * The one place in the repository outside `globals.css` that names a brand hex,
 * and it is not a violation of the no-hex rule: that rule governs *product
 * code*, and this is a build tool writing a PNG. A PNG cannot hold a CSS
 * variable. The icon also does not theme — it sits on somebody's home screen,
 * where there is no document to read a `data-theme` off — so it takes the light
 * value and stays there.
 */
const MARINE = '#0f5257'
const INK = '#ffffff'

/**
 * The real typeface, at the real weight, fetched rather than committed.
 *
 * Google serves a static instance of the variable font when the request looks
 * old enough not to understand woff2, which is the whole trick: satori cannot
 * instance a variable font, and `wght@800` here is the ExtraBold the wordmark
 * is set in.
 */
const LEGACY_UA = 'Mozilla/5.0 (Linux; U; Android 2.3.6; en-us; Nexus S Build/GRK39F) AppleWebKit/533.1'

async function schibstedExtraBold(): Promise<ArrayBuffer> {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@800', {
    headers: { 'User-Agent': LEGACY_UA },
  }).then((r) => r.text())

  const url = css.match(/url\((https:\/\/[^)]+\.ttf)\)/)?.[1]
  if (url === undefined) throw new Error('Google Fonts did not serve a TTF for Schibsted Grotesk 800')

  return fetch(url).then((r) => r.arrayBuffer())
}

/**
 * One square PNG.
 *
 * `0.78` is the cap height the mark wants, arrived at by rendering and looking:
 * an M set to the full box is a letter in a box, and the icon is a mark. The
 * negative `marginTop` corrects the line box rather than the glyph — satori
 * centres the *line*, which carries descender space the M does not use, so a
 * naively centred M sits visibly high in its square.
 */
async function square(size: number, font: ArrayBuffer): Promise<Buffer> {
  const image = new ImageResponse(
    createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: MARINE,
          color: INK,
          fontFamily: 'Schibsted Grotesk',
          fontWeight: 800,
          fontSize: Math.round(size * 0.78),
          lineHeight: 1,
        },
      },
      createElement('div', { style: { marginTop: `${-size * 0.032}px`, display: 'flex' } }, 'M'),
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: 'Schibsted Grotesk', data: font, weight: 800, style: 'normal' }],
    },
  )

  return Buffer.from(await image.arrayBuffer())
}

/**
 * A PNG-in-ICO container, written by hand because it is twenty-two bytes of
 * header per image and the alternative is a dependency.
 *
 * Every browser since IE 11 reads PNG payloads inside an ICO, and the file this
 * replaces was already built that way — so this changes the drawing and not the
 * format.
 */
function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // 1 = icon
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries: Buffer[] = []

  for (const { size, png } of images) {
    const entry = Buffer.alloc(16)
    // 0 means 256 in this field; nothing here is that large, but the rule is
    // the format's rather than ours.
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette size — none, this is truecolour
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += png.length
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)])
}

async function main() {
  const font = await schibstedExtraBold()
  const app = join(process.cwd(), 'src', 'app')

  // 192 is the size Next's `icon.png` convention advertises to a browser, and
  // 180 is Apple's touch icon. Both are full-bleed squares: iOS applies its own
  // mask, and drawing a radius here would put one in a system that has none.
  const icon = await square(192, font)
  writeFileSync(join(app, 'icon.png'), icon)

  const apple = await square(180, font)
  writeFileSync(join(app, 'apple-icon.png'), apple)

  // Three sizes, as the file this replaces carried. 16 is the tab, 32 is the
  // bookmark bar and the task bar, 48 is Windows' list view.
  const favicon = ico(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await square(size, font) }))),
  )
  writeFileSync(join(app, 'favicon.ico'), favicon)

  console.log('icon.png 192 · apple-icon.png 180 · favicon.ico 16/32/48')
}

main()

/**
 * Pick the club colours nobody has confirmed yet.
 *
 *   npm run colours                 http://127.0.0.1:4780
 *   npm run colours -- --port 5000  somewhere else
 *   npm run colours -- --all        painted clubs too, not just the empty ones
 *
 * A local page, one row per club, with the crest chip drawn exactly as the app
 * draws it. Pick a colour, watch the chip, save. Saving writes `Team.code` and
 * `Team.colour` straight into the configured branch — development unless
 * `DATABASE_TARGET=production` is put in front of the command, the same rule
 * every other script here follows.
 *
 * **Why this exists.** Club colours are the one part of adding a league that
 * cannot be automated: API-Football publishes none, and a plausible-looking
 * published primary is wrong about a quarter of the time — five of twenty in La
 * Liga, thirteen of eighteen in Serie A. Wrong *quietly*, too, because a chip in
 * the wrong red is still a chip. Up to Serie A the answer was to draft twenty
 * colours and have the author correct them on sight. Three leagues at once is 52
 * clubs, which is past where that works: correcting a draft means holding the
 * right answer in mind while looking at a wrong one, 52 times.
 *
 * So the draft is gone. A club with no confirmed colour holds null in
 * `seed-team-identity.ts` and draws the neutral fallback, and this is the screen
 * that turns null into an answer.
 *
 * **Saving writes the database, and the table in `seed-team-identity.ts` is
 * still the source of truth.** Those are not in tension, they are two different
 * jobs: the write is what lets the author reload `/fixtures` and see the chip in
 * place, and the TypeScript block this page also emits is what carries the
 * colours to production, where this tool never runs. Paste the block back into
 * `seed-team-identity.ts` when the picking is done. `npm run db:seed-teams` is
 * then the only thing production needs.
 *
 * **Not a route under `src/app/`, deliberately.** Three reasons, any one of them
 * sufficient: it writes columns no user may write; it is a tool for the person
 * who builds the app rather than a screen for the people who use it; and a page
 * under `src/app/` would need `LEAGUES`, which `AGENTS.md`'s first constraint
 * forbids there. A script has none of those problems.
 *
 * No new dependency. `node:http` and a string of HTML is the whole of it — a
 * tool the author runs a handful of times a season should not put a framework in
 * the lockfile.
 */

import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

import { createServer, type IncomingMessage } from 'node:http'

import { leagueRank } from '../src/lib/leagues'

/**
 * Not 4321, which was the first choice and the wrong one: that is **Astro's
 * default dev port**, and this laptop runs an Astro project. The two servers did
 * not conflict in the way a port clash usually announces itself — this one binds
 * `127.0.0.1` and Astro binds `::1`, so both started happily and `localhost:4321`
 * in a browser then resolved to whichever of IPv4 and IPv6 the OS tried first.
 * A tool that silently shows you somebody else's website is worse than one that
 * refuses to start.
 *
 * So: a port no popular dev server defaults to, and `listen` below steps past a
 * busy one rather than dying, because several of these may run at once.
 */
const DEFAULT_PORT = 4780

/** How many ports past the first to try before giving up. */
const PORT_ATTEMPTS = 20

/** Loopback only. This writes to the database and authenticates nobody. */
const HOST = '127.0.0.1'

interface Options {
  port: number
  all: boolean
}

function parseArgs(argv: string[]): Options {
  const options: Options = { port: DEFAULT_PORT, all: false }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--all') {
      options.all = true
    } else if (arg === '--port') {
      const value = Number(argv[++index])
      if (!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new Error('--port takes a port number, e.g. --port 5000')
      }
      options.port = value
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

/**
 * Cut the clubs into sections, most-followed competition first.
 *
 * `leagueRank` is the app's own order, imported rather than restated — this page
 * and `/fixtures` disagreeing about which league leads would be a small thing
 * that still costs a moment's doubt every time the tool is opened. It is pure
 * and Prisma-free, which is what makes it importable from a script at all.
 */
function byLeague(clubs: Club[]): [string, Club[]][] {
  const groups = new Map<string, Club[]>()
  for (const club of clubs) {
    const open = groups.get(club.leagueName)
    if (open === undefined) groups.set(club.leagueName, [club])
    else open.push(club)
  }

  return [...groups.entries()].sort(([a], [b]) => {
    const order = leagueRank({ name: a }) - leagueRank({ name: b })
    return order !== 0 ? order : a.localeCompare(b)
  })
}

/** One row on the page: a club, and the competition it is listed under. */
interface Club {
  /** Our own primary key. What a save is keyed by — see `saveClubs`. */
  id: number
  /** The provider's id. What the emitted TypeScript block is keyed by. */
  apiFootballId: number
  name: string
  code: string | null
  colour: string | null
  leagueId: number
  leagueName: string
}

/* --------------------------------------------------------------- reading -- */

/**
 * Every club with a fixture this season, with the competition it plays in.
 *
 * The league comes from `Match`, because `Team` has no league column — a club
 * belongs to a competition only by having played in it, which is also what makes
 * the same query right when a club is promoted. This is `clubLeagues` in
 * [`teams/directory.ts`](../src/lib/teams/directory.ts) folded together with
 * `clubIdentities`, rather than imported: those two are shaped for a page that
 * needs verdict tallies alongside, and this needs neither.
 */
async function readClubs(): Promise<Club[]> {
  const { season } = await import('../src/lib/env')
  const { prisma } = await import('../src/lib/prisma')

  const currentSeason = season()

  const [home, away, leagues, teams] = await Promise.all([
    prisma.match.groupBy({ by: ['homeTeamId', 'leagueId'], where: { season: currentSeason } }),
    prisma.match.groupBy({ by: ['awayTeamId', 'leagueId'], where: { season: currentSeason } }),
    prisma.league.findMany({ select: { id: true, name: true } }),
    prisma.team.findMany({
      where: {
        OR: [
          { homeMatches: { some: { season: currentSeason } } },
          { awayMatches: { some: { season: currentSeason } } },
        ],
      },
      select: { id: true, apiFootballId: true, name: true, code: true, colour: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const leagueName = new Map(leagues.map((league) => [league.id, league.name]))

  // A club plays home and away, so both groupings name it. Last write wins and
  // they agree — a club has one league in one season.
  const leagueOf = new Map<number, number>()
  for (const row of home) leagueOf.set(row.homeTeamId, row.leagueId)
  for (const row of away) leagueOf.set(row.awayTeamId, row.leagueId)

  const clubs: Club[] = []
  for (const team of teams) {
    const leagueId = leagueOf.get(team.id)
    // A team row with no fixture this season cannot reach here — the `where`
    // above requires one — so this is unreachable rather than a case to handle.
    // Skipped rather than defaulted, because inventing a league would put a club
    // under a heading that is not true.
    if (leagueId === undefined) continue
    clubs.push({
      id: team.id,
      apiFootballId: team.apiFootballId,
      name: team.name,
      code: team.code,
      colour: team.colour,
      leagueId,
      leagueName: leagueName.get(leagueId) ?? 'Unknown competition',
    })
  }

  return clubs
}

/* --------------------------------------------------------------- writing -- */

interface Edit {
  id: number
  code: string | null
  colour: string | null
}

/** `"#DA291C"` and `"da291c"` both to `"#da291c"`; anything else to null. */
function normaliseHex(value: string | null): string | null {
  if (value === null) return null
  const hex = value.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return `#${hex.toLowerCase()}`
}

/**
 * Write the edits, keyed by our own `Team.id`.
 *
 * **Not by `apiFootballId`, unlike `seed-team-identity.ts`.** That script is a
 * table typed by hand against a payload, so it needs the provider's id and a
 * name guard to catch a typo. This is a form rendered from rows this process
 * read moments ago; the id came out of the database rather than off a keyboard,
 * so there is nothing to guard against.
 *
 * A null colour clears the column, which is the one place this differs from the
 * seed script: emptying the field on this page is an instruction to unpaint a
 * club, where a null in the table means "not stated here".
 */
async function saveClubs(edits: Edit[]): Promise<number> {
  const { prisma } = await import('../src/lib/prisma')

  let saved = 0
  for (const edit of edits) {
    await prisma.team.update({
      where: { id: edit.id },
      data: {
        code: edit.code === null || edit.code.trim() === '' ? null : edit.code.trim().toUpperCase(),
        colour: normaliseHex(edit.colour),
      },
    })
    saved += 1
  }
  return saved
}

/* -------------------------------------------------------------- the block -- */

/** `'` inside a TypeScript single-quoted string. No club name has one today. */
function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/**
 * The clubs as `seed-team-identity.ts` writes them, ready to paste.
 *
 * Keyed by `apiFootballId` and carrying the provider's spelling of the name,
 * because that is what the seed table's guard compares against — a block emitted
 * with our own ids would be silently useless there.
 *
 * **It covers the clubs the page is showing, and nothing else.** That is a
 * correctness rule rather than a convenience: the seed table deliberately holds
 * clubs with no fixture this season — Southampton, Ipswich and the rest of the
 * 2024/25 twenty — precisely so that changing `SEASON` does not blank a chip.
 * This tool cannot see them, because a club reaches it by having played. A block
 * of "every club I can see", pasted over `IDENTITIES` whole, would delete every
 * one of them without saying so.
 *
 * So the block is scoped to the rows in front of the author, which is the block
 * they actually mean to paste, and the page says so above the textarea.
 */
function identityBlock(clubs: Club[]): string {
  const sections: string[] = []
  for (const [league, members] of byLeague(clubs)) {
    const lines = [...members]
      .sort((a, b) => a.apiFootballId - b.apiFootballId)
      .map((club) => {
        const code = club.code === null ? 'null' : quote(club.code)
        const colour = club.colour === null ? 'null' : quote(club.colour)
        return `  ${club.apiFootballId}: { name: ${quote(club.name)}, code: ${code}, colour: ${colour} },`
      })
    sections.push(`  // ${league}\n${lines.join('\n')}`)
  }

  return sections.join('\n\n')
}

/* ------------------------------------------------------------------ page -- */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The tokens this page borrows from
 * [`globals.css`](../src/app/globals.css), and only the ones a crest chip
 * resolves to.
 *
 * **Copied rather than imported, and that is the honest trade.** `crest()`
 * returns `var(--surface-sunken)` and `var(--gray-9)` for the fallback and the
 * ink, so a page that means to draw the real chip has to be able to resolve
 * those four names. Importing the stylesheet would mean running Tailwind over a
 * script's output for four values.
 *
 * They are also the four least likely tokens in the set to move: `--gray-0` and
 * `--gray-9` are white and black, and `foundations.md` guarantees the neutral
 * ramp never changes across themes, which is the whole reason `crestInk` names
 * them rather than `--text-inverse`.
 */
const TOKENS = `
  :root {
    --gray-0: #ffffff;
    --gray-1: #f8f8f8;
    --gray-2: #eeeeee;
    --gray-3: #dddddd;
    --gray-4: #cccccc;
    --gray-7: #595959;
    --gray-9: #000000;
    --gray-85: #2b2b2b;
    --gray-90: #212121;

    --page: var(--gray-1);
    --surface: var(--gray-0);
    --surface-sunken: var(--gray-2);
    --border: var(--gray-3);
    --text: var(--gray-9);
    --text-muted: var(--gray-7);
  }

  [data-theme='dark'] {
    --page: var(--gray-90);
    --surface: var(--gray-90);
    --surface-sunken: #191919;
    --border: #3d3d3d;
    --text: var(--gray-0);
    --text-muted: var(--gray-4);
  }
`

/**
 * The ink rule, in the browser.
 *
 * **A second copy of `crestInk` in
 * [`teams/identity.ts`](../src/lib/teams/identity.ts), and it is deliberate.**
 * The chip has to repaint while the author drags the picker, which means the
 * rule has to run client-side; the real one is a module-scoped function whose
 * two helpers are not exported, so it cannot be shipped to a browser without
 * exporting internals of product code for a script's benefit.
 *
 * The duplication is bounded and its failure is mild: if the two drift, this
 * page previews black-on-a-colour where the app draws white, which is visible
 * immediately and costs a wrong ink in a dev tool rather than wrong data. The
 * threshold and the gamma curve below are copied verbatim; **if `crestInk`
 * changes, change this too.**
 */
const INK_RULE = `
  function relativeLuminance(r, g, b) {
    const channel = (value) => {
      const srgb = value / 255
      return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }

  function crestInk(hex) {
    const clean = String(hex).trim().replace(/^#/, '')
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return relativeLuminance(r, g, b) > 0.179 ? 'var(--gray-9)' : 'var(--gray-0)'
  }
`

function clubRow(club: Club): string {
  const code = escapeHtml(club.code ?? '')
  const colour = club.colour ?? ''
  // The picker needs a value even when the club has none. Mid-grey rather than
  // black: an untouched picker showing #000000 reads as "this club is black",
  // which is a guess, and black is a real answer for six clubs already.
  const swatch = colour === '' ? '#808080' : colour

  return `
    <li class="club" data-id="${club.id}" data-painted="${colour === '' ? 'no' : 'yes'}">
      <span class="chip chip-sm" data-chip>${escapeHtml(club.code ?? club.name.slice(0, 3).toUpperCase())}</span>
      <span class="chip chip-lg" data-chip>${escapeHtml(club.code ?? club.name.slice(0, 3).toUpperCase())}</span>
      <span class="club-name">
        ${escapeHtml(club.name)}
        <small>${club.apiFootballId}</small>
      </span>
      <input class="code" type="text" maxlength="4" value="${code}" aria-label="Code for ${escapeHtml(club.name)}" />
      <input class="picker" type="color" value="${swatch}" aria-label="Colour for ${escapeHtml(club.name)}" />
      <input class="hex" type="text" spellcheck="false" placeholder="not set" value="${escapeHtml(colour)}" aria-label="Hex for ${escapeHtml(club.name)}" />
      <button class="clear" type="button" title="Clear this colour">clear</button>
    </li>`
}

function page(clubs: Club[], branch: string, showAll: boolean): string {
  const shown = showAll ? clubs : clubs.filter((club) => club.colour === null)
  const unpainted = clubs.filter((club) => club.colour === null).length

  const sections = byLeague(shown)
    .map(
      ([league, members]) => `
      <section>
        <h2>${escapeHtml(league)} <small>${members.length} clubs</small></h2>
        <ul class="clubs">${members.map(clubRow).join('')}</ul>
      </section>`,
    )
    .join('')

  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Madooo — club colours</title>
<style>
${TOKENS}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0 0 6rem;
  background: var(--page);
  color: var(--text);
  font: 15px/1.5 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
}
header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1.5rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
header h1 { font-size: 1rem; margin: 0; font-weight: 700; letter-spacing: 0.01em; }
header .spacer { flex: 1; }
.muted { color: var(--text-muted); font-size: 0.85rem; }
button {
  font: inherit;
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}
button:hover { background: var(--surface-sunken); }
button.primary {
  background: var(--text);
  color: var(--surface);
  border-color: var(--text);
  font-weight: 600;
}
button.primary:disabled { opacity: 0.45; cursor: default; }
main { max-width: 62rem; margin: 0 auto; padding: 1.5rem; }
section { margin-bottom: 2.5rem; }
h2 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}
h2 small { font-weight: 400; text-transform: none; letter-spacing: 0; }
ul.clubs { list-style: none; margin: 0; padding: 0; }
li.club {
  display: grid;
  grid-template-columns: 3rem 2.75rem 1fr 4.5rem 3rem 7rem 4rem;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  margin-bottom: 0.4rem;
}
li.club[data-painted='no'] { border-left: 3px solid var(--text-muted); }
li.club[data-dirty='yes'] { border-left: 3px solid #0f9d58; }
.club-name { font-weight: 500; }
.club-name small { display: block; color: var(--text-muted); font-weight: 400; font-size: 0.75rem; }

/* The chip, as src/components/crest-chip.tsx draws it: the sm row is 20px on
   --radius-sm, the lg one a 40px square on --radius-md. Bold, tracked and
   capitalised, which is what three letters on a saturated colour need. */
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--surface-sunken);
  color: var(--text-muted);
}
.chip-sm { height: 20px; padding: 0 6px; border-radius: 4px; font-size: 11px; }
.chip-lg { width: 40px; height: 40px; border-radius: 8px; font-size: 11px; }

input[type='text'] {
  font: inherit;
  width: 100%;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}
input.hex { font-family: ui-monospace, 'JetBrains Mono', monospace; font-size: 0.85rem; }
input.code { text-transform: uppercase; }
input[type='color'] {
  width: 100%;
  height: 2rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: none;
  cursor: pointer;
}
button.clear { padding: 0.25rem 0.4rem; font-size: 0.75rem; color: var(--text-muted); }
#block {
  width: 100%;
  min-height: 18rem;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  white-space: pre;
}
details { margin-top: 2rem; }
summary { cursor: pointer; font-weight: 600; }
.empty { color: var(--text-muted); padding: 2rem 0; }
</style>
</head>
<body>
<header>
  <h1>Club colours</h1>
  <span class="muted" id="status">${unpainted} of ${clubs.length} clubs have no colour · ${escapeHtml(branch)} branch</span>
  <span class="spacer"></span>
  <button type="button" id="theme">dark</button>
  <a href="${showAll ? '/' : '/?all=1'}"><button type="button">${showAll ? 'only unpainted' : 'show all'}</button></a>
  <button type="button" class="primary" id="save" disabled>Save</button>
</header>
<main>
${shown.length === 0 ? '<p class="empty">Every club has a colour. Pass <code>--all</code> or use “show all” to edit the ones already painted.</p>' : sections}

  <details>
    <summary>The block for scripts/seed-team-identity.ts</summary>
    <p class="muted">
      Saving writes the database so the app shows the change now. This block is
      what carries it to production — paste it into <code>IDENTITIES</code>,
      replacing the entries for these leagues, then run
      <code>npm run db:seed-teams</code> wherever it needs to land.
    </p>
    <p class="muted">
      It covers <strong>the clubs listed above and no others</strong>. The table
      in <code>seed-team-identity.ts</code> deliberately keeps clubs with no
      fixture this season — the promoted and relegated — so that changing
      <code>SEASON</code> does not blank a chip. This page cannot see them.
      Replace the entries for these leagues; never paste over the whole table.
    </p>
    <textarea id="block" spellcheck="false" readonly></textarea>
    <p><button type="button" id="copy">Copy</button> <span class="muted" id="copied"></span></p>
  </details>
</main>
<script>
${INK_RULE}

const dirty = new Map()

function paintRow(row) {
  const hex = row.querySelector('.hex').value.trim()
  const code = row.querySelector('.code').value.trim().toUpperCase()
  const ink = crestInk(hex)
  const label = code || row.querySelector('.club-name').firstChild.textContent.trim().replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()

  for (const chip of row.querySelectorAll('[data-chip]')) {
    chip.textContent = label
    if (ink === null) {
      chip.style.backgroundColor = ''
      chip.style.color = ''
    } else {
      chip.style.backgroundColor = hex.startsWith('#') ? hex : '#' + hex
      chip.style.color = ink
    }
  }
}

function markDirty(row) {
  const hex = row.querySelector('.hex').value.trim()
  dirty.set(Number(row.dataset.id), {
    id: Number(row.dataset.id),
    code: row.querySelector('.code').value.trim().toUpperCase() || null,
    colour: crestInk(hex) === null ? null : (hex.startsWith('#') ? hex : '#' + hex).toLowerCase(),
  })
  row.dataset.dirty = 'yes'
  const save = document.getElementById('save')
  save.disabled = dirty.size === 0
  save.textContent = 'Save ' + dirty.size
  refreshBlock()
}

const SHOWN = [...document.querySelectorAll('li.club')].map((row) => row.dataset.id).join(',')

function refreshBlock() {
  fetch('/api/block?ids=' + SHOWN).then((response) => response.text()).then((text) => {
    document.getElementById('block').value = text
  })
}

for (const row of document.querySelectorAll('li.club')) {
  const picker = row.querySelector('.picker')
  const hex = row.querySelector('.hex')
  const code = row.querySelector('.code')

  paintRow(row)

  // 'input' rather than 'change': the chip repaints while the picker is being
  // dragged, which is the whole reason the ink rule is in this page at all.
  picker.addEventListener('input', () => {
    hex.value = picker.value.toLowerCase()
    paintRow(row)
    markDirty(row)
  })

  hex.addEventListener('input', () => {
    const value = hex.value.trim()
    if (crestInk(value) !== null) picker.value = value.startsWith('#') ? value : '#' + value
    paintRow(row)
    markDirty(row)
  })

  code.addEventListener('input', () => {
    paintRow(row)
    markDirty(row)
  })

  row.querySelector('.clear').addEventListener('click', () => {
    hex.value = ''
    // The swatch goes back to the mid-grey an untouched row starts on. Leaving
    // it on the cleared colour would show a club as painted in a colour the row
    // no longer holds, which is the one thing this page must never do.
    picker.value = '#808080'
    paintRow(row)
    markDirty(row)
  })
}

document.getElementById('save').addEventListener('click', async () => {
  const save = document.getElementById('save')
  save.disabled = true
  save.textContent = 'Saving…'
  const response = await fetch('/api/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ teams: [...dirty.values()] }),
  })
  const result = await response.json()
  if (result.ok) {
    document.getElementById('status').textContent = result.saved + ' clubs saved · reload to regroup'
    dirty.clear()
    for (const row of document.querySelectorAll('li.club')) delete row.dataset.dirty
    save.textContent = 'Saved'
    refreshBlock()
  } else {
    document.getElementById('status').textContent = 'Save failed: ' + result.error
    save.disabled = false
    save.textContent = 'Save'
  }
})

document.getElementById('theme').addEventListener('click', () => {
  const root = document.documentElement
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  document.getElementById('theme').textContent = next === 'dark' ? 'light' : 'dark'
})

document.getElementById('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById('block').value)
  document.getElementById('copied').textContent = 'copied'
})

refreshBlock()
</script>
</body>
</html>`
}

/* ---------------------------------------------------------------- server -- */

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      // A form of 52 rows is a couple of kilobytes. Anything past this is not
      // this page, and a local server should not grow a buffer on request.
      if (body.length > 1_000_000) reject(new Error('Body too large'))
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  // Imported dynamically, after config(): a static import is hoisted above it,
  // and src/lib/env.ts reads DATABASE_URL_DEV the instant it is imported. The
  // same trick as scripts/db-check.ts, scripts/sync.ts and the seed script.
  const { databaseBranch } = await import('../src/lib/env')
  const { prisma } = await import('../src/lib/prisma')
  const branch = databaseBranch()

  const server = createServer((request, response) => {
    void (async () => {
      const url = new URL(request.url ?? '/', `http://${HOST}`)

      try {
        if (request.method === 'GET' && url.pathname === '/') {
          const clubs = await readClubs()
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
          response.end(page(clubs, branch, url.searchParams.has('all')))
          return
        }

        if (request.method === 'GET' && url.pathname === '/api/block') {
          const clubs = await readClubs()

          // The ids are the rows the page rendered, sent back on every refresh.
          // Fixed at render rather than recomputed, so that painting a club does
          // not drop it out of its own block the moment it stops being unpainted.
          const wanted = url.searchParams.get('ids')
          const ids =
            wanted === null || wanted === ''
              ? null
              : new Set(wanted.split(',').map(Number).filter(Number.isInteger))

          response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
          response.end(identityBlock(ids === null ? clubs : clubs.filter((club) => ids.has(club.id))))
          return
        }

        if (request.method === 'POST' && url.pathname === '/api/save') {
          const body = JSON.parse(await readBody(request)) as { teams?: Edit[] }
          const saved = await saveClubs(body.teams ?? [])
          console.log(`  saved ${saved} clubs`)
          response.writeHead(200, { 'content-type': 'application/json' })
          response.end(JSON.stringify({ ok: true, saved }))
          return
        }

        response.writeHead(404, { 'content-type': 'text/plain' })
        response.end('Not found')
      } catch (error) {
        // Logged and answered rather than thrown. A picking session that loses
        // half an hour of choices to one bad request would be worse than the
        // problem this tool exists to solve.
        console.error(error)
        response.writeHead(500, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ ok: false, error: String(error) }))
      }
    })()
  })

  // Step past a busy port rather than dying on it. Several agents may be working
  // in several worktrees of this repository at once, and each one that opens this
  // page wants its own listener; refusing to start is a worse answer than moving
  // along by one. Only EADDRINUSE is swallowed — any other listen error is real.
  let attempt = 0
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code !== 'EADDRINUSE' || attempt >= PORT_ATTEMPTS) throw error
    attempt += 1
    server.listen(options.port + attempt, HOST)
  })

  server.on('listening', () => {
    const address = server.address()
    const port = typeof address === 'object' && address !== null ? address.port : options.port
    console.log(`\n  branch: ${branch}`)
    if (port !== options.port) console.log(`  note:   ${options.port} was busy`)
    console.log(`  colours: http://${HOST}:${port}${options.all ? '/?all=1' : ''}`)
    console.log('  ctrl-c to stop\n')
  })

  server.listen(options.port, HOST)

  const stop = () => {
    server.close()
    void prisma.$disconnect().then(() => process.exit(0))
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

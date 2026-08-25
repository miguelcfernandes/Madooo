/**
 * Fills `Team.code` and `Team.colour`.
 *
 *   npm run db:seed-teams
 *
 * API-Football publishes no club abbreviations and no club colours, so these are
 * ours. They are entered by hand and they are **data about football clubs, not
 * design decisions** — which is why a hex is allowed here and nowhere in product
 * code. `foundations.md` records the exception.
 *
 * Only ever `update`, never `create`. A club that is not already in the database
 * means the sync has not run, not that there is a row to invent.
 *
 * Idempotent, and safe to re-run after every sync. The sync itself cannot undo
 * it: `upsertTeams` in src/lib/sync.ts lists its update columns one by one, so a
 * re-sync leaves both of these alone.
 */

import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

interface Identity {
  /** The name as API-Football spells it. Checked, not written — see below. */
  name: string
  /** The league's own three-letter abbreviation for the club. */
  code: string
  /**
   * `null` where nobody has yet said what the club plays in.
   *
   * **A colour nobody has confirmed is absent, not guessed.** Three leagues
   * arrived at once and a plausible-looking primary is wrong about a quarter of
   * the time — five of twenty in La Liga, thirteen of eighteen in Serie A — and
   * wrong *quietly*, because a chip in the wrong red still looks like a chip.
   * So a club with no confirmed colour holds null and draws the neutral
   * fallback, which reads as missing data rather than as a fact about the club.
   *
   * A null costs the club its colour and nothing else: the script still writes
   * the code, and `npm run colours` is the screen that fills these in.
   */
  colour: string | null
}

/**
 * Keyed by API-Football team id, with the provider's own spelling of the name
 * alongside. **The name is a guard, not a value**: the script refuses to write
 * to a row whose stored name does not match, so an id typed wrong paints nothing
 * rather than painting some other club in the wrong colours. Nothing here
 * overwrites `Team.name`.
 *
 * The ids for the 2024/25 clubs were read out of `scratch/fixtures_39_2024.json`,
 * the Primeira Liga's out of `scratch/fixtures_94_2026.json`, La Liga's out of
 * `scratch/fixtures_140_2026.json`, Serie A's out of
 * `scratch/fixtures_135_2026.json`, and the Bundesliga's, Ligue 1's and
 * Allsvenskan's out of `fixtures_78_2026.json`, `fixtures_61_2026.json` and
 * `fixtures_113_2026.json` — read, never transcribed, which is what makes
 * the guard below meaningful. The promoted clubs are included so that changing
 * `SEASON` does not silently blank a chip; if an id is wrong the guard will say
 * so.
 *
 * Codes are the league's own abbreviations rather than the first three letters
 * of the name. Three letters off the front of the name would give
 * `MAN` to both Manchester clubs and `AST` to Aston Villa: a badge
 * whose whole job is to identify a club has to be able to.
 *
 * Colours are not uniformly sourced, and each block says which it is. The
 * Primeira Liga's, La Liga's and most of Serie A's were checked by the author
 * against the clubs themselves; the Bundesliga's, Ligue 1's and Allsvenskan's
 * were picked by the author in `npm run colours`, with the chip drawn in front
 * of them as they chose, which makes those three the best-sourced blocks here.
 * The Premier League's are commonly published primaries, which leaves that block
 * the one with no authority behind it and the one meant to be edited on sight —
 * and `npm run colours -- --all` is now the way to do that.
 */
/**
 * **Five reds are a few percent deeper than the club's published primary, and
 * the lines say so.** Arsenal, Sunderland, Athletic Club, Rayo Vallecano and AC
 * Milan all sat just on the black side of `crestInk`'s threshold, so their chips
 * drew black letters on a bright red — which the author judged wrong, and which
 * the numbers agreed was marginal rather than clear: white scored 4.08 to 4.49
 * against black's 4.68 to 5.15, where small bold text needs 4.5 to pass WCAG AA.
 * White was the better-looking answer and the failing one.
 *
 * Scaling all three channels by 3-5% moves each under the threshold. The hue and
 * the saturation do not move, so it is the same red turned down rather than a
 * different red, and the ink flips to white at 4.67 to 4.70 — which passes.
 * That is not a coincidence: the 0.179 crossover sits almost exactly on AA's
 * 4.5, so any colour the rule gives white to clears the bar with white.
 *
 * **The honest objection, recorded rather than argued away:** this file's whole
 * doctrine is that a colour is a fact about a club and not a design decision,
 * and here five facts were adjusted to suit a rendering rule. The defence is
 * that published brand hexes vary between sources by more than 5% anyway, so
 * these remain within the range of "the club's red". The alternative — moving
 * the threshold in `crestInk` — was rejected because it would also flip a dozen
 * greens and blues nobody complained about, several of them to a white that
 * fails AA.
 *
 * Do not "correct" these back to the published primary without reading this.
 */
const IDENTITIES: Record<number, Identity> = {
  33: { name: 'Manchester United', code: 'MUN', colour: '#da291c' },
  34: { name: 'Newcastle', code: 'NEW', colour: '#241f20' },
  35: { name: 'Bournemouth', code: 'BOU', colour: '#da291c' },
  36: { name: 'Fulham', code: 'FUL', colour: '#000000' },
  39: { name: 'Wolves', code: 'WOL', colour: '#fdb913' },
  40: { name: 'Liverpool', code: 'LIV', colour: '#c8102e' },
  41: { name: 'Southampton', code: 'SOU', colour: '#d71920' },
  42: { name: 'Arsenal', code: 'ARS', colour: '#e90107' }, // deepened, see above
  45: { name: 'Everton', code: 'EVE', colour: '#003399' },
  46: { name: 'Leicester', code: 'LEI', colour: '#003090' },
  47: { name: 'Tottenham', code: 'TOT', colour: '#132257' },
  48: { name: 'West Ham', code: 'WHU', colour: '#7a263a' },
  49: { name: 'Chelsea', code: 'CHE', colour: '#034694' },
  50: { name: 'Manchester City', code: 'MCI', colour: '#6cabdd' },
  51: { name: 'Brighton', code: 'BHA', colour: '#0057b8' },
  52: { name: 'Crystal Palace', code: 'CRY', colour: '#1b458f' },
  55: { name: 'Brentford', code: 'BRE', colour: '#e30613' },
  57: { name: 'Ipswich', code: 'IPS', colour: '#3a64a3' },
  65: { name: 'Nottingham Forest', code: 'NFO', colour: '#dd0000' },
  66: { name: 'Aston Villa', code: 'AVL', colour: '#670e36' },

  // Promoted after 2024/25. The table spans every season the database has held
  // rather than one season's twenty, because it is keyed by the provider's team
  // id and only ever updates rows that already exist — a club that is not in
  // the database costs nothing but a line here.
  44: { name: 'Burnley', code: 'BUR', colour: '#6c1d45' },
  63: { name: 'Leeds', code: 'LEE', colour: '#1d428a' },
  64: { name: 'Hull City', code: 'HUL', colour: '#f18a00' },
  746: { name: 'Sunderland', code: 'SUN', colour: '#e5162a' }, // deepened, see above
  1346: { name: 'Coventry', code: 'COV', colour: '#78d0f3' },

  // Primeira Liga, 2026/27. The codes are the clubs' own initials, which is the
  // same rule the Premier League block follows — SLB and FCP identify a club to
  // a Portuguese reader the way MUN and AVL do to an English one, where the
  // first three letters of "Sporting CP" and "Santa Clara" would not.
  //
  // Every colour below was checked by the author against the clubs themselves,
  // so Vitória SC and Casa Pia are flat black by confirmation rather than by
  // guess. That makes this block better sourced than the Premier League one
  // above it, which is still on commonly published primaries.
  //
  // 224 is why the name beside each id is a guard. The provider renamed it from
  // "Guimaraes" to "Vitória SC" at some point after this table was written, and
  // the development branch never noticed: it had already been seeded, and the
  // sync does not touch these two columns. Only filling an empty database
  // surfaced it, as a club the seed skipped and a chip with no colour.
  211: { name: 'Benfica', code: 'SLB', colour: '#e30613' },
  212: { name: 'FC Porto', code: 'FCP', colour: '#00428c' },
  214: { name: 'Maritimo', code: 'MAR', colour: '#00913f' },
  215: { name: 'Moreirense', code: 'MOR', colour: '#007a3d' },
  217: { name: 'SC Braga', code: 'SCB', colour: '#c8102e' },
  224: { name: 'Vitória SC', code: 'VSC', colour: '#000000' },
  225: { name: 'Nacional', code: 'NAC', colour: '#ebcc1e' },
  226: { name: 'Rio Ave', code: 'RAV', colour: '#00843d' },
  227: { name: 'Santa Clara', code: 'SCL', colour: '#d2232a' },
  228: { name: 'Sporting CP', code: 'SCP', colour: '#008057' },
  230: { name: 'Estoril', code: 'EST', colour: '#fef000' },
  238: { name: 'Academico Viseu', code: 'ACV', colour: '#c8102e' },
  240: { name: 'Arouca', code: 'ARO', colour: '#fef405' },
  242: { name: 'Famalicao', code: 'FAM', colour: '#164194' },
  762: { name: 'GIL Vicente', code: 'GIL', colour: '#d5222a' },
  4716: { name: 'Casa Pia', code: 'CPA', colour: '#000000' },
  4724: { name: 'Alverca', code: 'ALV', colour: '#c8102e' },
  15130: { name: 'Estrela', code: 'ESA', colour: '#0d9040' },

  // La Liga, 2026/27. Codes are the competition's broadcast abbreviations, the
  // same rule the two blocks above follow — RMA and ATM identify a club where
  // the first three letters of "Real Madrid" and "Real Sociedad" would collide,
  // and both Real Betis and Racing Santander would lose to them again.
  //
  // Every colour below was checked by the author against the clubs themselves,
  // so this block is sourced like the Primeira Liga's above rather than like the
  // Premier League's. Two of them are the reason the check mattered: Real Madrid
  // and Valencia both play in white, which no crest chip can draw, so each holds
  // the colour the club is identified by off the shirt — Madrid's crest blue and
  // Valencia's black — rather than a badge accent picked to look distinct.
  529: { name: 'Barcelona', code: 'BAR', colour: '#a50044' },
  530: { name: 'Atletico Madrid', code: 'ATM', colour: '#cb3524' },
  531: { name: 'Athletic Club', code: 'ATH', colour: '#e22321' }, // deepened, see above
  532: { name: 'Valencia', code: 'VAL', colour: '#000000' },
  533: { name: 'Villarreal', code: 'VIL', colour: '#ffe667' },
  535: { name: 'Malaga', code: 'MAL', colour: '#0080c8' },
  536: { name: 'Sevilla', code: 'SEV', colour: '#d40026' },
  538: { name: 'Celta Vigo', code: 'CEL', colour: '#8ac3ee' },
  539: { name: 'Levante', code: 'LEV', colour: '#b4053f' },
  540: { name: 'Espanyol', code: 'ESP', colour: '#007fc8' },
  541: { name: 'Real Madrid', code: 'RMA', colour: '#00529f' },
  542: { name: 'Alaves', code: 'ALA', colour: '#0761af' },
  543: { name: 'Real Betis', code: 'BET', colour: '#00954c' },
  544: { name: 'Deportivo La Coruna', code: 'DEP', colour: '#57175e' },
  546: { name: 'Getafe', code: 'GET', colour: '#003da5' },
  548: { name: 'Real Sociedad', code: 'RSO', colour: '#004f9f' },
  727: { name: 'Osasuna', code: 'OSA', colour: '#d91a21' },
  728: { name: 'Rayo Vallecano', code: 'RAY', colour: '#dd2e26' }, // deepened, see above
  797: { name: 'Elche', code: 'ELC', colour: '#00913f' },
  4665: { name: 'Racing Santander', code: 'RAC', colour: '#009b48' },

  // Serie A, 2026/27. Codes are Lega Serie A's own three-letter abbreviations,
  // the rule the three blocks above follow — and the competition that needs it
  // most: first-three-letters gives both Milan clubs MIL, says nothing at all
  // for "Inter", and hands Sassuolo and AS Roma initials off the wrong word.
  //
  // Eighteen of the twenty colours were checked by the author against the clubs
  // themselves, so this block is sourced like the Primeira Liga's and La Liga's
  // rather than like the Premier League's. Thirteen of the eighteen moved off
  // the published primary they were drafted from, which is the same rate that
  // block found and the reason the check is not a formality: Lecce is the
  // clearest, drafted yellow off its shirt and corrected to the blue the club
  // is actually identified by.
  //
  // The two exceptions are the two the check cannot settle. Juventus and Udinese
  // both play in black and white, which no crest chip can draw, so both hold
  // flat black and are indistinguishable from each other — the problem Real
  // Madrid and Valencia posed in La Liga, unresolved here because neither club
  // has a second colour to move to. Venezia is the near miss: its shirt is black
  // too, and it takes the orange of its trim rather than being a third black
  // chip.
  487: { name: 'Lazio', code: 'LAZ', colour: '#87d8f7' },
  488: { name: 'Sassuolo', code: 'SAS', colour: '#00a752' },
  489: { name: 'AC Milan', code: 'MIL', colour: '#e8080a' }, // deepened, see above
  490: { name: 'Cagliari', code: 'CAG', colour: '#ad002a' },
  492: { name: 'Napoli', code: 'NAP', colour: '#12a0d7' },
  494: { name: 'Udinese', code: 'UDI', colour: '#000000' },
  495: { name: 'Genoa', code: 'GEN', colour: '#ad1919' },
  496: { name: 'Juventus', code: 'JUV', colour: '#000000' },
  497: { name: 'AS Roma', code: 'ROM', colour: '#8e1f2f' },
  499: { name: 'Atalanta', code: 'ATA', colour: '#1e71b8' },
  500: { name: 'Bologna', code: 'BOL', colour: '#a21c26' },
  502: { name: 'Fiorentina', code: 'FIO', colour: '#482e92' },
  503: { name: 'Torino', code: 'TOR', colour: '#8a1e03' },
  505: { name: 'Inter', code: 'INT', colour: '#010e80' },
  512: { name: 'Frosinone', code: 'FRO', colour: '#ffdd00' },
  517: { name: 'Venezia', code: 'VEN', colour: '#ef7d00' },
  523: { name: 'Parma', code: 'PAR', colour: '#ffd200' },
  867: { name: 'Lecce', code: 'LEC', colour: '#006086' },
  895: { name: 'Como', code: 'COM', colour: '#10416a' },
  1579: { name: 'Monza', code: 'MON', colour: '#e4022e' },

  // Bundesliga, 2026/27. Codes are the DFL's own — the abbreviations the league
  // prints on its own scoreboards, which is the same external standard the four
  // blocks above take. They are also the block where first-three-letters fails
  // hardest: it gives BAY to both Bayern and Bayer, BOR to both Borussias, and
  // says "1." for Köln.
  //
  // **Every colour in these three blocks was picked by the author in
  // `npm run colours`, not drafted.** The three leagues were added together,
  // which is 52 clubs — far past what a correct-on-sight pass can carry, and
  // exactly the size at which drafting plausible primaries stops working. So
  // nothing was drafted: each club held `null` and drew the neutral fallback
  // until the author sat down with the picker, which draws each candidate as the
  // chip it will actually become in both themes.
  //
  // That makes this the best-sourced block in the file. The Premier League's
  // twenty above are still commonly published primaries that nobody has checked.
  157: { name: 'Bayern München', code: 'FCB', colour: '#dc052d' },
  160: { name: 'SC Freiburg', code: 'SCF', colour: '#000000' },
  162: { name: 'Werder Bremen', code: 'SVW', colour: '#1d9053' },
  163: { name: 'Borussia Mönchengladbach', code: 'BMG', colour: '#000000' },
  164: { name: 'FSV Mainz 05', code: 'M05', colour: '#c3141e' },
  165: { name: 'Borussia Dortmund', code: 'BVB', colour: '#fde100' },
  167: { name: '1899 Hoffenheim', code: 'TSG', colour: '#1961b5' },
  168: { name: 'Bayer Leverkusen', code: 'B04', colour: '#e32221' },
  169: { name: 'Eintracht Frankfurt', code: 'SGE', colour: '#e1000f' },
  170: { name: 'FC Augsburg', code: 'FCA', colour: '#ba3733' },
  172: { name: 'VfB Stuttgart', code: 'VFB', colour: '#e32219' },
  173: { name: 'RB Leipzig', code: 'RBL', colour: '#dd013f' },
  174: { name: 'FC Schalke 04', code: 'S04', colour: '#004b9c' },
  175: { name: 'Hamburger SV', code: 'HSV', colour: '#0a3f86' },
  182: { name: 'Union Berlin', code: 'FCU', colour: '#e51822' }, // deepened, see above
  185: { name: 'SC Paderborn 07', code: 'SCP', colour: '#005ca8' },
  192: { name: '1. FC Köln', code: 'KOE', colour: '#e41b23' }, // deepened, see above
  1660: { name: 'SV Elversberg', code: 'SVE', colour: '#d1bd8a' },

  // Ligue 1, 2026/27. Codes are the clubs' own initials wherever the club has
  // one a French reader would recognise — OM, OL, PSG, ASM, RCL — and the city
  // otherwise. That is the Primeira Liga's rule rather than the Premier
  // League's, and for the Primeira Liga's reason: "Olympique de Marseille" and
  // "Olympique Lyonnais" both start OLY.
  //
  // Two of them are not three letters, deliberately. OM and OL are how those
  // two clubs are named by everyone including themselves, and a code whose
  // whole job is to identify a club should not be padded to fit a column.
  // SB29 is four for the same reason. The chip has no fixed width at `sm` and
  // centres its content at `lg` and `xl`, so none of the three costs anything.
  77: { name: 'Angers', code: 'SCO', colour: '#aea427' },
  79: { name: 'Lille', code: 'LOS', colour: '#e01e13' },
  80: { name: 'Lyon', code: 'OL', colour: '#14387f' },
  81: { name: 'Marseille', code: 'OM', colour: '#2faee0' },
  84: { name: 'Nice', code: 'OGC', colour: '#000000' },
  85: { name: 'Paris Saint Germain', code: 'PSG', colour: '#004170' },
  91: { name: 'Monaco', code: 'ASM', colour: '#e41b23' }, // deepened, see above
  94: { name: 'Rennes', code: 'SRF', colour: '#db3226' }, // deepened, see above
  95: { name: 'Strasbourg', code: 'RCS', colour: '#009fe3' },
  96: { name: 'Toulouse', code: 'TFC', colour: '#3f2a56' },
  97: { name: 'Lorient', code: 'FCL', colour: '#f58113' },
  106: { name: 'Stade Brestois 29', code: 'SB29', colour: '#e41b23' }, // deepened, see above
  108: { name: 'Auxerre', code: 'AJA', colour: '#4087bf' },
  110: { name: 'Estac Troyes', code: 'TRO', colour: '#006eb2' },
  111: { name: 'Le Havre', code: 'HAC', colour: '#003259' },
  114: { name: 'Paris FC', code: 'PFC', colour: '#0c183f' },
  116: { name: 'Lens', code: 'RCL', colour: '#e41b23' }, // deepened, see above
  1298: { name: 'Le Mans', code: 'LMS', colour: '#be081a' },

  // Allsvenskan, 2026/27. Codes are the clubs' own initials, which in Sweden is
  // very nearly the only way clubs are named: AIK, BP, DIF, MFF and IFK are what
  // a Swedish reader reads, where "Mal", "Djur" and "Bro" are what the fallback
  // would give.
  //
  // Degerfors takes DEG rather than its own DIF, which Djurgården has by a
  // margin no Swedish reader would dispute. That is the one collision in the
  // block, and it is resolved in favour of the club the initials are famous for.
  //
  // **Allsvenskan is the first league the app holds that runs on the calendar
  // year.** Its 2026 season kicked off in March and is 141 matches of 240 played
  // — so unlike every league before it, it joins the app already half-finished
  // rather than on an opening weekend. `SEASON=2026` happens to name it
  // correctly, and would still be the right value in January when the European
  // leagues are mid-season and this one has not started.
  363: { name: 'Hammarby FF', code: 'HAM', colour: '#ffe501' },
  364: { name: 'Djurgardens IF', code: 'DIF', colour: '#feeb0a' },
  366: { name: 'IFK Goteborg', code: 'IFK', colour: '#214a99' },
  367: { name: 'BK Hacken', code: 'BKH', colour: '#a79448' },
  370: { name: 'Sirius', code: 'SIR', colour: '#0e204d' },
  371: { name: 'IF Brommapojkarna', code: 'BP', colour: '#c08027' },
  372: { name: 'IF Elfsborg', code: 'ELF', colour: '#fcd200' },
  374: { name: 'Kalmar FF', code: 'KFF', colour: '#d11935' },
  375: { name: 'Malmo FF', code: 'MFF', colour: '#0089c5' },
  377: { name: 'AIK Stockholm', code: 'AIK', colour: '#002944' },
  766: { name: 'Halmstad', code: 'HBK', colour: '#0058a2' },
  2166: { name: 'Orgryte IS', code: 'OIS', colour: '#940c23' },
  2170: { name: 'Gais', code: 'GAI', colour: '#cd3528' },
  2172: { name: 'Degerfors IF', code: 'DEG', colour: '#e7130c' }, // deepened, see above
  2240: { name: 'Mjallby AIF', code: 'MAI', colour: '#ffd400' },
  2241: { name: 'Vasteras SK FK', code: 'VSK', colour: '#007948' },
}

async function main() {
  // Imported dynamically, after config(): a static import is hoisted above it,
  // and src/lib/prisma.ts reads DATABASE_URL_DEV the instant it is imported.
  // The same trick as scripts/db-check.ts and scripts/sync.ts.
  const { databaseBranch } = await import('../src/lib/env')
  const { prisma } = await import('../src/lib/prisma')

  console.log(`\nbranch: ${databaseBranch()}`)

  const teams = await prisma.team.findMany({
    select: { id: true, apiFootballId: true, name: true },
    orderBy: { name: 'asc' },
  })

  let seeded = 0
  const unnamed: string[] = []
  const unpainted: string[] = []
  const mismatched: string[] = []

  for (const team of teams) {
    const identity = IDENTITIES[team.apiFootballId]
    if (identity === undefined) {
      unnamed.push(`${team.name} (${team.apiFootballId})`)
      continue
    }
    if (identity.name !== team.name) {
      mismatched.push(
        `${team.apiFootballId}: database says "${team.name}", table says "${identity.name}"`,
      )
      continue
    }

    // A null colour writes the code and leaves `colour` exactly as it was,
    // rather than blanking it. That distinction is what makes this script safe
    // to run after `npm run colours` has painted a club straight into the
    // database and before the table here has caught up: the run fills in the
    // code and does not undo the colour. Listing the column and omitting the
    // key is Prisma's own way of saying "do not touch this one".
    await prisma.team.update({
      where: { id: team.id },
      data:
        identity.colour === null
          ? { code: identity.code }
          : { code: identity.code, colour: identity.colour },
    })
    seeded += 1
    if (identity.colour === null) unpainted.push(`${team.name} (${team.apiFootballId})`)
  }

  console.log(`\n  ok    ${seeded} of ${teams.length} teams seeded`)

  // Reported, not thrown. A club with no identity renders a neutral fallback
  // chip, which is a missing row rather than a broken app.
  for (const team of unnamed) console.log(`  none  no identity for ${team}`)
  for (const line of mismatched) console.log(`  skip  ${line}`)

  if (unpainted.length > 0) {
    console.log(`\n  ${unpainted.length} clubs have no colour in this table.`)
    console.log('  Run `npm run colours` to pick them, then paste the block back here.')
    for (const team of unpainted) console.log(`  todo  ${team}`)
  }

  await prisma.$disconnect()
  console.log('')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

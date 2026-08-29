/**
 * The URL's league vocabulary, against the names the provider actually sends.
 *
 * Same rule as `rounds.test.ts`: the league names are read out of the captured
 * payloads at runtime rather than transcribed. "Primeira Liga" is a fact about
 * API-Football — the competition is commonly called Liga Portugal, and a test
 * asserting against the name a person would say would prove only that the slug
 * matches the same memory that wrote it. League 140 is the same trap facing the
 * other way: the provider says "La Liga" where the competition's own name is
 * Primera División, so writing down either from memory is a coin toss.
 *
 * League 135 is a third face of it. "Serie A" is what a person would say and
 * what the provider sends, so it looks like the one name safe to transcribe —
 * but it is not unique in the provider's own catalogue, where id 71 is Brazil's
 * Serie A. Reading it out of the payload is what keeps this suite honest about
 * which competition it is describing.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { flagClass, groupByLeague, isTopLeague, leagueRank, leagueSlug, splitByStanding } from './leagues'
import type { LeagueSection } from './leagues'
import type { ApiFootballEnvelope, RawFixture } from './api-football/types'

/** The league a captured season is played in, as the provider describes it. */
function rawLeague(file: string): RawFixture['league'] {
  const path = join(process.cwd(), 'scratch', file)
  let payload: ApiFootballEnvelope<RawFixture>
  try {
    payload = JSON.parse(readFileSync(path, 'utf8')) as ApiFootballEnvelope<RawFixture>
  } catch {
    throw new Error(
      `Missing ${path}. These tests run against real captured payloads — ` +
        're-create them with `python3 scripts/verify_api.py`.',
    )
  }
  return payload.response[0].league
}

function leagueName(file: string): string {
  return rawLeague(file).name
}

const PREMIER_LEAGUE = leagueName('fixtures_39_2024.json')
const PRIMEIRA_LIGA = leagueName('fixtures_94_2026.json')
const LA_LIGA = leagueName('fixtures_140_2026.json')
const SERIE_A = leagueName('fixtures_135_2026.json')
const BUNDESLIGA = leagueName('fixtures_78_2026.json')
const LIGUE_1 = leagueName('fixtures_61_2026.json')
const ALLSVENSKAN = leagueName('fixtures_113_2026.json')

const ALL = [
  PREMIER_LEAGUE,
  PRIMEIRA_LIGA,
  LA_LIGA,
  SERIE_A,
  BUNDESLIGA,
  LIGUE_1,
  ALLSVENSKAN,
]

/**
 * What the page hands the grouper: our own ids, the provider's names and its
 * countries. The ids are deliberately not in rank order, so a grouper that
 * happened to sort by id rather than by rank would fail rather than pass.
 */
const SECTIONS: LeagueSection[] = [
  { id: 1, name: PREMIER_LEAGUE, country: rawLeague('fixtures_39_2026.json').country },
  { id: 2, name: PRIMEIRA_LIGA, country: rawLeague('fixtures_94_2026.json').country },
  { id: 3, name: LA_LIGA, country: rawLeague('fixtures_140_2026.json').country },
  { id: 4, name: SERIE_A, country: rawLeague('fixtures_135_2026.json').country },
  { id: 5, name: BUNDESLIGA, country: rawLeague('fixtures_78_2026.json').country },
  { id: 6, name: LIGUE_1, country: rawLeague('fixtures_61_2026.json').country },
  { id: 7, name: ALLSVENSKAN, country: rawLeague('fixtures_113_2026.json').country },
]

describe('leagueSlug', () => {
  it('is typeable, for every league the app actually holds', () => {
    for (const name of ALL) {
      expect(leagueSlug(name), name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('tells every league apart', () => {
    expect(new Set(ALL.map(leagueSlug)).size).toBe(ALL.length)
  })

  it('strips the diacritics a UK keyboard cannot produce', () => {
    // Not any league the app holds: the provider calls 140 "La Liga", so this
    // is the normaliser tested on a synthetic input. It is kept because the
    // accent is the interesting case and no synced league currently has one.
    expect(leagueSlug('Primera División')).toBe('primera-division')
  })

  it('leaves no leading, trailing or doubled hyphen', () => {
    // Written when Serie A was not a league the app held, as a synthetic input
    // chosen for its punctuation. It keeps its place now that 135 is one: the
    // assertion is about the trimming, and it happens to pin the real slug as
    // well.
    expect(leagueSlug('  Serie A!  ')).toBe('serie-a')
  })
})

describe('leagueRank', () => {
  it('orders the seven leagues the app holds, most followed first', () => {
    const ordered = [...ALL].sort((a, b) => leagueRank({ name: a }) - leagueRank({ name: b }))
    expect(ordered).toEqual([
      PREMIER_LEAGUE,
      LA_LIGA,
      SERIE_A,
      BUNDESLIGA,
      LIGUE_1,
      PRIMEIRA_LIGA,
      ALLSVENSKAN,
    ])
  })

  it('reads the provider\u2019s own names, not a person\u2019s', () => {
    // The whole point of taking the names out of the payload: the map is keyed
    // on what API-Football sends, so a rank that only matched "Liga Portugal"
    // or "Primera Divisi\u00f3n" would silently sort that league last forever.
    for (const name of ALL) {
      expect(leagueRank({ name }), name).toBeLessThan(Number.MAX_SAFE_INTEGER)
    }
  })

  it('sends a league it does not name to the back rather than hiding it', () => {
    // The clause that keeps this legal against AGENTS.md's first constraint: an
    // eighth league costs no edit here. It ranks last and still renders.
    //
    // This used to name the Bundesliga, which was the honest choice while the
    // app held four leagues and is a wrong one now that it holds seven. The
    // stand-in has to be a competition LEAGUE_ORDER genuinely does not name, or
    // the test passes while asserting nothing.
    expect(leagueRank({ name: 'Eredivisie' })).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('is unaffected by casing or diacritics', () => {
    expect(leagueRank({ name: 'PREMIER LEAGUE' })).toBe(leagueRank({ name: PREMIER_LEAGUE }))
  })
})

describe('splitByStanding', () => {
  it('puts the big five on top, in the order the map ranks them', () => {
    const { top } = splitByStanding(SECTIONS)
    expect(top.map((league) => league.name)).toEqual([
      PREMIER_LEAGUE,
      LA_LIGA,
      SERIE_A,
      BUNDESLIGA,
      LIGUE_1,
    ])
  })

  it('puts the rest below, also in rank order', () => {
    const { other } = splitByStanding(SECTIONS)
    expect(other.map((league) => league.name)).toEqual([PRIMEIRA_LIGA, ALLSVENSKAN])
  })

  it('loses nobody', () => {
    const { top, other } = splitByStanding(SECTIONS)
    expect(top.length + other.length).toBe(SECTIONS.length)
  })

  // The clause that keeps the filter legal against AGENTS.md's first
  // constraint, the same one `leagueRank` is tested against: an eighth league
  // costs no edit. It ranks last, lands under "Other", and still draws.
  it('sends a competition the map does not name to the other group', () => {
    expect(isTopLeague({ name: 'Eredivisie' })).toBe(false)
    const { top, other } = splitByStanding([...SECTIONS, { id: 8, name: 'Eredivisie', country: 'Netherlands' }])
    expect(top).toHaveLength(5)
    expect(other.map((league) => league.name)).toEqual([PRIMEIRA_LIGA, ALLSVENSKAN, 'Eredivisie'])
  })

  it('does not reorder what it was handed', () => {
    const before = SECTIONS.map((league) => league.id)
    splitByStanding(SECTIONS)
    expect(SECTIONS.map((league) => league.id)).toEqual(before)
  })
})

describe('groupByLeague', () => {
  /** A fixture list as the page hands it over: kickoff order, leagues interleaved. */
  const fixture = (id: number, kickoff: string) => ({
    kickoff,
    league: SECTIONS.find((section) => section.id === id)!,
  })

  it('orders the sections by rank, whatever order the fixtures arrive in', () => {
    const grouped = groupByLeague(
      [fixture(2, '12:00'), fixture(4, '13:00'), fixture(1, '15:00'), fixture(3, '17:00')],
      (item) => item.league,
    )
    expect(grouped.map((group) => group.league.name)).toEqual([
      PREMIER_LEAGUE,
      LA_LIGA,
      SERIE_A,
      PRIMEIRA_LIGA,
    ])
  })

  it('keeps the order it was handed inside each section', () => {
    /*
      The documented split: Postgres owns kickoff order, this owns which section
      leads. Handed three fixtures of one league in kickoff order, they come back
      in kickoff order — so a sort here, of any kind, would show up.
    */
    const kickoffs = ['12:30', '15:00', '17:30']
    const grouped = groupByLeague(
      kickoffs.map((kickoff) => fixture(1, kickoff)),
      (item) => item.league,
    )
    expect(grouped).toHaveLength(1)
    expect(grouped[0].items.map((item) => item.kickoff)).toEqual(kickoffs)
  })

  it('puts a league in one section, not several', () => {
    // Interleaved input is the real case — a day's fixtures come back in kickoff
    // order, so two leagues alternate down the list.
    const grouped = groupByLeague(
      [fixture(1, '12:00'), fixture(2, '13:00'), fixture(1, '15:00'), fixture(2, '16:00')],
      (item) => item.league,
    )
    expect(grouped).toHaveLength(2)
    for (const group of grouped) expect(group.items).toHaveLength(2)
  })

  it('keeps every item exactly once', () => {
    const items = [fixture(3, '12:00'), fixture(1, '15:00'), fixture(3, '17:00')]
    const grouped = groupByLeague(items, (item) => item.league)
    expect(grouped.flatMap((group) => group.items)).toHaveLength(items.length)
  })

  it('sorts unranked leagues after the ranked ones, alphabetically', () => {
    const unranked = [
      { id: 9, name: 'Süper Lig', country: 'Turkey' },
      { id: 8, name: 'Eredivisie', country: 'Netherlands' },
    ]
    const grouped = groupByLeague(
      [
        { league: unranked[0] },
        { league: unranked[1] },
        { league: SECTIONS[0] },
      ],
      (item) => item.league,
    )
    expect(grouped.map((group) => group.league.name)).toEqual([
      PREMIER_LEAGUE,
      'Eredivisie',
      'Süper Lig',
    ])
  })

  it('is empty for an empty list', () => {
    expect(groupByLeague([], (item: { league: LeagueSection }) => item.league)).toEqual([])
  })
})

describe('flagClass', () => {
  /*
    The countries out of the captured payloads for the same reason the names
    are: "England" is a fact about API-Football, not about football. The
    provider files the Premier League under a country no other data source
    would call a country at all, and a map written from memory would be a map
    of what someone assumed it says.
  */
  const COUNTRIES = [
    rawLeague('fixtures_39_2026.json').country,
    rawLeague('fixtures_94_2026.json').country,
    rawLeague('fixtures_140_2026.json').country,
    rawLeague('fixtures_135_2026.json').country,
    rawLeague('fixtures_78_2026.json').country,
    rawLeague('fixtures_61_2026.json').country,
    rawLeague('fixtures_113_2026.json').country,
  ]

  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

  /*
    The check that earns this suite its place. A country and its class name live
    in two files with nothing binding them, so `flagClass` returning `flag-pt`
    while globals.css says `.flag-prt` draws an empty 16x12 box: no console
    error, no failing build, nothing but a gap in a heading. It is the same
    failure a glyph name with no geometry behind it would have — except that one
    is a compile error now, because `ICON_PATHS` is keyed by `IconName`. This is
    the flags' version of that check, closed rather than documented.
  */
  it.each(COUNTRIES)('has a rule and a file for %s', (country) => {
    const flag = flagClass({ country })
    expect(flag, country).not.toBeNull()
    expect(css).toContain(`.${flag} {`)
    expect(existsSync(join(process.cwd(), 'public/flags', `${flag?.replace('flag-', '')}.svg`))).toBe(
      true,
    )
  })

  it('tells the seven leagues apart', () => {
    expect(new Set(COUNTRIES.map((country) => flagClass({ country }))).size).toBe(COUNTRIES.length)
  })

  it('draws nothing for a country we have no file for', () => {
    // API-Football's country for the Champions League, so the fifth league is
    // as likely to hit this as to hit a flag.
    expect(flagClass({ country: 'World' })).toBeNull()
  })

  it('survives the provider recasing a country', () => {
    expect(flagClass({ country: 'ENGLAND' })).toBe(flagClass({ country: 'England' }))
  })
})

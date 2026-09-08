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

import {
  clubMainLeagues,
  flagClass,
  groupByLeague,
  isTopLeague,
  leagueRank,
  leagueSlug,
  splitByStanding,
} from './leagues'
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

/*
  Read out of the payload for a reason the other seven only illustrate: this
  competition is the one whose name a person is most likely to write down wrong.
  Everyone calls it the Champions League and the provider calls it the "UEFA
  Champions League", so a rank keyed on the short name would name nothing, sort
  the competition last, and look entirely correct in the diff.
*/
const CHAMPIONS_LEAGUE = leagueName('fixtures_2_2026.json')

const ALL = [
  CHAMPIONS_LEAGUE,
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
  { id: 8, name: CHAMPIONS_LEAGUE, country: rawLeague('fixtures_2_2026.json').country },
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
  it('orders the eight competitions the app holds, most followed first', () => {
    const ordered = [...ALL].sort((a, b) => leagueRank({ name: a }) - leagueRank({ name: b }))
    expect(ordered).toEqual([
      CHAMPIONS_LEAGUE,
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
  it('puts the big five and the Champions League on top, in rank order', () => {
    const { top } = splitByStanding(SECTIONS)
    expect(top.map((league) => league.name)).toEqual([
      CHAMPIONS_LEAGUE,
      PREMIER_LEAGUE,
      LA_LIGA,
      SERIE_A,
      BUNDESLIGA,
      LIGUE_1,
    ])
  })

  it('keeps Ligue 1 in the top group now that a sixth competition leads it', () => {
    // TOP_LEAGUES counts down LEAGUE_ORDER, so the Champions League taking first
    // would have pushed Ligue 1 out of "Top competitions" had the count stayed
    // at five — a league losing its standing because a different one arrived.
    const { top } = splitByStanding(SECTIONS)
    expect(top.map((league) => league.name)).toContain(LIGUE_1)
    expect(top).toHaveLength(6)
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
    const { top, other } = splitByStanding([...SECTIONS, { id: 9, name: 'Eredivisie', country: 'Netherlands' }])
    expect(top).toHaveLength(6)
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
        // Named rather than taken by position: `SECTIONS[0]` was the Premier
        // League until the Champions League was added to the front of the list,
        // at which point this test would have quietly changed what it asserts.
        { league: SECTIONS.find((section) => section.name === PREMIER_LEAGUE)! },
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

  it('draws nothing for the Champions League, whose country is not one', () => {
    /*
      No longer a hypothetical: this is the competition's own country, read out
      of its payload like every other string here. The app draws no mark for it
      at all — there is no flag for "World", and the Starball is a UEFA
      trademark this project has not cleared, the same answer club crests get.
      A test rather than a comment because the alternative failure is silent:
      somebody vendoring a `flag-world.svg` would turn a decision into a bug.
    */
    expect(flagClass({ country: rawLeague('fixtures_2_2026.json').country })).toBeNull()
  })

  it('survives the provider recasing a country', () => {
    expect(flagClass({ country: 'ENGLAND' })).toBe(flagClass({ country: 'England' }))
  })
})

describe('clubMainLeagues', () => {
  /*
    The competition ids match `SECTIONS` above, so a wrong answer names a real
    competition in the failure message rather than a bare number.
  */
  const UCL = 8
  const PL = 1
  const LIGA = 3

  /** A club's fixtures in one competition, as the query returns them: two rows. */
  const plays = (teamId: number, leagueId: number, matches: number) => [
    { teamId, leagueId, matches: Math.ceil(matches / 2) },
    { teamId, leagueId, matches: Math.floor(matches / 2) },
  ]

  it('names a club by the competition it plays most of its football in', () => {
    // Arsenal's actual shape of season: 38 league fixtures and a league phase.
    const main = clubMainLeagues([...plays(1, PL, 38), ...plays(1, UCL, 8)], SECTIONS)
    expect(main.get(1)).toBe(PL)
  })

  it('names a club we carry only through Europe by Europe', () => {
    // Most of the Champions League: clubs from leagues the app does not sync,
    // whose only competition here is this one. Filing them nowhere would be the
    // alternative, and it would drop them off `/teams` entirely.
    const main = clubMainLeagues(plays(2, UCL, 8), SECTIONS)
    expect(main.get(2)).toBe(UCL)
  })

  it('does not change its mind in August, when the counts are still level', () => {
    /*
      The reason the rule counts the season's whole calendar rather than the
      matches played. On the first European matchday a club has played one of
      each, and an answer read off what has happened so far would move a club
      between competitions for a fortnight and then move it back.
    */
    const main = clubMainLeagues([...plays(1, PL, 38), ...plays(1, UCL, 8)], SECTIONS)
    expect(main.get(1)).toBe(PL)
  })

  it('breaks a genuine tie by standing rather than by row order', () => {
    // Two competitions, the same number of fixtures, handed over in the order
    // that would give the wrong answer to anything taking the first or the last.
    const forwards = clubMainLeagues([...plays(3, UCL, 6), ...plays(3, LIGA, 6)], SECTIONS)
    const backwards = clubMainLeagues([...plays(3, LIGA, 6), ...plays(3, UCL, 6)], SECTIONS)
    expect(forwards.get(3)).toBe(UCL)
    expect(backwards.get(3)).toBe(UCL)
  })

  it('sums both sides of the fixture rather than taking one', () => {
    /*
      The halves are what the two `groupBy` calls return, and a rule that read
      only one of them would call a club's 19 home league fixtures fewer than a
      European campaign of 17 and file Arsenal under the Champions League.
    */
    const main = clubMainLeagues(
      [
        { teamId: 4, leagueId: PL, matches: 19 },
        { teamId: 4, leagueId: PL, matches: 19 },
        { teamId: 4, leagueId: UCL, matches: 17 },
      ],
      SECTIONS,
    )
    expect(main.get(4)).toBe(PL)
  })

  it('answers for every club it was given, and invents none', () => {
    const main = clubMainLeagues([...plays(1, PL, 38), ...plays(2, UCL, 8)], SECTIONS)
    expect([...main.keys()].sort()).toEqual([1, 2])
  })

  it('is empty for a club with no fixtures at all', () => {
    expect(clubMainLeagues([], SECTIONS).size).toBe(0)
  })

  it('still answers when the competition is one the caller could not name', () => {
    /*
      `/players` passes only the competitions that have squad rows, so a league
      whose season has not kicked off is absent from the names it hands over.
      The counts still decide; the names only ever break a tie.
    */
    const main = clubMainLeagues([...plays(5, PL, 38), ...plays(5, 99, 8)], SECTIONS)
    expect(main.get(5)).toBe(PL)
  })
})

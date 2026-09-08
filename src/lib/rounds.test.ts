/**
 * Round parsing, against the round labels the provider actually sends.
 *
 * Same rule as `api-football/map.test.ts`: the strings under test are read out
 * of the captured payloads at runtime rather than transcribed here. The exact
 * shape of `league.round` is a fact about API-Football, and a test that asserted
 * against a remembered `"Regular Season - 1"` would prove only that the parser
 * matches the same memory that wrote it.
 *
 * **Two competitions, because a cup does not label its rounds like a league.**
 * `roundDisplay`'s fallback was written for a knockout tie that did not exist
 * yet, and its examples — `"Round of 16"`, `"Final"` — were invented. The
 * Champions League is the first competition the app holds that actually
 * exercises it, and what it sends is neither of those: `"1st Qualifying Round"`,
 * `"Play-offs"` and `"League Stage - 4"`. The last of those is the interesting
 * one, because it is a numbered round that is not a "Regular Season" round, and
 * the parser has to read it as a matchday without having been told about it.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { roundDisplay, roundLabel, roundNumber, withoutQualifying } from './rounds'
import type { ApiFootballEnvelope, RawFixture } from './api-football/types'

/** Every distinct round label in a captured season, in the payload's own order. */
function roundsIn(file: string): string[] {
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
  return [...new Set(payload.response.map((entry) => entry.league.round))]
}

const rounds = roundsIn('fixtures_39_2024.json')
const cupRounds = roundsIn('fixtures_2_2026.json')

/** A captured season as `withoutQualifying` takes it: a round and a kickoff. */
function fixturesIn(file: string): { round: string; kickoff: Date }[] {
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
  return payload.response.map((entry) => ({
    round: entry.league.round,
    kickoff: new Date(entry.fixture.date),
  }))
}

/** Itself, so a payload can be filtered without being wrapped in anything. */
const asDated = (fixture: { round: string; kickoff: Date }) => fixture

describe('roundNumber', () => {
  it('reads a number out of every round the season actually contains', () => {
    for (const round of rounds) {
      expect(roundNumber(round), round).not.toBeNull()
    }
  })

  it('recovers the full 1..N run, with nothing missing or duplicated', () => {
    const numbers = rounds.map(roundNumber).sort((a, b) => a! - b!)
    expect(numbers).toEqual(Array.from({ length: rounds.length }, (_, i) => i + 1))
  })

  it('is null for a round carrying no number', () => {
    expect(roundNumber('Final')).toBeNull()
  })
})

describe('roundLabel', () => {
  it('turns a bare number into a label the payload would match', () => {
    // Round 1's label, taken from the payload rather than written out: this is
    // the string `--round 1` on the command line has to reproduce exactly.
    const first = rounds.find((round) => roundNumber(round) === 1)
    expect(roundLabel('1')).toBe(first)
  })

  it('leaves an already-formed label alone', () => {
    expect(roundLabel(rounds[0])).toBe(rounds[0])
  })
})

describe('roundDisplay', () => {
  it('names the matchday', () => {
    const sixth = rounds.find((round) => roundNumber(round) === 6)!
    expect(roundDisplay(sixth)).toBe('Matchday 6')
  })

  it('falls back to the raw label when there is no number to show', () => {
    expect(roundDisplay('Final')).toBe('Final')
  })
})

describe('a cup competition\u2019s rounds', () => {
  it('is a season of more than one shape, or these tests assert nothing', () => {
    // The guard on everything below. If the captured Champions League season
    // ever came back as one numbered run, the assertions would still pass while
    // covering none of the case they were written for.
    expect(cupRounds.filter((round) => roundNumber(round) === null).length).toBeGreaterThan(0)
    expect(cupRounds.filter((round) => roundNumber(round) !== null).length).toBeGreaterThan(0)
  })

  it('reads the league phase as matchdays, though it is not a "Regular Season"', () => {
    const numbered = cupRounds.filter((round) => roundNumber(round) !== null)
    for (const round of numbered) {
      expect(roundDisplay(round), round).toBe(`Matchday ${roundNumber(round)}`)
    }
  })

  it('leaves a knockout round exactly as the provider spells it', () => {
    const knockout = cupRounds.filter((round) => roundNumber(round) === null)
    for (const round of knockout) {
      expect(roundDisplay(round), round).toBe(round)
    }
  })

  it('shows every round of the season as something, and never as an empty string', () => {
    // A fixture card has to say which stage it belongs to whatever the label is.
    for (const round of cupRounds) {
      expect(roundDisplay(round).trim(), round).not.toBe('')
    }
  })

  it('does not mistake an unnumbered round for round zero', () => {
    // The reason `roundNumber` returns null rather than 0 or NaN: a qualifying
    // round sorted to the front of a league phase would be silently wrong.
    for (const round of cupRounds.filter((round) => roundNumber(round) === null)) {
      expect(roundNumber(round), round).toBeNull()
    }
  })
})

describe('withoutQualifying', () => {
  const CUP = 'fixtures_2_2026.json'

  it('drops the qualifying rounds and keeps the competition', () => {
    const all = fixturesIn(CUP)
    const kept = withoutQualifying(all, asDated)
    const keptRounds = [...new Set(kept.map((fixture) => fixture.round))]

    // Asserted as a property rather than as a list of names: every round left
    // standing is a numbered one, which for this competition is the league
    // phase, and every round dropped is not.
    for (const round of keptRounds) {
      expect(roundNumber(round), round).not.toBeNull()
    }
    expect(kept.length).toBeLessThan(all.length)
  })

  it('drops whole rounds, never part of one', () => {
    const all = fixturesIn(CUP)
    const kept = new Set(withoutQualifying(all, asDated).map((fixture) => fixture.round))
    const dropped = new Set(
      all.map((fixture) => fixture.round).filter((round) => !kept.has(round)),
    )
    for (const round of dropped) expect(kept.has(round), round).toBe(false)
    expect(dropped.size).toBeGreaterThan(0)
  })

  it('keeps nothing that kicks off before the competition starts', () => {
    const kept = withoutQualifying(fixturesIn(CUP), asDated)
    const first = Math.min(...kept.map((fixture) => fixture.kickoff.getTime()))
    const dropped = fixturesIn(CUP).filter((fixture) => fixture.kickoff.getTime() < first)
    expect(dropped.length).toBeGreaterThan(0)
    expect(kept.some((fixture) => fixture.kickoff.getTime() < first)).toBe(false)
  })

  it.each([
    'fixtures_39_2026.json',
    'fixtures_94_2026.json',
    'fixtures_140_2026.json',
    'fixtures_135_2026.json',
    'fixtures_78_2026.json',
    'fixtures_61_2026.json',
    'fixtures_113_2026.json',
  ])('touches nothing in a league season — %s', (file) => {
    /*
      The guard that matters most. This runs over every league the app holds, on
      every sync, and a rule that quietly dropped a matchday would present as
      missing fixtures rather than as a failure. A domestic season is numbered
      end to end, so the cutoff is its own first kickoff and nothing precedes it.
    */
    const all = fixturesIn(file)
    expect(withoutQualifying(all, asDated)).toHaveLength(all.length)
  })

  it('keeps a play-off round that comes after the numbered rounds', () => {
    /*
      The case a rule written on round *names* would get wrong, and the reason
      this one is written on dates: "Play-offs" is what a second division calls
      the matches deciding promotion, and they are the most-watched fixtures of
      that season. Synthetic, because no league the app holds has them — which is
      exactly why it is worth pinning before one does.
    */
    const day = (n: number) => new Date(Date.UTC(2026, 7, n))
    const season = [
      { round: 'Regular Season - 1', kickoff: day(1) },
      { round: 'Regular Season - 2', kickoff: day(8) },
      { round: 'Play-offs', kickoff: day(20) },
    ]
    expect(withoutQualifying(season, asDated)).toHaveLength(3)
  })

  it('drops a play-off round that comes before them', () => {
    // The same label, the other way round in time — which is the Champions
    // League's, and the only thing separating the two cases.
    const day = (n: number) => new Date(Date.UTC(2026, 7, n))
    const season = [
      { round: 'Play-offs', kickoff: day(1) },
      { round: 'League Stage - 1', kickoff: day(20) },
    ]
    expect(withoutQualifying(season, asDated).map((f) => f.round)).toEqual(['League Stage - 1'])
  })

  it('judges a round by its first fixture, so a postponed tie does not save it', () => {
    const day = (n: number) => new Date(Date.UTC(2026, 7, n))
    const season = [
      { round: '1st Qualifying Round', kickoff: day(1) },
      { round: '1st Qualifying Round', kickoff: day(25) }, // postponed past the start
      { round: 'League Stage - 1', kickoff: day(20) },
    ]
    expect(withoutQualifying(season, asDated).map((f) => f.round)).toEqual(['League Stage - 1'])
  })

  it('keeps everything when no round carries a number', () => {
    // A pure knockout cup gives the rule nothing to measure against, and
    // dropping the lot would be worse than dropping nothing.
    const day = (n: number) => new Date(Date.UTC(2026, 7, n))
    const cup = [
      { round: 'Round of 16', kickoff: day(1) },
      { round: 'Final', kickoff: day(20) },
    ]
    expect(withoutQualifying(cup, asDated)).toHaveLength(2)
  })

  it('is empty for an empty season', () => {
    expect(withoutQualifying([], asDated)).toEqual([])
  })
})

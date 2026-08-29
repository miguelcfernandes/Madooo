import { describe, expect, it } from 'vitest'

import {
  buildPool,
  DEFAULT_FORMATION,
  emptyPicks,
  fitToFormation,
  FORMATIONS,
  formationName,
  formationOf,
  isComplete,
  isFormation,
  isPickedTag,
  lineOf,
  lineSizes,
  linesOf,
  normaliseName,
  orderedPicks,
  parseFormation,
  parseLeagues,
  parseSpan,
  pickedCount,
  suggestNames,
  TOTW_NAME_MAX_LENGTH,
  type Candidate,
  type Line,
  type PickedTag,
} from './totw-picks'

/**
 * The decisions behind a team of the week: which shapes exist, which of a
 * player's performances represents him, and what a change of formation does to
 * an eleven half picked.
 *
 * These are not tested against a captured payload, unlike the mapper's tests,
 * and the reason is that there is no payload to capture: none of this comes from
 * API-Football. What a formation is, and which of two weeks counts, are
 * decisions this project made, so the fixtures are the shapes those decisions
 * are stated in. What *is* borrowed from the real data is the vocabulary — the
 * four position letters, and the fact that the column also holds nulls and the
 * odd `C`, which `architecture.md` records and the pool has to survive.
 */

/** A judged performance, with only the parts the pool actually reads. */
function candidate(
  playerId: number,
  name: string,
  position: string | null,
  tag: PickedTag,
  kickoff: string,
  matchSquadId = playerId * 100,
): Candidate {
  return {
    matchSquadId,
    tag,
    position,
    player: { id: playerId, name },
    match: { kickoff: new Date(kickoff) },
  }
}

describe('lineOf', () => {
  it('reads the four letters the provider uses', () => {
    expect(lineOf('G')).toBe('G')
    expect(lineOf('D')).toBe('D')
    expect(lineOf('M')).toBe('M')
    expect(lineOf('F')).toBe('F')
  })

  it('tolerates the casing and padding a text column can hold', () => {
    expect(lineOf(' m ')).toBe('M')
    expect(lineOf('f')).toBe('F')
  })

  // Both of these are in the development database today. See
  // `architecture.md` on the duplicate-player ghosts.
  it('has no line for a null or an unknown letter', () => {
    expect(lineOf(null)).toBeNull()
    expect(lineOf('C')).toBeNull()
  })
})

describe('formations', () => {
  it('every shape fills ten outfield places', () => {
    for (const formation of FORMATIONS) {
      expect(formation.D + formation.M + formation.F).toBe(10)
    }
  })

  it('no two shapes are the same three numbers', () => {
    const names = FORMATIONS.map(formationName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('a shape is named by its numbers', () => {
    expect(formationName({ D: 4, M: 3, F: 3 })).toBe('4-3-3')
  })

  it('counts the goalkeeper nobody chooses', () => {
    expect(lineSizes({ D: 3, M: 5, F: 2 })).toEqual({ G: 1, D: 3, M: 5, F: 2 })
  })

  it('accepts every shape it offers, and only those', () => {
    for (const formation of FORMATIONS) {
      expect(isFormation({ G: 1, ...formation })).toBe(true)
    }
    // Ten outfield players in a shape nobody is offered.
    expect(isFormation({ G: 1, D: 2, M: 6, F: 2 })).toBe(false)
    // The right shape with two keepers in it, which is eleven players and still
    // not a team.
    expect(isFormation({ G: 2, D: 4, M: 3, F: 3 })).toBe(false)
  })

  it('falls back rather than refusing an unknown name', () => {
    expect(parseFormation('4-3-3')).toEqual({ D: 4, M: 3, F: 3 })
    expect(parseFormation('7-2-1')).toBe(DEFAULT_FORMATION)
    expect(parseFormation(undefined)).toBe(DEFAULT_FORMATION)
    // `searchParams` hands back an array whenever a parameter is repeated.
    expect(parseFormation(['3-5-2', '4-4-2'])).toEqual({ D: 3, M: 5, F: 2 })
  })
})

describe('buildPool', () => {
  it('groups candidates into their lines', () => {
    const pool = buildPool([
      candidate(1, 'Alisson', 'G', 'STANDOUT', '2026-08-22T14:00:00Z'),
      candidate(2, 'Saliba', 'D', 'STANDOUT', '2026-08-22T14:00:00Z'),
      candidate(3, 'Rice', 'M', 'MVP', '2026-08-22T14:00:00Z'),
      candidate(4, 'Salah', 'F', 'MVP', '2026-08-22T14:00:00Z'),
    ])

    expect(pool.lines.G.map((one) => one.entry.player.name)).toEqual(['Alisson'])
    expect(pool.lines.D.map((one) => one.entry.player.name)).toEqual(['Saliba'])
    expect(pool.lines.M.map((one) => one.entry.player.name)).toEqual(['Rice'])
    expect(pool.lines.F.map((one) => one.entry.player.name)).toEqual(['Salah'])
    expect(pool.unplaceable).toBe(0)
  })

  it('is one row per player, not per performance', () => {
    const pool = buildPool([
      candidate(1, 'Salah', 'F', 'STANDOUT', '2026-08-19T19:00:00Z', 11),
      candidate(1, 'Salah', 'F', 'STANDOUT', '2026-08-22T14:00:00Z', 12),
    ])

    expect(pool.lines.F).toHaveLength(1)
    expect(pool.lines.F[0].judged).toBe(2)
  })

  it('represents a player by his strongest week, not his latest', () => {
    const pool = buildPool([
      candidate(1, 'Salah', 'F', 'MVP', '2026-08-19T19:00:00Z', 11),
      candidate(1, 'Salah', 'F', 'STANDOUT', '2026-08-22T14:00:00Z', 12),
    ])

    expect(pool.lines.F[0].entry.matchSquadId).toBe(11)
    expect(pool.lines.F[0].entry.tag).toBe('MVP')
  })

  it('breaks a tie on tag with the later kickoff', () => {
    const pool = buildPool([
      candidate(1, 'Salah', 'F', 'MVP', '2026-08-19T19:00:00Z', 11),
      candidate(1, 'Salah', 'F', 'MVP', '2026-08-22T14:00:00Z', 12),
    ])

    expect(pool.lines.F[0].entry.matchSquadId).toBe(12)
  })

  it('orders a line by verdict and then by name', () => {
    const pool = buildPool([
      candidate(1, 'Watkins', 'F', 'STANDOUT', '2026-08-22T14:00:00Z'),
      candidate(2, 'Isak', 'F', 'STANDOUT', '2026-08-22T14:00:00Z'),
      candidate(3, 'Salah', 'F', 'MVP', '2026-08-22T14:00:00Z'),
    ])

    expect(pool.lines.F.map((one) => one.entry.player.name)).toEqual(['Salah', 'Isak', 'Watkins'])
  })

  it('counts the players it cannot place rather than dropping them silently', () => {
    const pool = buildPool([
      candidate(1, 'Salah', 'F', 'MVP', '2026-08-22T14:00:00Z'),
      candidate(2, 'A. Ghost', null, 'STANDOUT', '2026-08-22T14:00:00Z'),
      candidate(3, 'Another', 'C', 'STANDOUT', '2026-08-22T14:00:00Z'),
    ])

    expect(pool.unplaceable).toBe(2)
    expect(pool.lines.F).toHaveLength(1)
  })
})

describe('picks', () => {
  const eleven = (): Record<Line, string[]> => ({
    G: ['keeper'],
    D: ['d1', 'd2', 'd3', 'd4'],
    M: ['m1', 'm2', 'm3', 'm4'],
    F: ['f1', 'f2'],
  })

  it('starts with four empty lines', () => {
    expect(pickedCount(emptyPicks<string>())).toBe(0)
  })

  it('counts across every line', () => {
    expect(pickedCount(eleven())).toBe(11)
  })

  it('is complete only when every line is exactly full', () => {
    const flat442 = { D: 4, M: 4, F: 2 }
    expect(isComplete(eleven(), flat442)).toBe(true)
    expect(isComplete(eleven(), { D: 4, M: 3, F: 3 })).toBe(false)
    expect(isComplete({ ...eleven(), G: [] }, flat442)).toBe(false)
  })

  it('keeps everyone who still fits when the shape changes', () => {
    const fitted = fitToFormation(eleven(), { D: 4, M: 3, F: 3 })

    // The back four and the keeper are untouched; midfield loses its last man.
    expect(fitted.G).toEqual(['keeper'])
    expect(fitted.D).toEqual(['d1', 'd2', 'd3', 'd4'])
    expect(fitted.M).toEqual(['m1', 'm2', 'm3'])
    // A line with room to spare is left short rather than filled.
    expect(fitted.F).toEqual(['f1', 'f2'])
  })

  it('drops the last player put in a line, not the first', () => {
    expect(fitToFormation(eleven(), { D: 3, M: 5, F: 2 }).D).toEqual(['d1', 'd2', 'd3'])
  })

  it('flattens keeper first and then up the pitch', () => {
    expect(orderedPicks(eleven())).toEqual([
      'keeper',
      'd1',
      'd2',
      'd3',
      'd4',
      'm1',
      'm2',
      'm3',
      'm4',
      'f1',
      'f2',
    ])
  })

  it('reads a stored eleven back into the lines it was saved in', () => {
    // What `TeamOfTheWeekPick` holds: an order, and a squad row with a position.
    const stored = orderedPicks(eleven()).map((name) => ({
      name,
      position: name === 'keeper' ? 'G' : name[0].toUpperCase(),
    }))

    const lines = linesOf(stored, (pick) => pick.position)

    expect(lines.G.map((one) => one.name)).toEqual(['keeper'])
    expect(lines.M.map((one) => one.name)).toEqual(['m1', 'm2', 'm3', 'm4'])
    expect(formationOf(lines)).toEqual({ D: 4, M: 4, F: 2 })
  })

  it('reading a stored eleven back is the inverse of storing it', () => {
    const picks = eleven()
    const stored = orderedPicks(picks).map((name) => ({
      name,
      position: name === 'keeper' ? 'G' : name[0].toUpperCase(),
    }))

    expect(orderedPicks(linesOf(stored, (pick) => pick.position)).map((one) => one.name)).toEqual(
      orderedPicks(picks),
    )
  })
})

describe('isPickedTag', () => {
  it('accepts the two a team of the week is picked from, and not the third', () => {
    expect(isPickedTag('MVP')).toBe(true)
    expect(isPickedTag('STANDOUT')).toBe(true)
    expect(isPickedTag('FLOP')).toBe(false)
    expect(isPickedTag(undefined)).toBe(false)
  })
})

describe('parseSpan', () => {
  const today = '2026-08-28'

  it('a bare address is the last seven days, today included', () => {
    expect(parseSpan(undefined, undefined, today)).toEqual({
      fromDay: '2026-08-22',
      toDay: '2026-08-28',
    })
  })

  it('takes a span the reader gave', () => {
    expect(parseSpan('2026-08-17', '2026-08-23', today)).toEqual({
      fromDay: '2026-08-17',
      toDay: '2026-08-23',
    })
  })

  it('measures the default week back from the end that was given', () => {
    expect(parseSpan(undefined, '2026-08-23', today)).toEqual({
      fromDay: '2026-08-17',
      toDay: '2026-08-23',
    })
  })

  it('swaps a span typed backwards rather than refusing it', () => {
    expect(parseSpan('2026-08-23', '2026-08-17', today)).toEqual({
      fromDay: '2026-08-17',
      toDay: '2026-08-23',
    })
  })

  it('falls back on a day that is not a day', () => {
    // `2026-02-30` matches the shape and is not a date, which is exactly what
    // `isDayKey`'s round trip is for.
    expect(parseSpan('2026-02-30', '2026-08-23', today).fromDay).toBe('2026-08-17')
    expect(parseSpan('nonsense', 'rubbish', today)).toEqual({
      fromDay: '2026-08-22',
      toDay: '2026-08-28',
    })
  })

  it('trims a span wider than a season, keeping the end', () => {
    const span = parseSpan('1970-01-01', '2026-08-23', today)
    expect(span.toDay).toBe('2026-08-23')
    expect(span.fromDay).toBe('2025-08-23')
  })

  it('holds a single day', () => {
    expect(parseSpan('2026-08-23', '2026-08-23', today)).toEqual({
      fromDay: '2026-08-23',
      toDay: '2026-08-23',
    })
  })
})

describe('parseLeagues', () => {
  const offered = [{ id: 1 }, { id: 2 }, { id: 3 }]

  it('is exactly what was chosen', () => {
    expect(parseLeagues(['1', '3'], offered)).toEqual([1, 3])
  })

  it('a single value is not an array, and still counts', () => {
    expect(parseLeagues('2', offered)).toEqual([2])
  })

  // The boxes open unticked, so this is the state a bare address arrives in —
  // and it means an empty pool rather than every competition, which is what it
  // used to mean back when they opened ticked.
  it('choosing none is choosing none', () => {
    expect(parseLeagues(undefined, offered)).toEqual([])
    expect(parseLeagues([], offered)).toEqual([])
  })

  it('choosing all of them keeps all of them', () => {
    expect(parseLeagues(['1', '2', '3'], offered)).toEqual([1, 2, 3])
  })

  it('ignores an id no competition has', () => {
    expect(parseLeagues(['1', '99'], offered)).toEqual([1])
    expect(parseLeagues(['99'], offered)).toEqual([])
  })

  it('ignores a value that is not a number at all', () => {
    expect(parseLeagues(['1', 'toString'], offered)).toEqual([1])
  })

  it('counts a repeated id once', () => {
    expect(parseLeagues(['2', '2'], offered)).toEqual([2])
  })
})

describe('normaliseName', () => {
  it('trims, and keeps what is left', () => {
    expect(normaliseName('  Team of the week  ')).toBe('Team of the week')
  })

  it('refuses what is not a name', () => {
    expect(normaliseName('')).toBeNull()
    expect(normaliseName('   ')).toBeNull()
    expect(normaliseName(undefined)).toBeNull()
    expect(normaliseName(42)).toBeNull()
  })

  it('refuses one longer than the limit, rather than cutting it', () => {
    expect(normaliseName('x'.repeat(TOTW_NAME_MAX_LENGTH))).toHaveLength(TOTW_NAME_MAX_LENGTH)
    expect(normaliseName('x'.repeat(TOTW_NAME_MAX_LENGTH + 1))).toBeNull()
  })
})

describe('suggestNames', () => {
  it('offers the plain one and the span, in that order', () => {
    expect(suggestNames('17–23 Aug', [])).toEqual(['Team of the week, 17–23 Aug', '17–23 Aug'])
  })

  it('names the competition when there is exactly one', () => {
    expect(suggestNames('17–23 Aug', [{ name: 'Premier League' }])).toEqual([
      'Team of the week, 17–23 Aug',
      'Premier League team of the week, 17–23 Aug',
      '17–23 Aug',
    ])
  })

  // Two competitions cannot be named without either listing them or picking
  // one, and picking one would be a lie about where the eleven came from.
  it('names no competition when there is more than one', () => {
    expect(suggestNames('17–23 Aug', [{ name: 'Premier League' }, { name: 'La Liga' }])).toEqual([
      'Team of the week, 17–23 Aug',
      '17–23 Aug',
    ])
  })

  it('never offers a name the action would refuse', () => {
    const long = 'A'.repeat(TOTW_NAME_MAX_LENGTH)
    for (const name of suggestNames('17–23 Aug', [{ name: long }])) {
      expect(name.length).toBeLessThanOrEqual(TOTW_NAME_MAX_LENGTH)
    }
  })
})

/**
 * What the cron route accepts, and what it refuses.
 *
 * The claim under test is our own argument rules rather than anything the
 * provider returns, so these are constructed inputs — the same reading
 * `hydration.test.ts` states for its boundary cases. The one that earns this
 * file on its own is the first: **a request with no query string at all has to
 * mean `--due`**, because that is the only thing Vercel Cron ever sends, and
 * getting it wrong would leave the schedule running and syncing nothing.
 */

import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SYNC_OPTIONS,
  syncOptionsFromSearchParams,
  validateSyncOptions,
} from './sync-options'

const parse = (query: string) => syncOptionsFromSearchParams(new URLSearchParams(query))

describe('syncOptionsFromSearchParams', () => {
  it('reads a bare request as --due, which is what the schedule sends', () => {
    expect(parse('')).toEqual({ ...DEFAULT_SYNC_OPTIONS, due: true })
  })

  it('treats an empty round as no round rather than as a mode with no label', () => {
    expect(parse('round=')).toEqual({ ...DEFAULT_SYNC_OPTIONS, due: true })
    expect(parse('round=%20')).toEqual({ ...DEFAULT_SYNC_OPTIONS, due: true })
  })

  it('takes a round, and stops defaulting to due when it has one', () => {
    expect(parse('round=7')).toEqual({ ...DEFAULT_SYNC_OPTIONS, round: '7' })
  })

  it('takes the repair tool whole', () => {
    expect(parse('round=7&league=94&limit=2')).toEqual({
      ...DEFAULT_SYNC_OPTIONS,
      round: '7',
      league: 94,
      limit: 2,
    })
  })

  it('reads a flag as on when present, off when explicitly 0 or false', () => {
    expect(parse('dry-run').dryRun).toBe(true)
    expect(parse('dry-run=1').dryRun).toBe(true)
    expect(parse('dry-run=true').dryRun).toBe(true)
    expect(parse('dry-run=0').dryRun).toBe(false)
    expect(parse('dry-run=false').dryRun).toBe(false)
    expect(parse('dry-run=FALSE').dryRun).toBe(false)
  })

  it('runs the calendars alone without falling back to due', () => {
    expect(parse('fixtures-only')).toEqual({ ...DEFAULT_SYNC_OPTIONS, fixturesOnly: true })
  })

  it('refuses two modes at once', () => {
    expect(() => parse('fixtures-only&round=7')).toThrow(/exactly one/)
    expect(() => parse('due&round=7')).toThrow(/exactly one/)
  })

  it('refuses a dry run of anything but --due, which could not honour the flag', () => {
    expect(() => parse('round=7&dry-run')).toThrow(/dry-run/)
    expect(() => parse('fixtures-only&dry-run')).toThrow(/dry-run/)
  })

  it('refuses a league or a limit that is not a whole number above zero', () => {
    for (const query of ['league=0', 'league=-1', 'league=abc', 'league=94.5']) {
      expect(() => parse(query), query).toThrow(/league/)
    }
    for (const query of ['limit=0', 'limit=-1', 'limit=abc', 'limit=1.5']) {
      expect(() => parse(query), query).toThrow(/limit/)
    }
  })
})

describe('validateSyncOptions', () => {
  it('refuses the defaults, which name no mode', () => {
    expect(() => validateSyncOptions({ ...DEFAULT_SYNC_OPTIONS })).toThrow(/exactly one/)
  })

  it('accepts each mode on its own and returns what it was given', () => {
    const due = { ...DEFAULT_SYNC_OPTIONS, due: true }
    expect(validateSyncOptions(due)).toBe(due)
    expect(() => validateSyncOptions({ ...DEFAULT_SYNC_OPTIONS, round: '7' })).not.toThrow()
    expect(() =>
      validateSyncOptions({ ...DEFAULT_SYNC_OPTIONS, fixturesOnly: true }),
    ).not.toThrow()
  })
})

/**
 * The diary's view table.
 *
 * Nothing here comes from a captured payload, and it should not: a view slug is
 * our own vocabulary, not API-Football's. What is asserted is the thing the
 * table is for — that an untrusted URL parameter always lands on a real view.
 */

import { describe, expect, it } from 'vitest'

import { DIARY_VIEWS, parseView } from './diary-views'

describe('DIARY_VIEWS', () => {
  it('opens on the unfiltered list of entries', () => {
    // `parseView` falls back to index 0, so the order is load-bearing rather
    // than cosmetic.
    const first = DIARY_VIEWS[0]
    expect(first.slug).toBe('all')
    expect(first.kind).toBe('entries')
    if (first.kind === 'entries') expect(first.where).toEqual({})
  })

  it('gives every view a distinct slug', () => {
    const slugs = DIARY_VIEWS.map((view) => view.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('gives every view something to say when it has nothing to show', () => {
    // Every slice owns its empty state, and a view with no sentence would
    // render a blank page rather than an answer.
    for (const view of DIARY_VIEWS) expect(view.empty.length, view.slug).toBeGreaterThan(0)
  })

  it('offers exactly one view that lists matches rather than entries', () => {
    // The discriminant is what stops `diaryEntries` being handed a view with no
    // `where`, so a second match view appearing unnoticed would be a bug.
    const matches = DIARY_VIEWS.filter((view) => view.kind === 'matches')
    expect(matches.map((view) => view.slug)).toEqual(['matches'])
  })

  it('asks for a missing note by null alone', () => {
    // `setNote` stores a cleared note as no judgement or as a null column, never
    // as an empty string — so `{ not: null }` is the whole of the test, and an
    // extra `{ not: '' }` would be answering a case that cannot occur.
    const notes = DIARY_VIEWS.find((view) => view.slug === 'notes')
    expect(notes?.kind).toBe('entries')
    if (notes?.kind === 'entries') expect(notes.where).toEqual({ note: { not: null } })
  })
})

describe('parseView', () => {
  it('finds each view by its slug', () => {
    for (const view of DIARY_VIEWS) expect(parseView(view.slug)).toBe(view)
  })

  it('falls back to All for anything unrecognised', () => {
    // A mistyped query string should show the diary, not an error page.
    for (const value of [undefined, '', 'Matches', 'MVP', 'nonsense', null, 0])
      expect(parseView(value).slug).toBe('all')
  })

  it('falls back for the three views the diary used to offer', () => {
    // `mvp`, `standout` and `flop` were real slugs until the five views became
    // three, so an old bookmark or a stale `?from=` still arrives. It opens the
    // diary rather than breaking, which is the whole point of falling back.
    for (const gone of ['mvp', 'standout', 'flop']) expect(parseView(gone).slug).toBe('all')
  })

  it('takes the first of a repeated parameter', () => {
    // `/diary?view=notes&view=matches` arrives as an array — Next hands
    // `searchParams` over as `string | string[] | undefined`.
    expect(parseView(['notes', 'matches']).slug).toBe('notes')
  })

  it('falls back when a repeated parameter leads with rubbish', () => {
    expect(parseView(['nonsense', 'notes']).slug).toBe('all')
  })
})

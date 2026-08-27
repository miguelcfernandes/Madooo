/**
 * The changelog's one invariant, over the real entries rather than a fixture.
 *
 * A departure from the rule the other tests follow — the mapper's inputs come
 * out of `scratch/` because a fixture written from memory agrees with the code
 * that was written from the same memory. That reasoning does not apply here:
 * this file *is* the payload. It is hand-maintained data that ships, so the
 * thing worth asserting is that the data is well-formed, and the only honest
 * source for that is the data itself.
 *
 * What is deliberately not asserted: anything about what the entries *say*. A
 * test that pinned the copy would fail on every edit and prove nothing about
 * whether the sentence is true, which is the only property that matters and the
 * only one a test cannot check.
 */

import { describe, expect, it } from 'vitest'

import { CHANGELOG } from './changelog'
import { groupByMonth, monthLabel } from './dates'

describe('CHANGELOG', () => {
  it('has entries', () => {
    // Not a tautology: the page draws nothing at all for an empty list, and a
    // bad edit that leaves the array empty type-checks perfectly.
    expect(CHANGELOG.length).toBeGreaterThan(0)
  })

  it('carries a real date on every entry', () => {
    // `new Date('2026-08-32')` is `Invalid Date`, not a throw. It renders as
    // literal "Invalid Date" through Intl and would ship that way.
    for (const entry of CHANGELOG) {
      expect(Number.isNaN(entry.date.getTime()), entry.title).toBe(false)
    }
  })

  it('is written newest first', () => {
    const times = CHANGELOG.map((entry) => entry.date.getTime())
    // Non-increasing rather than strictly decreasing: several entries land on
    // one day, which is what a slice carrying three changes looks like.
    expect(times, 'an entry is filed out of order').toEqual([...times].sort((a, b) => b - a))
  })

  it('gives each month exactly one heading', () => {
    // The consequence of the rule above, and the reason it is a rule.
    // `groupByMonth` never sorts — see its docblock — so an entry out of order
    // draws its month's heading a second time further down the page rather than
    // moving. Asserted separately because this is the visible failure, and a
    // future page that groups some other way should still be held to it.
    const labels = groupByMonth(CHANGELOG, (entry) => entry.date).map((month) => month.label)
    expect(labels).toEqual([...new Set(labels)])
    expect(labels).toContain(monthLabel(CHANGELOG[0].date))
  })
})

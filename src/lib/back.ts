/**
 * Where "Back" goes on a screen reached from more than one place.
 *
 * A player profile is opened from a squad list, from the "Your verdicts" panel
 * and from the diary, so no single parent is the right destination and the
 * design's own "← Back" names none. The origin therefore travels in the URL —
 * `/players/44?from=/diary?filter=mvp` — and this module turns it back into a
 * link. A server component cannot call `history.back()`, and putting the origin
 * in the URL keeps the page a server component, which is the same reason the
 * fixtures page's day and the diary's filter live there.
 *
 * **The href is rebuilt from parsed parts and the input is never echoed.** A
 * `?from` written straight into a `<Link>` is an open redirect: anyone can send
 * `?from=https://…` and have the app render a link to it under its own chrome.
 * Recognising a small set of our own shapes and reconstructing them means a
 * value that is not one of them cannot survive at all, which is a stronger
 * guarantee than a list of things to reject.
 *
 * Pure, so `back.test.ts` can assert that. `diary-views.ts` and
 * `player-views.ts` import Prisma's *types* only and `import type` is erased at
 * compile time, so nothing here pulls the client into a test; `dates.ts` imports
 * nothing at all.
 */

import { DIARY_VIEWS } from './diary-views'
import { isDayKey } from './dates'
import { PLAYER_VIEWS } from './player-views'

export interface BackLink {
  href: string
  label: string
}

/**
 * Where a reader who typed a URL belongs, per screen. Which of the two applies
 * is the caller's, because it is a fact about the screen holding the link
 * rather than about the value being parsed: a club falling back to `/players`
 * would send the reader somewhere they had never been.
 */
export const PLAYERS: BackLink = { href: '/players', label: 'Back to Players' }
export const TEAMS: BackLink = { href: '/teams', label: 'Back to Teams' }

/** `/matches/12`, and nothing that merely starts that way. */
const MATCH = /^\/matches\/(\d+)$/

/** The two profiles, which are origins for each other: a club lists players, a player names his club. */
const PLAYER = /^\/players\/(\d+)$/
const TEAM = /^\/teams\/(\d+)$/

/**
 * Where the reader came from, or `fallback` if we cannot tell.
 *
 * `unknown` rather than `string` because this is handed the raw value out of
 * `searchParams`, which is `string | string[] | undefined` and an array whenever
 * the parameter is repeated — the same signature `parseView` takes.
 */
export function backLink(from: unknown, fallback: BackLink = PLAYERS): BackLink {
  const value = Array.isArray(from) ? from[0] : from
  if (typeof value !== 'string') return fallback

  // Split once, on the first `?`. A second one is part of the query string as
  // far as we are concerned, and every branch below rebuilds its own anyway.
  const mark = value.indexOf('?')
  const path = mark === -1 ? value : value.slice(0, mark)
  const query = mark === -1 ? '' : value.slice(mark + 1)

  // An absolute URL, a protocol-relative `//evil.com` and a bare word all fail
  // every pattern below and fall through to `/players`. That is the whole of the
  // open-redirect guard, and it holds because nothing here returns `value`.
  const match = MATCH.exec(path)
  if (match !== null) return { href: `/matches/${match[1]}`, label: 'Back to the match' }

  const team = TEAM.exec(path)
  if (team !== null) return { href: `/teams/${team[1]}`, label: 'Back to the club' }

  const player = PLAYER.exec(path)
  if (player !== null) {
    // The tab he was reading travels with him, the way the diary's filter does.
    // One list of slugs, in `player-views.ts`; an unknown one drops to the
    // default view rather than being carried through.
    const view = new URLSearchParams(query).get('view')
    const known = PLAYER_VIEWS.find((candidate) => candidate.slug === view)
    return {
      href:
        known === undefined || known === PLAYER_VIEWS[0]
          ? `/players/${player[1]}`
          : `/players/${player[1]}?view=${known.slug}`,
      label: 'Back to the player',
    }
  }

  if (path === '/diary') {
    // One list of slugs, in `diary-views.ts`. An unknown one drops to the
    // default diary rather than being carried through — which is what an old
    // `?view=mvp` bookmark now does, since that view no longer exists.
    const view = new URLSearchParams(query).get('view')
    const known = DIARY_VIEWS.find((candidate) => candidate.slug === view)
    return {
      href: known === undefined || known === DIARY_VIEWS[0] ? '/diary' : `/diary?view=${known.slug}`,
      label: 'Back to Diary',
    }
  }

  if (path === '/fixtures') {
    // One parameter now, where there were two: the day. A league and a matchday
    // had to be kept or dropped independently, because a matchday means a
    // different weekend in each competition; a date means the same day in all of
    // them, which is the point of the screen it returns to.
    const date = new URLSearchParams(query).get('date')

    // `isDayKey` is a real check rather than a shape test — it rebuilds the day
    // and reads it back — so an unparseable date cannot survive. Rebuilt rather
    // than echoed either way, which is what keeps the open-redirect guarantee
    // above intact. A dropped date lands on `/fixtures`, which is today, and a
    // reader who came from today gets exactly where they were.
    return {
      href: date !== null && isDayKey(date) ? `/fixtures?date=${date}` : '/fixtures',
      label: 'Back to fixtures',
    }
  }

  return fallback
}

/**
 * A link to a profile that remembers where it was clicked.
 *
 * The encoding happens here, once, because a `from` carrying `?view=notes` has
 * to survive being a value inside another query string — and a call site that
 * forgot would lose the view silently rather than visibly.
 */
export function playerHref(playerId: number, from: string): string {
  return `/players/${playerId}?from=${encodeURIComponent(from)}`
}

export function teamHref(teamId: number, from: string): string {
  return `/teams/${teamId}?from=${encodeURIComponent(from)}`
}

'use client'

import { getToken } from '@clerk/nextjs'

/**
 * Bring the session cookie up to date before a write leaves the browser.
 *
 * **This is the fix for a bug that presented as "that did not save" and had
 * nothing to do with saving.** It is worth writing down at length, because
 * nothing about the symptom points at the cause and the next person to meet it
 * will start where the last one did.
 *
 * Clerk's `__session` cookie is a signed JWT that **expires after 60 seconds**.
 * The account itself is good for weeks — that cookie is not the login, it is a
 * short-lived proof of one, and `clerk-js` mints a fresh one on a timer for as
 * long as the tab is open. None of that is normally visible.
 *
 * The trouble is what Clerk does when a request arrives carrying an expired
 * one. It has two ways to recover — the handshake redirect, and a refresh-token
 * exchange — and in `@clerk/backend` **both are refused for anything that is
 * not a GET**:
 *
 * ```js
 * isRequestEligibleForHandshake() {
 *   if (method !== 'GET') return false
 * ```
 * ```js
 * if (request.method !== 'GET') refreshError = NonEligibleNonGet
 * ```
 *
 * The reasoning is sound — a handshake is a redirect, and bouncing a POST
 * through a redirect loses the body. The consequence for us is that a Server
 * Action, which is a POST to the page's own URL, gets no recovery at all: Clerk
 * reports that one request as signed-out, `proxy.ts` believes it and redirects
 * to `/`, and the RSC client, handed a page where it expected an action result,
 * rejects with something that is not a `TypeError`. Which is
 * [`verdict-controls.tsx`](./verdict-controls.tsx)'s "something went wrong".
 *
 * So the reader was never signed out, no request was ever logged as a failure —
 * the action did not run, so there was nothing to log — and the next page load,
 * being a GET, renewed the cookie silently and made the problem vanish. That is
 * why it read as intermittent, and why it could not be reproduced on demand.
 *
 * **Why it happens to some readers and not others.** The renewal is a timer in
 * the tab, and browsers throttle timers in tabs that are not in front. A reader
 * with the match on one screen and this app on another sits in exactly the state
 * where the cookie lapses between taps.
 *
 * `getToken()` is what closes the window, and it is close to free in the case
 * that is not broken: the token is cached, so a cookie that is still current
 * costs no network at all. It is only when the cached token has expired — the
 * throttled tab, precisely — that it fetches a new one, and writing the new
 * token into the cookie is the same path `clerk-js` uses for its own timer.
 *
 * **Before the write rather than on a timer of our own**, because a timer would
 * be throttled by the same rule that caused this. A tap is not throttled: it is
 * the reader's own gesture, and it is the only moment the cookie has to be
 * current.
 *
 * **A failure here is swallowed on purpose.** If the token cannot be refreshed —
 * offline, or Clerk failed to load — the write should still be attempted rather
 * than blocked by its own preflight. It will fail, and the caller already draws
 * that failure and logs the real reason. Two error paths for one tap would give
 * the reader two chances to be told the same thing.
 */
export async function refreshSession(): Promise<void> {
  try {
    await getToken()
  } catch {
    // Deliberately ignored — see above.
  }
}

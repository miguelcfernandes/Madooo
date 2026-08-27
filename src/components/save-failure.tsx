'use client'

/**
 * The line a squad row draws when a write did not land, with the retry.
 *
 * One component rather than two copies, because there are now two writes on a
 * row — the verdict chips and the note — and they fail in exactly the same ways
 * for exactly the same reasons. What is being shared is mostly the *wording*:
 * "that did not save" is a promise to the reader about the state of their diary,
 * and two spellings of it that could drift apart is a worse outcome than the few
 * lines of markup saved.
 */

type Props = {
  /**
   * Whether the request never completed, as opposed to completing and coming
   * back wrong. The caller decides — it is `error instanceof TypeError`, which
   * is what `fetch` itself rejects with — and the split is the only distinction
   * worth drawing for whoever is holding the phone: one of them is their
   * connection and the other one is ours.
   */
  offline: boolean
  /** Re-send the same write. The caller holds what it was. */
  onRetry: () => void
}

export function SaveFailure({ offline, onRetry }: Props) {
  return (
    /*
      `role="status"` announces this without stealing focus, which is what a
      reader tapping down a team sheet needs — `alert` would interrupt them
      mid-row. It also has to be the element that *appears*, not one that was
      already here holding an empty string, or nothing is announced at all.

      `text-alert`, not `text-flop`. They resolve to the same red, and
      foundations is explicit that this is not a reason to share a token: a
      verdict and a failure are different facts, and the two are side by side on
      this very row, where a shared name would be read as a FLOP.
    */
    <p role="status" className="text-caption text-alert">
      {offline
        ? 'That did not save — check your connection.'
        : 'That did not save — something went wrong.'}{' '}
      <button
        type="button"
        onClick={onRetry}
        className="t-hover cursor-pointer underline underline-offset-2 hover:text-text focus-visible:focus-ring"
      >
        Try again
      </button>
    </p>
  )
}

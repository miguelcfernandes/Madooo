/**
 * What has changed in the app, in the reader's words rather than the author's.
 *
 * **A hand-written file, and deliberately not generated from `git log`.** The
 * commit history is already the project's record — `docs/roadmap.md` says so,
 * and every slice's reasoning lives in its squash commit — so the obvious move
 * is to render that history here and keep one source of truth. It was declined
 * for three reasons, and the third is the one that settles it. Vercel clones
 * shallowly, so the history may not be in the build at all. The log mixes
 * slices with `config:`, `docs:` and `chore:`, so a filter would turn the commit
 * prefix into a product decision. And a commit subject is written for whoever
 * reads this repository next — "the functions run in lhr1 again" is true, and
 * says nothing to somebody who keeps a football diary. Filtering and rewriting
 * the log lands exactly here, by a longer road.
 *
 * So this is a second telling, and the discipline that keeps it honest is that
 * **an entry is written in the same commit as the thing it describes**. That is
 * a step in the loop in `AGENTS.md`, not a convention to remember. The payoff is
 * the property a database-backed changelog could not have: this ships with the
 * deploy, so it cannot describe code that is not live.
 *
 * **Not everything that happened is in here**, and the omissions are the point.
 * Infrastructure a reader cannot see — the schema, the deploy region, the sync's
 * selection rules — is left out however much work it was. So is anything that
 * has since been removed: `/fixtures` counted verdicts per row for three weeks
 * before the mark replaced the count, and listing both would spend two entries
 * teaching a reader about a screen that no longer exists.
 *
 * **The league names in here are history, not configuration, and the difference
 * is the first non-negotiable.** `AGENTS.md` forbids anything under `src/app/`
 * reading `LEAGUES`, so that no second source can disagree with the `League`
 * table about which competitions exist. Nothing here is such a source: an entry
 * says a league was *added on a date*, which stays true whatever `LEAGUES` holds
 * afterwards, and no screen reads these names to decide anything. An entry that
 * tried to say what the app covers *now* would be the violation — the fix for
 * wanting one is to read the table, as every page already does.
 */

/**
 * `items` and `note` are separate on purpose, and the split survives from the
 * temporary sidebar note this replaces. `items` is a list of names and renders
 * as one — three leagues are three things. `note` is a phrase and renders as a
 * paragraph, so it wraps to the column rather than being hand-broken into rows
 * at whatever width the screen happened to be.
 *
 * Both are optional and an entry may carry either, neither or both: a headline
 * that explains itself needs no second line, and the app itself is the rest of
 * the explanation.
 */
type Written = {
  /**
   * `YYYY-MM-DD`, the day it reached the app. A string here and a `Date` on the
   * way out — see `CHANGELOG` below.
   */
  date: string
  /** The headline. No full stop: it is a title, not a sentence. */
  title: string
  /** One sentence, when the headline needs one. */
  note?: string
  /** Named things, where a list is what it is. */
  items?: string[]
}

/** What the page reads: `Written` with its date resolved. */
export type ChangelogEntry = Omit<Written, 'date'> & { date: Date }

/**
 * **Newest first, and the order is load-bearing.** `groupByMonth` in
 * [`dates.ts`](./dates.ts) cuts a run into months without sorting it — it opens
 * a new group whenever the label changes — so an entry filed out of order would
 * draw its month's heading twice rather than being quietly re-sorted. That is
 * the one mistake a hand-maintained list invites, so `changelog.test.ts` asserts
 * against it rather than trusting the next person to notice.
 */
const WRITTEN: Written[] = [
  {
    date: '2026-08-28',
    title: 'Pick a team of the week',
    note: 'Choose a run of days and the competitions that count, then build an eleven out of everyone you marked MVP or standout in them, in the formation you want. Name it, and it is drawn on a pitch you can screenshot — your list shows every one you have picked, and a player who is in any of them says so on his own profile.',
  },
  {
    date: '2026-08-27',
    title: 'Why a live match has no players to rate',
    note: 'A match under way with no team sheet now carries a mark you can hover or tap, saying the data provider has not published one.',
  },
  {
    date: '2026-08-27',
    title: 'Verdicts and notes save the first time',
    note: 'A verdict or note written after the app had been sitting in another tab could fail without saving; it now saves, and a note that does fail says so instead of disappearing.',
  },
  {
    date: '2026-08-27',
    title: 'Notes stay where the cursor is',
    note: 'Typing into the middle of a note no longer jumps to the end after each letter.',
  },
  {
    date: '2026-08-25',
    title: 'A mark on the fixtures you have written in',
    note: 'A line down the leading edge of every row you have judged a player in or left a note on.',
  },
  {
    date: '2026-08-25',
    title: 'A new look',
    note: 'New type, colour and icons throughout, and a dark theme retuned end to end.',
  },
  {
    date: '2026-08-25',
    title: 'Three more leagues',
    items: ['Bundesliga', 'Ligue 1', 'Allsvenskan'],
  },
  {
    date: '2026-08-25',
    title: 'Fixtures are grouped by competition',
    note: 'One block per league, with the matchday on its header.',
  },
  {
    date: '2026-08-24',
    title: 'A verdict that fails to save says so',
    note: 'Instead of the chip going quietly back to how it was.',
  },
  {
    date: '2026-08-23',
    title: 'The diary lists the matches you watched',
    note: 'A tab of its own: one row per match you wrote in, naming the MVP you gave.',
  },
  {
    date: '2026-08-23',
    title: 'Fixtures a day at a time',
    note: 'The page opens on today, and the arrows step to the next day with football in it.',
  },
  {
    date: '2026-08-22',
    title: 'Suggest a feature',
    note: 'A box in the top bar. You will not get a reply, but it is read.',
  },
  {
    date: '2026-08-18',
    title: 'A fourth league, Serie A',
  },
  {
    date: '2026-08-17',
    title: 'A match that was called off says so',
    note: 'POSTPONED or CANCELLED stands where the kickoff would be.',
  },
  {
    date: '2026-08-16',
    title: 'Players says who is in it',
    note: 'A player joins the directory when they are first named in a matchday squad, so an empty search is not a mystery.',
  },
  {
    date: '2026-08-16',
    title: 'Every click answers at once',
    note: 'The app now runs beside its own database, and each screen has something to show while it loads.',
  },
  {
    date: '2026-08-15',
    title: 'A match opens as soon as the team sheets are out',
    note: 'About 45 minutes before kickoff, rather than after full time.',
  },
  {
    date: '2026-08-15',
    title: 'Fixtures and squads keep themselves current',
    note: 'Scores, team sheets and rescheduled matches are read in every ten minutes.',
  },
  {
    date: '2026-08-15',
    title: 'Kickoff times on your own clock',
    note: 'Wherever you are reading from, rather than in London time.',
  },
  {
    date: '2026-08-13',
    title: 'A third league, La Liga',
    note: 'Every competition now carries its national flag beside its name.',
  },
  {
    date: '2026-08-12',
    title: 'A second league, the Primeira Liga',
  },
  {
    date: '2026-08-11',
    title: 'The season you are actually watching',
    note: 'The app follows the live season, rather than one two years past.',
  },
  {
    date: '2026-08-05',
    title: 'Players and teams',
    note: 'Two directories and a profile each — every player named in a squad this season, and every club that has played.',
  },
  {
    date: '2026-08-03',
    title: 'The diary',
    note: 'Everything you have written this season, newest first, cut into months.',
  },
  {
    date: '2026-08-03',
    title: 'Tag a player, and write a note',
    note: 'MVP, standout or flop on anyone in the matchday squad, substitutes included, and a note on any of them.',
  },
  {
    date: '2026-08-02',
    title: 'The app opens',
    note: 'Fixtures, a page per match with both squads, and a dark theme.',
  },
]

/**
 * The dates resolved once, here, rather than at every call site.
 *
 * `new Date('2026-08-27')` parses a date-only ISO string as **UTC midnight**,
 * which is safe for the one thing this file's dates are used for. Everything the
 * app renders is dated in Europe/London — [`dates.ts`](./dates.ts) pins it, and
 * says why — and London is never behind UTC, so UTC midnight and London always
 * name the same calendar day. A zone west of Greenwich would not have that
 * property and this would need a time on it.
 *
 * A typo that yields `Invalid Date` throws nothing and renders nothing useful,
 * so the test asserts every date parses rather than leaving it to be noticed.
 */
export const CHANGELOG: ChangelogEntry[] = WRITTEN.map(({ date, ...rest }) => ({
  ...rest,
  date: new Date(date),
}))

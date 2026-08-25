import { requireDbUser } from "@/lib/auth";
import { dayKey, dayRange, parseDay } from "@/lib/dates";
import { season } from "@/lib/env";
import { fixturesOnDay, neighbouringDays, seasonTotals } from "@/lib/fixtures";
import { groupByLeague } from "@/lib/leagues";
import { roundDisplay } from "@/lib/rounds";
import { DayPager } from "@/components/day-pager";
import { FixtureRow } from "@/components/fixture-row";
import { LeagueFlag } from "@/components/league-flag";
import { PageHeader } from "@/components/page-header";
import { FIXTURE_TILES, StatTiles } from "@/components/stat-tiles";

/**
 * Render on every request rather than once during `next build`.
 *
 * Next prerenders pages at build time by default, which here would freeze
 * whatever the database held the moment the deployment was built — and would
 * freeze *today* along with it, on a page whose whole subject is what day it is.
 * It would also prove the wrong thing: that the build container could reach
 * Neon, not that the running server can.
 */
export const dynamic = "force-dynamic";

/**
 * A day of football, every competition at once.
 *
 * **Why a day rather than a matchday.** A round is not atomic in time and is not
 * stable in it either: the provider moves fixtures out of their round's weekend
 * and the label stays put, so a match postponed from Matchday 1 and played five
 * weeks later was reachable only by a reader who knew which round to page back
 * to. A day is what somebody actually remembers about a match they watched. It
 * is also the only unit every competition shares — a round means something
 * different in each, and a knockout tie has no number at all — which is what
 * lets a cup join this screen without a second kind of pager.
 *
 * The day lives in the URL — `/fixtures?date=2026-08-23` — rather than in React
 * state, and that one choice is what keeps this whole page a server component.
 * The pager is three `<Link>`s, no JavaScript ships, and a day can be linked to,
 * bookmarked and reached with the back button.
 *
 * **A bare `/fixtures` is always today**, even when today has no football on it.
 * That was chosen over falling forward to the next fixture or back to the last:
 * an app that silently showed you a different day than the one you asked for
 * would be lying about what it is showing, and the arrows make the nearest real
 * day one click away in either direction.
 *
 * Two Next specifics. `searchParams` is a **Promise** and has to be awaited:
 * Next 15 made request-time inputs async so rendering can start before the
 * request is fully parsed, and reading it synchronously is deprecated.
 * `PageProps<'/fixtures'>` is a globally available helper that derives the prop
 * types from the route literal, so the path and its types cannot drift apart.
 */
export default async function Fixtures({
  searchParams,
}: PageProps<"/fixtures">) {
  const currentSeason = season();
  const { date } = await searchParams;

  // Today in London, which is the zone `dates.ts` owns and the one every date on
  // this screen is measured in. It is both the default day and what tells the
  // pager whether to offer its "Today" link.
  const today = dayKey(new Date());
  const day = parseDay(date, today);
  const { from, to } = dayRange(day);

  // The tallies below belong to one user, so the page needs our own `User.id`.
  // The upsert behind this is memoised per request, so it costs one indexed
  // lookup.
  const user = await requireDbUser();

  /*
    One round trip's worth of waiting for all three, because none of them
    depends on the others — the day was decided before any of them ran. This
    page used to ask Neon six times in sequence, each answer deciding the next
    question, because a league had to be chosen before its rounds could be
    grouped and a round chosen before its fixtures could be read. Indexing by
    day removes the chain rather than optimising it: a date needs no lookup to
    resolve.
  */
  const [fixtures, neighbours, totals] = await Promise.all([
    fixturesOnDay(currentSeason, from, to, user.id),
    neighbouringDays(currentSeason, from, to),
    seasonTotals(currentSeason, user.id),
  ]);

  // Kickoff order within a competition is Postgres', in the query's `ORDER BY`;
  // which competition leads the page is `groupByLeague`'s, and no `ORDER BY`
  // could answer it. See `LEAGUE_ORDER` in `leagues.ts` for why.
  const sections = groupByLeague(fixtures, (match) => match.league);

  // Nothing anywhere this season, rather than nothing on this day. Said out loud
  // rather than rendered as an empty list: a deployment pointed at the wrong
  // database should look broken, not merely quiet. The two are distinguishable
  // precisely because the arrows know whether football exists on either side.
  const seasonIsEmpty =
    fixtures.length === 0 &&
    neighbours.previous === null &&
    neighbours.next === null;

  return (
    <>
      <PageHeader title="Fixtures">
        Every competition, day by day. Open any fixture to rate the players.
      </PageHeader>

      {/* Drawn on every branch. A page that hid its tallies while saying it had
          no fixtures would be hiding two different facts behind one message. */}
      <StatTiles tiles={FIXTURE_TILES} totals={totals} />

      <div className="mb-6 flex justify-center sm:justify-start">
        <DayPager
          day={day}
          previous={neighbours.previous}
          next={neighbours.next}
          count={fixtures.length}
          today={today}
        />
      </div>

      {fixtures.length === 0 ? (
        <p className="text-body text-muted">
          {seasonIsEmpty
            ? "No fixtures in the database for this season."
            : "No fixtures on this day."}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((section) => {
            /*
              The one fact hoisted out of the rows, and it is asked of this
              league on this day rather than assumed. A competition whose
              fixtures are split across two rounds — which is what a postponed
              match played weeks later produces — falls back to saying it per
              row.

              **Team news was hoisted here once and is not any more.** It was
              lifted on the grounds that it read identically on every row, which
              is true on a Saturday morning and wrong the moment one club names
              its side. A fact that is per-fixture stays per-fixture: the row
              carries it as a "Lineups out" badge in the slot the score will
              fill. See `fixture-row.tsx`.
            */
            const rounds = new Set(
              section.items.map((match) => roundDisplay(match.round)),
            );
            const sharedRound = rounds.size === 1 ? [...rounds][0] : null;

            return (
              <section
                key={section.league.id}
                className="border border-border bg-surface"
              >
                {/*
                  A block header in the strict sense foundations means:
                  `--surface-alt` with a 2px marine bottom rule, capping the
                  object it names. The card's header capped one fixture, which
                  is what made ten of them down a page a run of labels; this
                  caps the competition, which is what a label is for.
                */}
                <header className="flex items-center gap-3 border-b-2 border-brand bg-surface-alt px-4 py-2">
                  <h2 className="flex min-w-0 items-center gap-2 text-caps">
                    {/* Beside the name and never instead of it, and `aria-hidden`
                        inside the component — foundations' fourth flag clause.
                        The mark reads `League.country` and nothing here chooses
                        it. */}
                    <LeagueFlag league={section.league} />
                    <span className="truncate">{section.league.name}</span>
                  </h2>
                  {sharedRound ? (
                    <span className="shrink-0 text-caps text-muted">
                      {sharedRound}
                    </span>
                  ) : null}
                  <span className="flex-1" />
                  <span className="shrink-0 bg-surface-sunken px-1.5 py-0.5 text-data text-muted">
                    {section.items.length}
                  </span>
                </header>

                {/* `divide-y` rather than a border on each row: one rule between
                    two rows, and none above the first or below the last, where
                    the header's rule and the section's own outline already are. */}
                <ul className="divide-y divide-border">
                  {section.items.map((match) => (
                    <li key={match.id}>
                      <FixtureRow
                        match={match}
                        showRound={sharedRound === null}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

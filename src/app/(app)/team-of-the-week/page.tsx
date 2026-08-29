import Link from 'next/link'
import { requireDbUser } from '@/lib/auth'
import { season } from '@/lib/env'
import { leaguesInSeason } from '@/lib/players'
import { teamsOfTheWeek } from '@/lib/totw'
import { PageHeader } from '@/components/page-header'
import { TotwNotice } from '@/components/totw-notice'
import { TotwCard } from '@/components/totw-card'

/**
 * Render on every request rather than once during `next build`, for the reason
 * `/diary` gives: a prerendered list would freeze whatever the database held
 * when the deployment was built.
 */
export const dynamic = 'force-dynamic'

/**
 * Every eleven this reader has picked, newest first — each one drawn.
 *
 * **A grid of pitches rather than a list of rows**, which is the second answer
 * to this screen and the right one. The first was a row apiece carrying the
 * span, the date picked, eleven crest chips and the formation: four facts
 * *about* a team of the week and not one of them the thing itself, so telling
 * one from another meant opening them one by one. A team of the week is a
 * picture, and a list of pictures should be pictures.
 *
 * **Three across at `xl` and no more.** The container caps at 1120px, so a
 * fourth column takes each card to about 260px — which the pitch survives, since
 * a place is `flex-1` and the shirt tiles are 40px, but the *names* under them
 * do not: a five-man midfield leaves 49px a name, and "Abdukodir Khusanov"
 * becomes an ellipsis. The graphic's whole job is that you can read who is in
 * it.
 *
 * **The list is not cut into months**, unlike the diary's two. Every card names
 * the days it covers in its own header, so a month heading above a run of them
 * would be a second date saying a rounder version of the first.
 */
export default async function TeamsOfTheWeek() {
  const currentSeason = season()

  // The list belongs to one reader, so the read needs our own `User.id`. The
  // upsert behind this is memoised per request and the shell has already called
  // it, so it costs one indexed lookup.
  const user = await requireDbUser()

  // The league list is wanted only for its length — whether a team's
  // competitions are *all* of them is a comparison against what exists now, not
  // a flag on the row. It goes out alongside the teams rather than after, so the
  // page waits for the slower of the two rather than for the sum.
  const [teams, allLeagues] = await Promise.all([
    teamsOfTheWeek(currentSeason, user.id),
    leaguesInSeason(currentSeason),
  ])

  return (
    <>
      <PageHeader title="Team of the week">
        Pick an eleven out of the players you marked, over any run of days.
      </PageHeader>

      {/* Renders no markup in the page — it is a modal, and on all but a
          reader's first visit it is nothing at all. Placed here rather than
          anywhere else only because this is the screen it is about. */}
      <TotwNotice />

      <div className="mb-8">
        {/* Foundations' filled button — the primary action on the screen, and
            the only marine fill in the app. A `<Link>` rather than a button
            because it navigates; `no-underline` in both states because the base
            stylesheet's link treatment is for prose. */}
        <Link
          href="/team-of-the-week/new"
          className="t-hover inline-flex h-(--control-h-lg) items-center bg-brand-action px-5 text-label text-brand-action-ink no-underline hover:bg-brand-action-hover hover:text-brand-action-ink hover:no-underline active:translate-y-px focus-visible:focus-ring"
        >
          Pick a new eleven
        </Link>
      </div>

      {teams.length === 0 ? (
        <p className="text-body text-muted">
          You have not picked one yet. Mark a few players MVP or standout on a match, then come
          back and build an eleven out of them.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <TotwCard key={team.id} team={team} leagueCount={allLeagues.length} />
          ))}
        </ul>
      )}
    </>
  )
}

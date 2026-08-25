import { SignInButton, SignUpButton } from '@clerk/nextjs'

import { Badge, VERDICT_BADGE } from '@/components/badge'
import { GithubMark } from '@/components/github-mark'
import { LandingPreview } from '@/components/landing-preview'
import { GITHUB_URL } from '@/lib/links'

/**
 * The landing page: what a signed-out visitor sees, and the only public screen
 * in the app.
 *
 * **It touches no database**, which is what lets it be prerendered at build time
 * — the one route in the project that is. Everything on it is a constant in this
 * file or in [`landing-preview.tsx`](../components/landing-preview.tsx),
 * including the numbers, which are a sample of what a season looks like rather
 * than anyone's real totals; a signed-out visitor has no diary to count, and a
 * stranger's is private.
 *
 * Clerk's buttons are client components, imported straight into this server
 * component; Next splits the bundle at that boundary so only they ship
 * JavaScript. `mode="modal"` opens the form over this page instead of
 * navigating, which is why there are no `/sign-in` or `/sign-up` routes.
 *
 * Not navigating is also why both buttons name a destination. The modal closes
 * onto this same page, and by then the session exists and Clerk's buttons have
 * gone inert — so without `fallbackRedirectUrl` a fresh sign-in would strand the
 * user here. `fallback` rather than `force`: it yields to a `redirect_url` in
 * the query string, so a protected deep link can still land where it was
 * headed. The proxy handles the other way in, someone arriving at `/` with a
 * session already in place.
 *
 * There is no theme toggle here — the top bar it lives in belongs to the app
 * shell, and a signed-out visitor has no chrome. The page still honours a
 * choice made inside the app, because that choice is an attribute on <html>
 * and these are the same semantic tokens every other screen uses.
 *
 * ## The specimen-sheet treatment
 *
 * The page says what it always said and shows what it always showed — the tag,
 * the hero beside the mock card, the same three features in the same order, the
 * same open-source claim. What changed is how two of those are drawn.
 *
 * **The three features are panels rather than bare columns.** Each is the app's
 * own card — a `--surface-alt` header strip over a bordered body, the object
 * `SquadPanel` and a competition's block on `/fixtures` already are — carrying its number and its name
 * in the strip, its specimen in the body, and its sentence as a caption beneath.
 * A feature stops being a heading with an illustration under it and becomes a
 * labelled specimen, which is the register a brand board uses and the one this
 * identity was agreed in. It also puts a border around each sample, so the three
 * read as three exhibits rather than as one run of loose objects.
 *
 * **The open-source band is a single line.** It was a full section with an
 * eyebrow, a `--text-display` heading and a filled button, restating in three
 * sizes of type a claim the tag at the top of the page has already made. One
 * sentence and the button says it once.
 */

/**
 * The filled button, with foundations' complete state set for one: the inverse
 * surface, its hover step, `translateY(1px)` on press and the focus ring. Shared
 * by the header's primary action and the GitHub link, which is a `<button>` and
 * an `<a>` — so it is a string here rather than a component, and each caller
 * adds `no-underline` if it is a link.
 */
const FILLED =
  't-hover flex h-(--control-h-lg) cursor-pointer items-center justify-center gap-2 whitespace-nowrap bg-brand-action px-5 text-label text-brand-action-ink hover:bg-brand-action-hover active:translate-y-px focus-visible:focus-ring'

/**
 * Every section below the hero sits on the same rails: full-bleed rule, content
 * held to `--container`. The rule spans the viewport and the words do not, which
 * is the whole reason the padding cannot live on a single wrapper.
 */
const SECTION = 'border-t border-border'
const INNER = 'mx-auto max-w-(--container) px-4 py-16 md:px-6 md:py-24'

export default function Landing() {
  return (
    /*
      `--surface`, not `--page`. Every other screen sits on the page tone so
      that the cards on it read as raised off something; this one is flat, and
      its cards are separated by their borders, which foundations calls the
      primary separator. The drawing is white edge to edge, including behind the
      header — the rule under the bar is the only thing dividing the two.

      It is also `bg-` on this element rather than a change to `body`, which
      belongs to the app: the two live in the same document and want different
      grounds.

      That used to come with the note that dark resolved both to one colour, and
      the rebrand ended it — `--surface` is #262E39 against `--page`'s #1C222B
      now, where the old palette had #212121 for both. So the landing page is a
      lighter sheet over the app's ground in dark as well as in light, which is
      what this element was asking for in the first place.
    */
    <div className="flex flex-1 flex-col bg-surface">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <OpenSource />
      </main>
      <SiteFooter />
    </div>
  )
}

/**
 * The same 56px bar the app shell puts over every signed-in screen, carrying
 * what a signed-out visitor needs instead: the wordmark, and the two ways in.
 */
function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      {/*
        `min-h` and `flex-wrap` rather than the app bar's fixed height: at 320px
        the wordmark and both actions come to more than the width, and the
        alternative — shrinking the buttons or shortening a label — is the
        scaling foundations rules out. So the bar keeps its height where the row
        fits and grows to two lines where it does not.
      */}
      <div className="mx-auto flex min-h-(--rail-w) max-w-(--container) flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 md:px-6">
        <span className="text-wordmark">Madooo</span>

        <div className="flex items-center gap-2">
          <SignUpButton mode="modal" fallbackRedirectUrl="/fixtures">
            <button type="button" className={FILLED}>
              Create an account
            </button>
          </SignUpButton>

          {/*
            Outlined rather than the ghost button it used to be, as the design
            draws it: two actions side by side need the secondary one to have an
            edge, or it reads as a label sitting next to a button. Foundations'
            hover for a bordered control is the border going to `--border-strong`
            and the surface down a step.
          */}
          <SignInButton mode="modal" fallbackRedirectUrl="/fixtures">
            <button
              type="button"
              className="t-hover flex h-(--control-h-lg) cursor-pointer items-center whitespace-nowrap border border-border bg-surface px-5 text-label text-text hover:border-border-strong hover:bg-surface-alt active:translate-y-px focus-visible:focus-ring"
            >
              Sign in
            </button>
          </SignInButton>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    /*
      Two columns from `md` up, the copy beside the card. Below it they stack in
      source order, so the sentence explaining the product arrives before the
      picture of it — the reference drawings are desktop-only, and this is one of
      the places the narrow arrangement had to be decided rather than read off.
    */
    <div className="mx-auto grid max-w-(--container) items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
      <div>
        {/*
          A Tag: 24px, square. It used to be the app's one pill — the only place
          `--radius-pill` was ever spent — and the rebrand retired both, because
          a pill in a zero-radius system is a contradiction. The mark still
          reads as a tag; it just has corners now.

          Outlined in marine rather than filled with it: the tag is a label, and
          a filled one at the top of the hero pulled harder than the sentence
          under it. The edge and the words carry the brand instead, which is the
          third of marine's three jobs — a tag naming a property of the product
          is the brand speaking.

          The octocat rather than a padlock. It says *where* the source is, which
          is the same job the mark does on the button below, and it retires the
          only use `lock_open` had — the glyph stays in the set for whatever
          wants it next. 12px, which is the 2px the mark always takes off a
          14px tag glyph: a solid silhouette carries more ink than a 1.75 stroke
          at the same box.
        */}
        <span className="inline-flex h-6 items-center gap-1.5 border border-brand bg-surface px-3 text-caps text-brand">
          <GithubMark className="size-3" />
          Free and open source
        </span>

        {/* The only use of `text-hero`, which exists for this line alone. One
            size at every width, like every other role: 48px still holds its
            longest word inside a 320px screen. */}
        <h1 className="mt-6 text-hero">The football you watched, in your own words.</h1>

        <p className="mt-6 text-body-lg text-muted">
          After full time, mark the players that made an impression on you and write down what you
          made of them.
        </p>
      </div>

      <LandingPreview />
    </div>
  )
}

/**
 * The three things the app does, in the order a user meets them: tag a player,
 * write about him, and find it again later.
 *
 * Each carries a sample of the real interface rather than a description of it,
 * which is why the third panel has numbers in it — a database is the one of the
 * three with nothing to show but its size.
 *
 * **Three columns, not two.** The panels are narrower than a specimen sheet
 * would like, and the note in 02 is the one that has to be read rather than
 * glanced at — but a third of `--container` is ~350px, which holds it, and the
 * three features are one row of three in the order they are met. Breaking them
 * across two rows would put "find it again" under "rate the players" and lose
 * the sequence.
 */
function Features() {
  return (
    <section className={SECTION}>
      <div className={INNER}>
        <p className="text-caps text-faint">What it does</p>
        <h2 className="mt-4 text-display">Features</h2>

        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          <Feature
            index="01"
            title="Rate the players"
            caption="Rate anyone who left an impression on you during the match."
          >
            {/* The three chips as they are drawn once applied — the same badge
                the diary reads back, so the sample is the product. */}
            <div className="flex flex-wrap gap-2">
              <Badge {...VERDICT_BADGE.STANDOUT} label="STANDOUT" />
              <Badge {...VERDICT_BADGE.FLOP} label="FLOP" />
              <Badge {...VERDICT_BADGE.MVP} label="MVP" />
            </div>
          </Feature>

          <Feature
            index="02"
            title="Take notes"
            caption="A note on any player, dated to the fixture."
          >
            {/*
              A note standing on its own as prose, which is the case foundations
              reserves `--text-body-lg` for — the rule beside it is in `--text`
              rather than `--border` because here the note is the subject rather
              than an annotation on a row.
            */}
            <figure className="border-l-2 border-text pl-4">
              <figcaption className="text-caps text-faint">Declan Rice · v Tottenham</figcaption>
              <p className="mt-2 text-body-lg">Ran the game from deep. Never gave it away.</p>
            </figure>
          </Feature>

          <Feature
            index="03"
            title="Build a database"
            caption="Every verdict and note is stored."
          >
            {/* A sample season rather than a live count: nothing on this page
                reads the database, and there is no reader signed in to count. */}
            <ul className="flex flex-wrap gap-x-8 gap-y-4">
              {[
                { value: '37', label: 'Matches' },
                { value: '112', label: 'Players' },
                { value: '268', label: 'Notes' },
              ].map((stat) => (
                <li key={stat.label}>
                  {/* Numbers you can add up, so monospaced — `--text-stat` is
                      the role the app's own stat tiles use. */}
                  <p className="text-stat">{stat.value}</p>
                  <p className="mt-1 text-caption text-muted">{stat.label}</p>
                </li>
              ))}
            </ul>
          </Feature>
        </ul>
      </div>
    </section>
  )
}

/**
 * A feature as a specimen: its number and name in the header strip, its sample
 * in the body, and its sentence as the caption underneath.
 *
 * The strip is `--surface-alt` — the same header a `SquadPanel` and a
 * `/fixtures` competition block wear — so a panel is the app's own card rather than an object
 * invented for this page. That is the point of drawing them this way: a visitor
 * who signs up lands on screens made of what they were just shown.
 *
 * **The name is `--text-caps` in the strip rather than `--text-title` over the
 * body**, which is the one thing this treatment gives up. A 24px feature name
 * shouts louder than an 11px micro-label, and the trade is deliberate: in a
 * specimen sheet the sample is the argument and the label is only there to say
 * which sample it is. If the features stop reading as the three things the app
 * does, that is the line to change first.
 *
 * `flex-1` on the body and again on the sample inside it is what keeps the three
 * captions on one baseline when one sample is taller than the others.
 */
function Feature({
  index,
  title,
  caption,
  children,
}: {
  index: string
  title: string
  caption: string
  children: React.ReactNode
}) {
  return (
    <li className="flex flex-col border border-border bg-surface">
      {/*
        Marine, like every other block header in the app. This is the third of
        the three things the brand colour marks — the brand speaking — and the
        panels are the app's own card, so a landing page drawn from them gets it
        for free rather than as a decoration of its own.
      */}
      <div className="flex items-center gap-3 border-b-2 border-brand bg-surface-alt px-4 py-2">
        <span className="text-data text-faint">{index}</span>
        <h3 className="text-caps">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-4 py-6">
        <div className="flex-1">{children}</div>
        <p className="text-caption text-muted">{caption}</p>
      </div>
    </li>
  )
}

/**
 * The open-source claim, in one line.
 *
 * It was a section of its own — an eyebrow, "Free, forever." at
 * `--text-display`, a sentence and the button — which restated at three sizes of
 * type a claim the tag at the top of the page has already made. The claim has
 * not changed; the volume has.
 *
 * No `lock_open` glyph here, because the tag in the hero is already carrying it
 * and the same mark twice on one page reads as two different things. The octocat
 * stays: `foundations.md` gives the mark to every link to the repository, and
 * this is one of the two.
 *
 * "take a look at the code" is the page's one piece of marine that is not the
 * wordmark — exactly what foundations grants a link, and a useful reminder of
 * how little of the brand colour a page in this system is meant to carry.
 */
function OpenSource() {
  return (
    <section className={SECTION}>
      <div className="mx-auto flex max-w-(--container) flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="text-body text-muted">
          Free, forever. Feel free to{' '}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            take a look at the code
          </a>
          , or run your own copy if you so desire.
        </p>

        {/* `no-underline` in both states: the base stylesheet styles every <a>
            as prose, which is right for a sentence and wrong for a button.

            A new tab, like the footer's link: this is the only page a visitor
            has, and sending them off it to read the source loses the two ways
            in. `rel="noreferrer"` because `target="_blank"` otherwise hands the
            opened page a handle on this one through `window.opener`.

            The octocat rather than `code`, matching the top bar: a visitor
            reads the destination off the mark before reading the label, and
            the two entrances to the repository now look like each other.

            16px against the button's 18px glyph, the same 2px the top bar
            takes off for the same reason — the mark is a solid silhouette
            where our own glyphs are a 1.75 stroke, so an equal box puts more
            ink on screen. It inherits `text-inverse` from the anchor
            through `currentColor`, which is why it has no colour of its own. */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className={`${FILLED} self-start text-brand-action-ink no-underline hover:text-brand-action-ink hover:no-underline md:shrink-0`}
        >
          <GithubMark className="size-4" />
          View on GitHub
        </a>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    /*
      No rule above it, deliberately. The drawings carry exactly three — under
      the header and over each of the two sections — and the footer is not a
      fourth section: it is the end of the one above it, held apart by space
      rather than by a line.

      Which is also why the space is lopsided. The section's own padding sits
      above the line and 24px below it, so it reads as the foot of the page
      rather than as a band of its own. Measured off the drawing, where the gap
      under the sentence is about a quarter of the gap over it.
    */
    <footer>
      <div className="mx-auto flex max-w-(--container) flex-col gap-2 px-4 pb-6 text-caption text-muted sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p>Madooo, a match diary for the football you watched. Free and open source.</p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-muted hover:text-text"
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}

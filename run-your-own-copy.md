# Running your own copy of Madooo

You need Node 24, a Postgres database (Neon or otherwise), a Clerk application
and an API-Football key.

About that key: the free tier only serves seasons roughly two years back. That's
enough to run the app and watch it work, but you can't follow a season as it
happens, so set `SEASON` to one your key can actually fetch. Madooo itself runs
on the Pro tier against the current season.

```sh
npm install
cp .env.example .env.local     # then fill it in; it documents every variable
npm run db:migrate             # create the schema
npm run db:seed-teams          # club codes and colours the provider doesn't publish
npm run sync -- --round 1      # pull a matchday's fixtures, lineups and players
npm run dev
```

`.env.local` is gitignored and is the only place secrets belong.

## Keeping it fed

The app never calls API-Football on a page load. A sync job pulls fixtures,
lineups and squads into your own database, and every page reads from there, so
the database is empty until you run it.

`npm run sync -- --due` is the way in after that first `--round 1`. It refreshes
every configured league's calendar, then reads whatever finished matches it
hasn't read yet, so you never have to name a matchday. Add `--dry-run` to see
what it would fetch without spending a request.

That's the command Madooo runs on a schedule, from
[`/api/cron/sync`](src/app/api/cron/sync/route.ts) — a Vercel cron job, declared
in `vercel.json`. A fork wanting the same needs `SEASON`, `LEAGUES`,
`API_FOOTBALL_KEY` and `CRON_SECRET` in its Vercel Production environment, and
Vercel's Pro plan, which is what allows a cron more frequent than daily.

It used to be a GitHub Actions workflow, which kept the API key out of the
deployed environment entirely. That was the better property and it was given up
for punctuality: GitHub dropped six of ten scheduled runs. The guarantee that no
page reaches the provider is now a rule rather than a missing credential — the
cron route is the only file under `src/app/` allowed to touch either variable,
which `AGENTS.md` states as a non-negotiable.

## The rest of the scripts

- `npm test` runs Vitest over the sync mapper and the pages' pure helpers.
- `npm run db:check` exercises the database layer end to end.

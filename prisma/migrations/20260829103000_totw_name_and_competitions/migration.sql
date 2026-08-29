-- A team of the week gains a name, and a record of which competitions it was
-- picked from.

-- The column arrives nullable, is filled, and only then becomes required. A
-- plain `ADD COLUMN ... NOT NULL` cannot be run against a table that already has
-- rows, and a `DEFAULT` would leave every existing team sharing one name and the
-- default sitting on the column afterwards, where the next insert could lean on
-- it. Three statements say what is meant: there was no name, here is one, from
-- now on there must be one.
ALTER TABLE "TeamOfTheWeek" ADD COLUMN "name" TEXT;

-- The day keys are ISO rather than the `17–23 Aug` a reader would have typed,
-- and that is the right trade for a backfill: it is unambiguous, and every row
-- it touches predates the dialog that asks.
UPDATE "TeamOfTheWeek"
   SET "name" = 'Team of the week, ' || "fromDay" || ' to ' || "toDay"
 WHERE "name" IS NULL;

ALTER TABLE "TeamOfTheWeek" ALTER COLUMN "name" SET NOT NULL;

-- CreateTable
CREATE TABLE "TeamOfTheWeekLeague" (
    "teamOfTheWeekId" INTEGER NOT NULL,
    "leagueId" INTEGER NOT NULL,

    CONSTRAINT "TeamOfTheWeekLeague_pkey" PRIMARY KEY ("teamOfTheWeekId","leagueId")
);

-- AddForeignKey
ALTER TABLE "TeamOfTheWeekLeague" ADD CONSTRAINT "TeamOfTheWeekLeague_teamOfTheWeekId_fkey" FOREIGN KEY ("teamOfTheWeekId") REFERENCES "TeamOfTheWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamOfTheWeekLeague" ADD CONSTRAINT "TeamOfTheWeekLeague_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Every team that already exists was picked before competitions could be chosen,
-- and the pool it came from was every competition with a squad in its season.
-- That is what this writes, rather than leaving those rows claiming nothing:
-- the predicate is `leaguesInSeason`, in SQL.
INSERT INTO "TeamOfTheWeekLeague" ("teamOfTheWeekId", "leagueId")
SELECT t."id", l."id"
  FROM "TeamOfTheWeek" t
  CROSS JOIN "League" l
 WHERE EXISTS (
         SELECT 1
           FROM "Match" m
           JOIN "MatchSquad" ms ON ms."matchId" = m."id"
          WHERE m."leagueId" = l."id"
            AND m."season" = t."season"
       );

-- Added by hand: Prisma's schema language has no syntax for CHECK constraints.
-- A team of the week must actually be called something. The action rejects a
-- blank name before it gets here; this is the guarantee that survives the action.
ALTER TABLE "TeamOfTheWeek"
  ADD CONSTRAINT "totw_has_name"
  CHECK (length(btrim("name")) > 0);

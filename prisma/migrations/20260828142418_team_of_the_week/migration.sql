-- CreateTable
CREATE TABLE "TeamOfTheWeek" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "season" INTEGER NOT NULL,
    "fromDay" TEXT NOT NULL,
    "toDay" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamOfTheWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamOfTheWeekPick" (
    "id" SERIAL NOT NULL,
    "teamOfTheWeekId" INTEGER NOT NULL,
    "matchSquadId" INTEGER NOT NULL,
    "tag" "JudgementTag" NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TeamOfTheWeekPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamOfTheWeek_userId_createdAt_idx" ON "TeamOfTheWeek"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamOfTheWeekPick_teamOfTheWeekId_matchSquadId_key" ON "TeamOfTheWeekPick"("teamOfTheWeekId", "matchSquadId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamOfTheWeekPick_teamOfTheWeekId_order_key" ON "TeamOfTheWeekPick"("teamOfTheWeekId", "order");

-- AddForeignKey
ALTER TABLE "TeamOfTheWeek" ADD CONSTRAINT "TeamOfTheWeek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamOfTheWeekPick" ADD CONSTRAINT "TeamOfTheWeekPick_teamOfTheWeekId_fkey" FOREIGN KEY ("teamOfTheWeekId") REFERENCES "TeamOfTheWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamOfTheWeekPick" ADD CONSTRAINT "TeamOfTheWeekPick_matchSquadId_fkey" FOREIGN KEY ("matchSquadId") REFERENCES "MatchSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Added by hand: Prisma's schema language has no syntax for CHECK constraints.
-- A span runs forwards. Both columns hold London calendar days as "YYYY-MM-DD",
-- and on that format lexicographic order is chronological order, so a text
-- comparison is the whole of the rule.
ALTER TABLE "TeamOfTheWeek"
  ADD CONSTRAINT "totw_span_runs_forwards"
  CHECK ("fromDay" <= "toDay");

-- Also by hand. A pick sits in one of the eleven places, and nowhere else. The
-- action counts the lines before it writes; this is the guarantee that survives
-- the action.
ALTER TABLE "TeamOfTheWeekPick"
  ADD CONSTRAINT "totw_pick_is_in_the_eleven"
  CHECK ("order" BETWEEN 0 AND 10);

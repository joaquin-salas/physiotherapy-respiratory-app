-- Programs now contain routines (days per routine instead of per exercise).
-- Existing data is converted: each program gets a "Rutina A" with the days of its
-- exercises, and its exercises move into that routine.

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "daysOfWeek" "Weekday"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineExercise" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER,
    "durationSec" INTEGER,
    "restSec" INTEGER NOT NULL,
    "targetEffortPct" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Routine_programId_idx" ON "Routine"("programId");

-- CreateIndex
CREATE INDEX "RoutineExercise_routineId_idx" ON "RoutineExercise"("routineId");

-- CreateIndex
CREATE INDEX "RoutineExercise_exerciseId_idx" ON "RoutineExercise"("exerciseId");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Convert existing programs: one routine per program
INSERT INTO "Routine" ("id", "programId", "name", "order", "daysOfWeek", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p."id", 'Rutina A', 1,
       COALESCE(
         (SELECT array_agg(DISTINCT d ORDER BY d)
            FROM "ProgramExercise" pe, unnest(pe."daysOfWeek") AS d
           WHERE pe."programId" = p."id"),
         ARRAY['MONDAY']::"Weekday"[]
       ),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM "Program" p;

-- Move the exercises into it (same ids, no target effort yet)
INSERT INTO "RoutineExercise" ("id", "routineId", "exerciseId", "order", "sets", "reps", "durationSec", "restSec", "notes", "createdAt", "updatedAt")
SELECT pe."id", r."id", pe."exerciseId", pe."order", pe."sets", pe."reps", pe."durationSec", pe."restSec", pe."notes", pe."createdAt", pe."updatedAt"
  FROM "ProgramExercise" pe
  JOIN "Routine" r ON r."programId" = pe."programId";

-- Remove the old table
ALTER TABLE "ProgramExercise" DROP CONSTRAINT "ProgramExercise_exerciseId_fkey";
ALTER TABLE "ProgramExercise" DROP CONSTRAINT "ProgramExercise_programId_fkey";
DROP TABLE "ProgramExercise";

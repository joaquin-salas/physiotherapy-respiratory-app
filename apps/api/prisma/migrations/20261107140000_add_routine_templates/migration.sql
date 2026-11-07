-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "RoutineTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile" "ProgramProfile",
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineTemplateExercise" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
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

    CONSTRAINT "RoutineTemplateExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutineTemplateExercise_templateId_idx" ON "RoutineTemplateExercise"("templateId");

-- CreateIndex
CREATE INDEX "RoutineTemplateExercise_exerciseId_idx" ON "RoutineTemplateExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "Routine_templateId_idx" ON "Routine"("templateId");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoutineTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineTemplateExercise" ADD CONSTRAINT "RoutineTemplateExercise_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoutineTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineTemplateExercise" ADD CONSTRAINT "RoutineTemplateExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

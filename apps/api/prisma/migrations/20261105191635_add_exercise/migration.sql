-- CreateEnum
CREATE TYPE "ExerciseGoal" AS ENUM ('STRENGTH', 'AEROBIC', 'RESPIRATORY', 'BALANCE', 'MOBILITY');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT,
    "goal" "ExerciseGoal" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "equipment" TEXT[],
    "contraindications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

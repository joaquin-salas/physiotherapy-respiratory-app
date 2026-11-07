-- CreateEnum
CREATE TYPE "ProgramProfile" AS ENUM ('PREHAB', 'POST_SURGERY', 'DURING_TREATMENT', 'SURVIVOR');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "Physiotherapist" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Physiotherapist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "physiotherapistId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "stage" TEXT,
    "currentTreatment" TEXT,
    "comorbidities" TEXT[],
    "initialAssessment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientIdentity" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "phone" TEXT,
    "nationalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "name" TEXT NOT NULL,
    "profile" "ProgramProfile",
    "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramExercise" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER,
    "durationSec" INTEGER,
    "restSec" INTEGER NOT NULL,
    "daysOfWeek" "Weekday"[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Physiotherapist_licenseNumber_key" ON "Physiotherapist"("licenseNumber");

-- CreateIndex
CREATE INDEX "Patient_physiotherapistId_idx" ON "Patient"("physiotherapistId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientIdentity_patientId_key" ON "PatientIdentity"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientIdentity_nationalId_key" ON "PatientIdentity"("nationalId");

-- CreateIndex
CREATE INDEX "Program_patientId_idx" ON "Program"("patientId");

-- CreateIndex
CREATE INDEX "ProgramExercise_programId_idx" ON "ProgramExercise"("programId");

-- CreateIndex
CREATE INDEX "ProgramExercise_exerciseId_idx" ON "ProgramExercise"("exerciseId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_physiotherapistId_fkey" FOREIGN KEY ("physiotherapistId") REFERENCES "Physiotherapist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientIdentity" ADD CONSTRAINT "PatientIdentity_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramExercise" ADD CONSTRAINT "ProgramExercise_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramExercise" ADD CONSTRAINT "ProgramExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

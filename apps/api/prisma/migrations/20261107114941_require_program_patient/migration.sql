/*
  Warnings:

  - Made the column `patientId` on table `Program` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startDate` on table `Program` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Program" DROP CONSTRAINT "Program_patientId_fkey";

-- AlterTable
ALTER TABLE "Program" ALTER COLUMN "patientId" SET NOT NULL,
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

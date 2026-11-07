-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "dischargedAt" TIMESTAMP(3),
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "sex" "Sex",
ADD COLUMN     "surgeryDate" DATE,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

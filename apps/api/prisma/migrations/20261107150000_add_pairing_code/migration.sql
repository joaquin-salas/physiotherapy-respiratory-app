-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pairingCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "pairingCodeHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_pairingCodeHash_key" ON "User"("pairingCodeHash");


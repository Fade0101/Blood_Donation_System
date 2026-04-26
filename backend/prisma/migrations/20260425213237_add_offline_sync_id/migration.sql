/*
  Warnings:

  - A unique constraint covering the columns `[offlineSyncId]` on the table `DonorCampaign` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `offlineSyncId` to the `DonorCampaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DonorCampaign" ADD COLUMN     "offlineSyncId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DonorCampaign_offlineSyncId_key" ON "DonorCampaign"("offlineSyncId");

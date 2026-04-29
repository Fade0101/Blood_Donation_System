-- DropForeignKey
ALTER TABLE "DonorCampaign" DROP CONSTRAINT "DonorCampaign_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "DonorCampaign" DROP CONSTRAINT "DonorCampaign_donorId_fkey";

-- AddForeignKey
ALTER TABLE "DonorCampaign" ADD CONSTRAINT "DonorCampaign_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorCampaign" ADD CONSTRAINT "DonorCampaign_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

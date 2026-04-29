import prisma from "../config/prisma";
import crypto from "crypto";
import { AppError } from "../middlewares/errorHandler";

export const syncOfflineData = async (campaignId: string, donorsArray: any[]) => {

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId }
  });

  if (!campaign) {
    throw new AppError(404, "الحملة غير موجودة");
  }

  const results = [];

  for (const currentDonor of donorsArray) {
    try {
      // Validate required fields
      if (!currentDonor.nationalId) {
        results.push({ nationalId: currentDonor.nationalId, status: "error", message: "معرف المتبرع مطلوب" });
        continue;
      }
      if (!currentDonor.name) {
        results.push({ nationalId: currentDonor.nationalId, status: "error", message: "اسم المتبرع مطلوب" });
        continue;
      }
      if (!currentDonor.phone) {
        results.push({ nationalId: currentDonor.nationalId, status: "error", message: "رقم الهاتف مطلوب" });
        continue;
      }

      // Auto-generate offlineSyncId if missing (per CLAUDE.md requirement)
      if (!currentDonor.offlineSyncId) {
        currentDonor.offlineSyncId = crypto.randomUUID();
      }

      await prisma.$transaction(async (tx) => {

        // 1. Check if already synced
        const existingSync = await tx.donorCampaign.findUnique({
          where: { offlineSyncId: currentDonor.offlineSyncId }
        });

        if (existingSync) {
          results.push({ nationalId: currentDonor.nationalId, status: "duplicate_sync" });
          return;
        }

        // 2. Upsert donor
        const savedDonor = await tx.donor.upsert({
          where: { nationalId: currentDonor.nationalId },
          update: {
            name: currentDonor.name,
            phone: currentDonor.phone,
            address: currentDonor.address,
            dateOfBirth: currentDonor.dateOfBirth ? new Date(currentDonor.dateOfBirth) : null,
          },
          create: {
            nationalId: currentDonor.nationalId,
            name: currentDonor.name,
            phone: currentDonor.phone,
            address: currentDonor.address,
            dateOfBirth: currentDonor.dateOfBirth ? new Date(currentDonor.dateOfBirth) : null,
          },
        });

        // 3. Prevent duplicate registration
        const existingRegistration = await tx.donorCampaign.findFirst({
          where: {
            donorId: savedDonor.id,
            campaignId
          }
        });

        if (existingRegistration) {
          results.push({ nationalId: currentDonor.nationalId, status: "already_registered" });
          return;
        }

        // 4. Create registration
        await tx.donorCampaign.create({
          data: {
            donorId: savedDonor.id,
            campaignId,
            offlineSyncId: currentDonor.offlineSyncId,
          },
        });

        results.push({ nationalId: currentDonor.nationalId, status: "success" });
      });

    } catch (error) {
      results.push({
        nationalId: currentDonor.nationalId,
        status: "error"
      });
    }
  }

  return { results };
};
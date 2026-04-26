import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const syncOfflineData = async (campaignId: string, donorsArray: any[]) => {
  for (let i = 0; i < donorsArray.length; i++) {
    const currentDonor = donorsArray[i];

    try {
      // 1. Upsert the Donor Entity
      const savedDonor = await prisma.donor.upsert({
        where: {
          nationalId: currentDonor.nationalId, 
        },
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

      await prisma.donorCampaign.create({
        data: {
          donorId: savedDonor.id,
          campaignId: campaignId,
          offlineSyncId: currentDonor.offlineSyncId,
        },
      });

    } catch (error: any) {
      // 3. Handle Idempotency (Duplicate Syncs)
      // Prisma throws code P2002 if a unique constraint fails
      if (error.code === 'P2002' && error.meta?.target?.includes('offlineSyncId')) {
        console.log(`Duplicate sync ignored for donor: ${currentDonor.name}`);
        continue; 
      }
      
      throw error; 
    }
  }
  
  return { message: "تمت مزامنة البيانات بنجاح" }; 
};
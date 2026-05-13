// 📁 campaign.repository.ts
import prisma from "../config/prisma";
import crypto from "crypto";
import { CreateCampaignDTO, UpdateCampaignDTO } from "../types/campaign.types";

export const registerDonorToCampaign = async (
  campaignId: string,
  donorData: any
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Try to find the donor using only the National ID (Our absolute source of truth)
    let donor = await tx.donor.findUnique({
      where: { nationalId: donorData.nationalId }
    });

    // 2. The Smart Check
    if (!donor) {
      if (!donorData.name || !donorData.phone) {
        throw new Error("هذا المتبرع غير مسجل من قبل. يرجى إدخال البيانات كاملة.");
      }

      donor = await tx.donor.create({
        data: {
          nationalId: donorData.nationalId,
          name: donorData.name,
          phone: donorData.phone,
          address: donorData.address || null,
          dateOfBirth: donorData.dateOfBirth ? new Date(donorData.dateOfBirth) : null,
          gender: donorData.gender || null
        }
      });
    } else {
      // Safely update ONLY the fields that were provided
      const updateData: any = {};
      if (donorData.phone && donorData.phone !== donor.phone) updateData.phone = donorData.phone;
      if (donorData.address && donorData.address !== donor.address) updateData.address = donorData.address;
      if (donorData.gender && donorData.gender !== donor.gender) updateData.gender = donorData.gender;

      if (Object.keys(updateData).length > 0) {
        donor = await tx.donor.update({
          where: { id: donor.id },
          data: updateData
        });
      }
    }

    // 3. Prevent duplicate registration (CRITICAL RESTORE)
    const existingRegistration = await tx.donorCampaign.findUnique({
      where: {
        donorId_campaignId: {
          donorId: donor.id,
          campaignId: campaignId
        }
      }
    });

    if (existingRegistration) {
      throw new Error("المتبرع مسجل بالفعل في هذه الحملة.");
    }

    // 4. Register donor
    const syncId = donorData.offlineSyncId ? donorData.offlineSyncId : crypto.randomUUID();

    const registration = await tx.donorCampaign.create({
      data: {
        donorId: donor.id,
        campaignId: campaignId,
        offlineSyncId: syncId
      }
    });

    return { donor, registration };
  });
};

export const createCampaign = async (data: CreateCampaignDTO) => {
  return await prisma.campaign.create({
    data: {
      campaignNumber: data.campaignNumber,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      bloodBankName: data.bloodBankName,
      supervisorName: data.supervisorName
    }
  });
};

export const getAllCampaigns = async () => {
  return await prisma.campaign.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const getCampaignById = async (id: string) => {
  return await prisma.campaign.findUnique({
    where: { id }
  });
};

export const updateCampaign = async (id: string, data: UpdateCampaignDTO) => {
  return await prisma.campaign.update({
    where: { id },
    data: {
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      bloodBankName: data.bloodBankName,
      supervisorName: data.supervisorName
    }
  });
};

export const deleteCampaign = async (id: string) => {
  return await prisma.campaign.delete({
    where: { id }
  });
};

export const getCampaignDonors = async (campaignId: string, bloodTypeFilter?: any) => {
  const registrations = await prisma.donorCampaign.findMany({
    where: {
      campaignId: campaignId,
      ...(bloodTypeFilter && { donor: { bloodType: bloodTypeFilter } })
    },
    include: {
      donor: true
    }
  });

  return registrations;
};

export const removeDonorFromCampaign = async (campaignId: string, nationalId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Find the donor by nationalId
    const donor = await tx.donor.findUnique({
      where: { nationalId }
    });

    if (!donor) {
      throw new Error("المتبرع غير موجود.");
    }

    // 2. Check if the donor is actually registered in this campaign
    const existingRegistration = await tx.donorCampaign.findUnique({
      where: {
        donorId_campaignId: {
          donorId: donor.id,
          campaignId: campaignId
        }
      }
    });

    if (!existingRegistration) {
      throw new Error("المتبرع غير مسجل في هذه الحملة.");
    }

    // 3. Delete the registration
    await tx.donorCampaign.delete({
      where: {
        donorId_campaignId: {
          donorId: donor.id,
          campaignId: campaignId
        }
      }
    });

    return { success: true, message: "تمت إزالة المتبرع من الحملة بنجاح" };
  });
};
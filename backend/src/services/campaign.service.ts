import {
  registerDonorToCampaign,
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignDonors,
  removeDonorFromCampaign,
} from "../repositories/campaign.repository";
import { createCampaignSchema, updateCampaignSchema, CreateCampaignDTO, UpdateCampaignDTO } from "../types/campaign.types";
import { AppError } from "../middlewares/errorHandler";
import prisma from "../config/prisma";
import { Parser } from "json2csv";

export const campaignService = {
  async registerDonor(campaignId: string, data: any) {
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }
    return await registerDonorToCampaign(campaignId, data);
  },

  async removeDonor(campaignId: string, nationalId: string) {
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }
    return await removeDonorFromCampaign(campaignId, nationalId);
  },

  async createNewCampaign(data: CreateCampaignDTO) {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { campaignNumber: data.campaignNumber },
    });

    if (existingCampaign) {
      throw new AppError(409, "Campaign number already exists");
    }

    return await createCampaign(data);
  },

  async getAllCampaigns() {
    return await getAllCampaigns();
  },

  async getCampaignById(id: string) {
    const campaign = await getCampaignById(id);
    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }
    return campaign;
  },

  async updateCampaign(id: string, data: UpdateCampaignDTO) {
    const campaign = await getCampaignById(id);
    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }
    return await updateCampaign(id, data);
  },

  async deleteCampaign(id: string) {
    const campaign = await getCampaignById(id);
    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }
    return await deleteCampaign(id);
  },

async generateCampaignCsv(campaignId: string, bloodType?: string) {
    const records = await getCampaignDonors(campaignId, bloodType);

    if (!records || records.length === 0) {
      throw new AppError(404, "No donors found for this campaign");
    }

    const flatData = records.map((record) => ({
      '   الاسم': record.donor.name,
        'رقم الهاتف': `="${record.donor.phone}"`, 
      '   الالرقم القومي': `="${record.donor.nationalId}"`,
      
      'فصيلة الدم': record.donor.bloodType 
        ? record.donor.bloodType.replace('_POS', '+').replace('_NEG', '-') 
        : 'غير محدد',
       '    العنوان': record.donor.address || '-',
      'تاريخ التسجيل': record.donor.createdAt 
        ? new Date(record.donor.createdAt).toLocaleDateString('ar-EG') 
        : '-'
    }));

    const json2csvParser = new Parser({ withBOM: false }); 
    return json2csvParser.parse(flatData);
},
  async getCampaignDonors(campaignId: string, bloodTypeFilter?: string) {
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      throw new AppError(404, "الحملة غير موجودى");
    }
    const registrations = await getCampaignDonors(campaignId, bloodTypeFilter);
return registrations.map(reg => ({
      ...reg.donor,
      offlineSyncId: reg.offlineSyncId
    }));
  }
};
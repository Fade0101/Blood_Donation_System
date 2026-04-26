import {
  registerDonorToCampaign,
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignDonors,
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

    if (records.length === 0) {
      throw new AppError(404, "No donors found for this campaign with specified criteria");
    }

    const flatData = records.map((record) => ({
      "National ID": record.donor.nationalId,
      Name: record.donor.name,
      Phone: record.donor.phone,
      Address: record.donor.address || "N/A",
      "Blood Type": record.donor.bloodType || "Unknown",
      "Registration Date": record.registeredAt.toISOString().split("T")[0],
    }));

    const json2csvParser = new Parser();
    const csvString = json2csvParser.parse(flatData);

    return csvString;
  },
};
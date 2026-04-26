import { Campaign } from "@prisma/client";
import { z } from "zod";

export const createCampaignSchema = z.object({
  campaignNumber: z.number().int().positive("Campaign number must be positive"),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format").optional(),
  bloodBankName: z.string().optional(),
  supervisorName: z.string().optional(),
});

export const updateCampaignSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  bloodBankName: z.string().optional(),
  supervisorName: z.string().optional(),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateCampaignDTO = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignDTO = z.infer<typeof updateCampaignSchema>;
export type CampaignIdParam = z.infer<typeof campaignIdParamSchema>;
export type CampaignWithDonors = Campaign & {
  donorCount?: number;
};

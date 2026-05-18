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
  campaignNumber: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  bloodBankName: z.string().optional(),
  supervisorName: z.string().optional(),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const campaignIdParamSchemaByName = z.object({
  campaignId: z.string().uuid(),
});

export const registerDonorSchema = z.object({
  nationalId: z.string().min(1, "National ID is required"),
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  bloodType: z
    .enum([
      "A_POS",
      "A_NEG",
      "B_POS",
      "B_NEG",
      "AB_POS",
      "AB_NEG",
      "O_POS",
      "O_NEG",
    ])
    .optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  offlineSyncId: z.string().optional(),
});

export type CreateCampaignDTO = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignDTO = z.infer<typeof updateCampaignSchema>;
export type CampaignIdParam = z.infer<typeof campaignIdParamSchema>;
export type RegisterDonorDTO = z.infer<typeof registerDonorSchema>;
export type CampaignWithDonors = Campaign & {
  donorCount?: number;
};

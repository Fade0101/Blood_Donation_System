import { z } from "zod";

export const syncDonorSchema = z.object({
  nationalId: z.string().min(1, "National ID is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  bloodType: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  offlineSyncId: z.string().optional(),
});

export const syncOfflineDataSchema = z.object({
  campaignId: z.string().uuid("Campaign ID must be a valid UUID"),
  donors: z.array(syncDonorSchema).min(1, "Donors array must not be empty"),
});

export type SyncDonor = z.infer<typeof syncDonorSchema>;
export type SyncPayload = z.infer<typeof syncOfflineDataSchema>;

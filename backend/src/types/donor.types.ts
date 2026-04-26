import { BloodType, Donor } from "@prisma/client";
import { z } from "zod";

export const bloodTypeEnum = z.enum([
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
]);

export const createDonorSchema = z.object({
  nationalId: z.string().min(1, "National ID is required").length(14, "National ID must be exactly 14 characters"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  bloodType: bloodTypeEnum.optional(),
});

export const updateDonorSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  bloodType: bloodTypeEnum.optional(),
});

export const donorIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateDonorDTO = z.infer<typeof createDonorSchema>;
export type UpdateDonorDTO = z.infer<typeof updateDonorSchema>;
export type DonorIdParam = z.infer<typeof donorIdParamSchema>;
export type DonorWithAge = Donor & { age: number | null };


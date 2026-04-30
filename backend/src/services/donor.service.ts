import { Donor } from "@prisma/client";
import { donorRepository } from "../repositories/donor.repository";
import { CreateDonorDTO, DonorWithAge, UpdateDonorDTO } from "../types/donor.types";
import { AppError } from "../middlewares/errorHandler";

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

function withAge(donor: Donor): DonorWithAge {
  return { ...donor, age: calculateAge(donor.dateOfBirth) };
}

export const donorService = {
  async getAllDonors(): Promise<DonorWithAge[]> {
    const donors = await donorRepository.findAll();
    return donors.map(withAge);
  },

  async getDonorById(id: string): Promise<DonorWithAge> {
    const donor = await donorRepository.findById(id);
    if (!donor) throw new AppError(404, "Donor not found");
    return withAge(donor);
  },

  async createDonor(data: CreateDonorDTO): Promise<DonorWithAge> {
    const existing = await donorRepository.findByNationalId(data.nationalId);
    if (existing) throw new AppError(409, "A donor with this national ID already exists");
    const donor = await donorRepository.create(data);
    return withAge(donor);
  },

  async updateDonor(id: string, data: UpdateDonorDTO): Promise<DonorWithAge> {
    await donorService.getDonorById(id);
    const donor = await donorRepository.update(id, data);
    return withAge(donor);
  },

  async deleteDonor(id: string): Promise<void> {
    await donorService.getDonorById(id);
    await donorRepository.delete(id);
  },

  async searchDonors(query: string): Promise<DonorWithAge[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      throw new AppError(400, "Search query cannot be empty");
    }
    const donors = await donorRepository.search(trimmedQuery);
    return donors.map(withAge);
  },
};

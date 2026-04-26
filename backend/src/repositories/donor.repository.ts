import prisma from "../config/prisma";
import { CreateDonorDTO, UpdateDonorDTO } from "../types/donor.types";

export const donorRepository = {
  findAll() {
    return prisma.donor.findMany({ orderBy: { createdAt: "desc" } });
  },

  findById(id: string) {
    return prisma.donor.findUnique({ where: { id } });
  },

  findByNationalId(nationalId: string) {
    return prisma.donor.findUnique({ where: { nationalId } });
  },

  create(data: CreateDonorDTO) {
    return prisma.donor.create({
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
  },

  update(id: string, data: UpdateDonorDTO) {
    return prisma.donor.update({
      where: { id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
  },

  delete(id: string) {
    return prisma.donor.delete({ where: { id } });
  },
};

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

  search(query: string) {
    return prisma.donor.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
  },

  upsert(nationalId: string, data: any) {
    return prisma.donor.upsert({
      where: { nationalId },
      update: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        bloodType: data.bloodType,
        gender: data.gender,
      },
      create: {
        nationalId,
        name: data.name,
        phone: data.phone,
        address: data.address,
        bloodType: data.bloodType,
        gender: data.gender,
      },
    });
  },
};

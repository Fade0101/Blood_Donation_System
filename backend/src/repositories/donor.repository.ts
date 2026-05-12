import prisma from "../config/prisma";
import { CreateDonorDTO, UpdateDonorDTO } from "../types/donor.types";

export const donorRepository = {
  getBloodTypeStats() {
    return prisma.donor.groupBy({
      by: ['bloodType'],
      _count: { bloodType: true },
    });
  },
  findAll(skip: number = 0, take: number = 10, search?: string, bloodType?: string, gender?: string) {
   
    const whereCondition: any = {};
    
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { nationalId: { contains: search, mode: "insensitive" } }
      ];
    }
    
    if (bloodType && bloodType !== 'ALL') {
      whereCondition.bloodType = bloodType;
    }
    
    if (gender && gender !== 'ALL') {
      whereCondition.gender = gender;
    }

    return prisma.$transaction([
      prisma.donor.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.donor.count({ where: whereCondition }), 
    ]);
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

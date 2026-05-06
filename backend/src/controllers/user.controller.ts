import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';
import { z } from 'zod';
import { Role } from '@prisma/client';

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF']),
});

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: users,
  });
});

export const getPendingUsers = catchAsync(async (req: Request, res: Response) => {
  const pendingUsers = await prisma.user.findMany({
    where: { isApproved: false },
    select: {
      id: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Pending users retrieved successfully',
    data: pendingUsers,
  });
});

export const approveUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isApproved: true },
    select: {
      id: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'User approved successfully',
    data: updatedUser,
  });
});

export const rejectUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  await prisma.user.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'User rejected and deleted successfully',
  });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const payload = updateRoleSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role: payload.role as Role },
    select: {
      id: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: updatedUser,
  });
});

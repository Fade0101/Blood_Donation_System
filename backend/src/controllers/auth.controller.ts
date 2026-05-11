import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const register = catchAsync(async (req: Request, res: Response) => {
  const payload = registerSchema.parse(req.body);
  const result = await authService.register(payload);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please wait for admin approval to access the system.',
    data: result,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const result = await authService.login(payload);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

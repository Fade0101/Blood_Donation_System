import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { Role } from '@prisma/client';

interface RegisterPayload {
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: Role;
  };
  token: string;
}

interface JwtPayload {
  userId: string;
  role: Role;
}

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  private readonly jwtExpiry = '7d';

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { email, password } = payload;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'STAFF',
      },
    });

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isApproved) {
      throw new Error('Your account is pending admin approval');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  private generateToken(userId: string, role: Role): string {
    const payload: JwtPayload = { userId, role };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiry });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();

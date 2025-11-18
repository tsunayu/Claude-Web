import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { RegisterInput, LoginInput } from '../schemas/validation';

const SALT_ROUNDS = 10;

export class AuthService {
  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === input.email) {
        throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
      }
      throw new AppError('Username already taken', 409, 'USERNAME_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        fullName: input.fullName,
        timezone: input.timezone || 'UTC',
        language: input.language || 'en',
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        timezone: true,
        language: true,
        subscriptionTier: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(input: LoginInput) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Return user data (without password hash)
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      timezone: user.timezone,
      language: user.language,
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        timezone: true,
        language: true,
        subscriptionTier: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }
}

export const authService = new AuthService();

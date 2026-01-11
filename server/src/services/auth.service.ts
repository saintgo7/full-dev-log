import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/jwt.js';
import { ConflictError, AuthenticationError, NotFoundError } from '../utils/errors.js';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserWithTokens {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: AuthTokens;
}

export async function register(input: RegisterInput): Promise<UserWithTokens> {
  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError('Email already registered');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  });

  // Generate tokens
  const tokens = await createSession(user.id, user.email, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    tokens,
  };
}

export async function login(input: LoginInput): Promise<UserWithTokens> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const tokens = await createSession(user.id, user.email, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    tokens,
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session) {
    throw new AuthenticationError('Invalid refresh token');
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new AuthenticationError('Refresh token expired');
  }

  // Delete old session
  await prisma.session.delete({ where: { id: session.id } });

  // Create new session
  return createSession(session.user.id, session.user.email, session.user.role);
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await prisma.session.deleteMany({
      where: { userId, refreshToken },
    });
  } else {
    // Logout all sessions
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

async function createSession(
  userId: string,
  email: string,
  role: string
): Promise<AuthTokens> {
  const accessToken = generateAccessToken({ userId, email, role });
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry();

  await prisma.session.create({
    data: {
      userId,
      refreshToken,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

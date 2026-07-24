/**
 * Auth Service Unit Tests
 * Tests user registration, login, token management
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as authService from '../../services/auth.service.js';
import { prisma } from '../../lib/prisma.js';
import * as passwordUtils from '../../utils/password.js';
import * as jwtUtils from '../../utils/jwt.js';
import { mockUser, mockSession } from '../mocks/prisma.mock.js';
import { ConflictError, AuthenticationError, NotFoundError } from '../../utils/errors.js';

// Mock the utility modules
jest.mock('../../utils/password.js');
jest.mock('../../utils/jwt.js');

const mockPasswordUtils = passwordUtils as jest.Mocked<typeof passwordUtils>;
const mockJwtUtils = jwtUtils as jest.Mocked<typeof jwtUtils>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerInput = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      };

      const hashedPassword = 'hashed_password_123';
      const user = mockUser({
        email: registerInput.email,
        name: registerInput.name,
        passwordHash: hashedPassword,
      });

      const accessToken = 'access_token_123';
      const refreshToken = 'refresh_token_123';

      // Mock implementations
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockPasswordUtils.hashPassword.mockResolvedValue(hashedPassword);
      (prisma.user.create as jest.Mock).mockResolvedValue(user);
      mockJwtUtils.generateAccessToken.mockReturnValue(accessToken);
      mockJwtUtils.generateRefreshToken.mockReturnValue(refreshToken);
      mockJwtUtils.getRefreshTokenExpiry.mockReturnValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession());

      const result = await authService.register(registerInput);

      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerInput.email },
      });
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith(registerInput.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: registerInput.email,
          passwordHash: hashedPassword,
          name: registerInput.name,
        },
      });
      expect(prisma.session.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      const registerInput = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser({ email: registerInput.email }));

      await expect(authService.register(registerInput)).rejects.toThrow(ConflictError);
      await expect(authService.register(registerInput)).rejects.toThrow('Email already registered');

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash password with bcrypt', async () => {
      const registerInput = {
        email: 'test@example.com',
        password: 'PlainPassword123',
        name: 'Test User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockPasswordUtils.hashPassword.mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser());
      mockJwtUtils.generateAccessToken.mockReturnValue('token');
      mockJwtUtils.generateRefreshToken.mockReturnValue('refresh');
      mockJwtUtils.getRefreshTokenExpiry.mockReturnValue(new Date());
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession());

      await authService.register(registerInput);

      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith(registerInput.password);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginInput = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      const user = mockUser({ email: loginInput.email });
      const accessToken = 'access_token_123';
      const refreshToken = 'refresh_token_123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      mockPasswordUtils.comparePassword.mockResolvedValue(true);
      mockJwtUtils.generateAccessToken.mockReturnValue(accessToken);
      mockJwtUtils.generateRefreshToken.mockReturnValue(refreshToken);
      mockJwtUtils.getRefreshTokenExpiry.mockReturnValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession());

      const result = await authService.login(loginInput);

      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(mockPasswordUtils.comparePassword).toHaveBeenCalledWith(
        loginInput.password,
        user.passwordHash
      );
    });

    it('should throw AuthenticationError if user not found', async () => {
      const loginInput = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toThrow(AuthenticationError);
      await expect(authService.login(loginInput)).rejects.toThrow('Invalid email or password');

      expect(mockPasswordUtils.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError if password is invalid', async () => {
      const loginInput = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      const user = mockUser({ email: loginInput.email });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      mockPasswordUtils.comparePassword.mockResolvedValue(false);

      await expect(authService.login(loginInput)).rejects.toThrow(AuthenticationError);
      await expect(authService.login(loginInput)).rejects.toThrow('Invalid email or password');

      expect(prisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const refreshToken = 'valid_refresh_token';
      const session = mockSession({ refreshToken });
      const user = mockUser({ id: session.userId });

      const newAccessToken = 'new_access_token';
      const newRefreshToken = 'new_refresh_token';

      (prisma.session.findUnique as jest.Mock).mockResolvedValue({ ...session, user });
      (prisma.session.delete as jest.Mock).mockResolvedValue(session);
      mockJwtUtils.generateAccessToken.mockReturnValue(newAccessToken);
      mockJwtUtils.generateRefreshToken.mockReturnValue(newRefreshToken);
      mockJwtUtils.getRefreshTokenExpiry.mockReturnValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession());

      const result = await authService.refreshTokens(refreshToken);

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { refreshToken },
        include: { user: true },
      });
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: session.id },
      });
    });

    it('should throw AuthenticationError if refresh token not found', async () => {
      const refreshToken = 'invalid_token';

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow(AuthenticationError);
      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw AuthenticationError if refresh token expired', async () => {
      const refreshToken = 'expired_token';
      const expiredSession = mockSession({
        refreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });
      const user = mockUser({ id: expiredSession.userId });

      (prisma.session.findUnique as jest.Mock).mockResolvedValue({ ...expiredSession, user });
      (prisma.session.delete as jest.Mock).mockResolvedValue(expiredSession);

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow(AuthenticationError);
      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow('Refresh token expired');

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: expiredSession.id },
      });
    });
  });

  describe('logout', () => {
    it('should logout specific session when refresh token provided', async () => {
      const userId = 'user-123';
      const refreshToken = 'refresh_token_123';

      (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await authService.logout(userId, refreshToken);

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId, refreshToken },
      });
    });

    it('should logout all sessions when no refresh token provided', async () => {
      const userId = 'user-123';

      (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      await authService.logout(userId);

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'user-123';
      const user = mockUser({ id: userId });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await authService.getProfile(userId);

      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should throw NotFoundError if user not found', async () => {
      const userId = 'nonexistent-user';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.getProfile(userId)).rejects.toThrow(NotFoundError);
      await expect(authService.getProfile(userId)).rejects.toThrow('User');
    });
  });
});

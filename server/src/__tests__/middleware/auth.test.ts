/**
 * Auth Middleware Unit Tests
 * Tests token validation, unauthorized access, expired tokens
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authMiddleware, agentAuthMiddleware } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import * as jwtUtils from '../../utils/jwt.js';
import { mockUser, mockAgent } from '../mocks/prisma.mock.js';
import type { AuthRequest, AgentRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

// Mock JWT utilities
jest.mock('../../utils/jwt.js');
const mockJwtUtils = jwtUtils as jest.Mocked<typeof jwtUtils>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
      json: jest.fn().mockReturnThis() as unknown as Response['json'],
    };

    mockNext = jest.fn() as NextFunction;
  });

  describe('authMiddleware', () => {
    it('should authenticate valid token', async () => {
      const token = 'valid_token_123';
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtUtils.verifyAccessToken.mockReturnValue(payload);

      await authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockJwtUtils.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      mockRequest.headers = {};

      await authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'No token provided',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      await authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'No token provided',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const token = 'expired_token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      mockJwtUtils.verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const token = 'invalid_token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtUtils.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract user info from valid token', async () => {
      const token = 'valid_token';
      const payload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtUtils.verifyAccessToken.mockReturnValue(payload);

      await authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
      });
    });
  });

  describe('agentAuthMiddleware', () => {
    let mockAgentRequest: Partial<AgentRequest>;

    beforeEach(() => {
      mockAgentRequest = {
        headers: {},
      };
    });

    it('should authenticate valid agent API token', async () => {
      const apiToken = 'valid_agent_token_123';
      const agent = mockAgent({ apiToken, status: 'active' });
      const user = mockUser({ id: agent.userId });

      mockAgentRequest.headers = {
        authorization: `Bearer ${apiToken}`,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        ...agent,
        user,
      });
      (prisma.agent.update as jest.Mock).mockResolvedValue(agent);

      await agentAuthMiddleware(
        mockAgentRequest as AgentRequest,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.agent.findUnique).toHaveBeenCalledWith({
        where: { apiToken },
        include: { user: true },
      });

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: agent.id },
        data: {
          lastActiveAt: expect.any(Date),
          status: 'active',
        },
      });

      expect(mockAgentRequest.agent).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without API token', async () => {
      mockAgentRequest.headers = {};

      await agentAuthMiddleware(
        mockAgentRequest as AgentRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'No API token provided',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid API token', async () => {
      const apiToken = 'invalid_token';

      mockAgentRequest.headers = {
        authorization: `Bearer ${apiToken}`,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      await agentAuthMiddleware(
        mockAgentRequest as AgentRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid API token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject revoked agent', async () => {
      const apiToken = 'revoked_agent_token';
      const agent = mockAgent({ apiToken, status: 'revoked' });
      const user = mockUser({ id: agent.userId });

      mockAgentRequest.headers = {
        authorization: `Bearer ${apiToken}`,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        ...agent,
        user,
      });

      await agentAuthMiddleware(
        mockAgentRequest as AgentRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Agent has been revoked',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(prisma.agent.update).not.toHaveBeenCalled();
    });

    it('should reactivate inactive agent on authentication', async () => {
      const apiToken = 'inactive_agent_token';
      const agent = mockAgent({ apiToken, status: 'inactive' });
      const user = mockUser({ id: agent.userId });

      mockAgentRequest.headers = {
        authorization: `Bearer ${apiToken}`,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        ...agent,
        user,
      });
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        ...agent,
        status: 'active',
      });

      await agentAuthMiddleware(
        mockAgentRequest as AgentRequest,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: agent.id },
        data: {
          lastActiveAt: expect.any(Date),
          status: 'active',
        },
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should update agent last active timestamp', async () => {
      const apiToken = 'agent_token';
      const agent = mockAgent({ apiToken });
      const user = mockUser({ id: agent.userId });

      mockAgentRequest.headers = {
        authorization: `Bearer ${apiToken}`,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        ...agent,
        user,
      });
      (prisma.agent.update as jest.Mock).mockResolvedValue(agent);

      const beforeTimestamp = Date.now();

      await agentAuthMiddleware(
        mockAgentRequest as AgentRequest,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.agent.update).toHaveBeenCalled();
      const updateCall = (prisma.agent.update as jest.Mock).mock.calls[0][0];
      const lastActiveAt = updateCall.data.lastActiveAt;

      expect(lastActiveAt).toBeInstanceOf(Date);
      expect(lastActiveAt.getTime()).toBeGreaterThanOrEqual(beforeTimestamp);
    });

    it('should handle database errors gracefully', async () => {
      const apiToken = 'agent_token';

      mockAgentRequest.headers = {
        authorization: `Bearer ${apiToken}`,
      };

      (prisma.agent.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await agentAuthMiddleware(
        mockAgentRequest as AgentRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

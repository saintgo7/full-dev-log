import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AuthenticationError } from '../utils/errors.js';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest, AgentRequest } from '../types/index.js';

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }

    // JWT errors
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    });
  }
}

export async function agentAuthMiddleware(
  req: AgentRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No API token provided');
    }

    const apiToken = authHeader.substring(7);

    const agent = await prisma.agent.findUnique({
      where: { apiToken },
      include: { user: true },
    });

    if (!agent) {
      throw new AuthenticationError('Invalid API token');
    }

    // Only block revoked agents - inactive agents can reconnect
    if (agent.status === 'revoked') {
      throw new AuthenticationError('Agent has been revoked');
    }

    // Update last active timestamp and reactivate if inactive
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        lastActiveAt: new Date(),
        status: 'active',
      },
    });

    req.agent = agent;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
}

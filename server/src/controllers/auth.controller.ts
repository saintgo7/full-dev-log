import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import type { AuthRequest } from '../types/index.js';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export async function register(
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user!.userId, refreshToken);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

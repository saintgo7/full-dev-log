import { Response, NextFunction } from 'express';
import * as teamActivityService from '../services/teamActivity.service.js';
import type { AuthRequest } from '../types/index.js';

/**
 * Get team activity feed
 * GET /api/v1/teams/:teamId/activity
 */
export async function getActivityFeed(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { teamId } = req.params;
    const { cursor, limit, type } = req.query;

    const result = await teamActivityService.getTeamActivity(
      teamId,
      req.user!.userId,
      {
        cursor: cursor as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        type: type as string | undefined,
      }
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Get team statistics
 * GET /api/v1/teams/:teamId/stats
 */
export async function getTeamStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { teamId } = req.params;
    const { period } = req.query;

    const stats = await teamActivityService.getTeamStats(
      teamId,
      req.user!.userId,
      (period as 'day' | 'week' | 'month') || 'week'
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

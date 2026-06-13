import { Response, NextFunction } from 'express';
import * as ideService from '../services/ide.service.js';
import { socketManager } from '../websocket/socketManager.js';
import type { AuthRequest } from '../types/index.js';
import type {
  RegisterIdeInput,
  HeartbeatInput,
  BatchEventsInput,
  DisconnectInput,
  StatsQueryInput,
} from '../schemas/ide.schema.js';

/**
 * Register a new IDE instance
 * POST /api/v1/ide/register
 */
export async function registerIDE(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await ideService.registerIde(
      req.user!.userId,
      req.body as RegisterIdeInput
    );

    // Broadcast IDE connection to user's dashboard
    socketManager.broadcastNotification(req.user!.userId, {
      type: 'info',
      title: 'IDE Connected',
      message: `${req.body.ideName} is now connected`,
      timestamp: new Date(),
    });

    // Broadcast IDE status update
    socketManager.broadcastIdeStatus(req.user!.userId, {
      action: 'connected',
      ideInstanceId: result.ideInstanceId,
      ideName: req.body.ideName,
      ideType: req.body.ideType,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * IDE heartbeat endpoint
 * POST /api/v1/ide/heartbeat
 */
export async function heartbeat(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = ideService.heartbeat(req.body as HeartbeatInput);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Receive batched events from IDE
 * POST /api/v1/ide/events
 */
export async function batchEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = req.body as BatchEventsInput;
    const result = await ideService.processBatchEvents(
      req.user!.userId,
      input.ideInstanceId,
      input.events
    );

    // Broadcast events to user's dashboard in real-time
    if (result.created.length > 0) {
      socketManager.broadcastIdeEvents(req.user!.userId, {
        ideInstanceId: input.ideInstanceId,
        events: result.created,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      data: {
        processed: result.processed,
        failed: result.failed,
        eventIds: result.created.map(e => e.id),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get quick stats for IDE sidebar
 * GET /api/v1/ide/stats
 */
export async function getQuickStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const query = req.query as unknown as StatsQueryInput;
    const days = query.days || 7;

    const stats = await ideService.getQuickStats(req.user!.userId, days);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get IDE connection status
 * GET /api/v1/ide/status
 */
export async function getIdeStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const status = ideService.getIdeStatus(req.user!.userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Disconnect an IDE instance
 * DELETE /api/v1/ide/disconnect
 */
export async function disconnectIDE(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = req.body as DisconnectInput;
    const result = await ideService.disconnectIde(
      req.user!.userId,
      input.ideInstanceId,
      input.reason
    );

    // Broadcast IDE disconnection to user's dashboard
    socketManager.broadcastNotification(req.user!.userId, {
      type: 'warning',
      title: 'IDE Disconnected',
      message: input.reason || 'IDE connection closed',
      timestamp: new Date(),
    });

    // Broadcast IDE status update
    socketManager.broadcastIdeStatus(req.user!.userId, {
      action: 'disconnected',
      ideInstanceId: input.ideInstanceId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

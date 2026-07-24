import { Response, NextFunction } from 'express';
import * as eventService from '../services/event.service.js';
import { socketManager } from '../websocket/socketManager.js';
import type { AuthRequest, AgentRequest } from '../types/index.js';
import type { CreateEventBatchInput, EventFiltersInput } from '../schemas/event.schema.js';

export async function createEventBatch(
  req: AgentRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { events } = req.body as CreateEventBatchInput;
    const result = await eventService.createEventBatch(
      req.agent!.id,
      req.agent!.userId,
      events
    );

    // Broadcast new events via WebSocket
    if (result.created && result.created.length > 0) {
      result.created.forEach(event => {
        socketManager.broadcastNewEvent({
          ...event,
          agent: {
            id: req.agent!.id,
            name: req.agent!.name,
            userId: req.agent!.userId
          }
        });
      });

      // Broadcast agent status update (agent is now active due to sync)
      socketManager.broadcastAgentStatus(
        req.agent!.id,
        'active',
        req.agent!.userId
      );

      // Send notification about new events
      socketManager.broadcastNotification(req.agent!.userId, {
        type: 'info',
        title: 'Events Synced',
        message: `${result.processed} new event(s) synced from ${req.agent!.name}`,
        timestamp: new Date(),
      });
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = req.query as unknown as EventFiltersInput;
    const result = await eventService.getEvents(req.user!.userId, filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getEvent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const event = await eventService.getEventById(req.user!.userId, req.params.id);
    if (!event) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' },
      });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
}

export async function getEventStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await eventService.getEventStats(req.user!.userId, days);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function searchEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { q, limit } = req.query;
    const events = await eventService.searchEvents(
      req.user!.userId,
      q as string,
      parseInt(limit as string) || 50
    );
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
}

/**
 * Get terminal events for the authenticated user
 */
export async function getTerminalEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = req.query as unknown as EventFiltersInput;
    const result = await eventService.getTerminalEvents(req.user!.userId, filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Get terminal statistics for the authenticated user
 */
export async function getTerminalStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await eventService.getTerminalStats(req.user!.userId, days);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

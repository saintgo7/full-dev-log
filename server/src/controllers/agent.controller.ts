import { Response, NextFunction } from 'express';
import * as agentService from '../services/agent.service.js';
import { socketManager } from '../websocket/socketManager.js';
import type { AuthRequest, AgentRequest } from '../types/index.js';
import type { CreateAgentInput, UpdateAgentInput } from '../schemas/agent.schema.js';

export async function createAgent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const agent = await agentService.createAgent(
      req.user!.userId,
      req.body as CreateAgentInput
    );
    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
}

export async function getAgents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const agents = await agentService.getAgents(req.user!.userId);
    res.json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
}

export async function getAgent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const agent = await agentService.getAgent(req.user!.userId, req.params.id);
    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
}

export async function updateAgent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const agent = await agentService.updateAgent(
      req.user!.userId,
      req.params.id,
      req.body as UpdateAgentInput
    );
    
    // Broadcast agent status update if status changed
    if (req.body.status) {
      socketManager.broadcastAgentStatus(
        agent.id,
        agent.status,
        req.user!.userId
      );
    }
    
    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
}

export async function regenerateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const agent = await agentService.regenerateToken(
      req.user!.userId,
      req.params.id
    );
    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
}

export async function deleteAgent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await agentService.deleteAgent(req.user!.userId, req.params.id);
    res.json({ success: true, data: { message: 'Agent deleted' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Agent heartbeat endpoint - called periodically by the Go agent
 * Updates lastActiveAt and broadcasts status changes
 */
export async function heartbeat(
  req: AgentRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await agentService.heartbeat(req.agent!.id);

    // Broadcast status change if agent just came online
    if (result.statusChanged) {
      socketManager.broadcastAgentStatus(
        result.id,
        'active',
        result.userId
      );

      // Send notification that agent is now online
      socketManager.broadcastNotification(result.userId, {
        type: 'success',
        title: 'Agent Online',
        message: `${result.name} is now connected`,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      data: {
        status: result.status,
        lastActiveAt: result.lastActiveAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

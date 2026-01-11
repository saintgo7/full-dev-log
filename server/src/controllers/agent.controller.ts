import { Response, NextFunction } from 'express';
import * as agentService from '../services/agent.service.js';
import type { AuthRequest } from '../types/index.js';
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

import { prisma } from '../lib/prisma.js';
import { generateApiToken } from '../utils/jwt.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import type { CreateAgentInput, UpdateAgentInput } from '../schemas/agent.schema.js';

export async function createAgent(userId: string, input: CreateAgentInput) {
  // Check if machine already registered
  const existing = await prisma.agent.findUnique({
    where: { machineId: input.machineId },
  });

  if (existing) {
    if (existing.userId === userId) {
      // Return existing agent token
      return existing;
    }
    throw new ConflictError('Machine already registered to another user');
  }

  const apiToken = generateApiToken();

  const agent = await prisma.agent.create({
    data: {
      userId,
      name: input.name,
      machineId: input.machineId,
      os: input.os,
      apiToken,
    },
  });

  return agent;
}

export async function getAgents(userId: string) {
  return prisma.agent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      machineId: true,
      os: true,
      status: true,
      lastSyncAt: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });
}

export async function getAgent(userId: string, agentId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId },
  });

  if (!agent) {
    throw new NotFoundError('Agent');
  }

  return agent;
}

export async function updateAgent(
  userId: string,
  agentId: string,
  input: UpdateAgentInput
) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId },
  });

  if (!agent) {
    throw new NotFoundError('Agent');
  }

  return prisma.agent.update({
    where: { id: agentId },
    data: input,
  });
}

export async function regenerateToken(userId: string, agentId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId },
  });

  if (!agent) {
    throw new NotFoundError('Agent');
  }

  const apiToken = generateApiToken();

  return prisma.agent.update({
    where: { id: agentId },
    data: { apiToken },
  });
}

export async function deleteAgent(userId: string, agentId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId },
  });

  if (!agent) {
    throw new NotFoundError('Agent');
  }

  await prisma.agent.delete({ where: { id: agentId } });
}

/**
 * Update agent heartbeat - called periodically by the agent to indicate it's alive
 */
export async function heartbeat(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new NotFoundError('Agent');
  }

  const previousStatus = agent.status;

  const updatedAgent = await prisma.agent.update({
    where: { id: agentId },
    data: {
      lastActiveAt: new Date(),
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      status: true,
      userId: true,
      lastActiveAt: true,
    },
  });

  return {
    ...updatedAgent,
    statusChanged: previousStatus !== 'active',
  };
}

/**
 * Check and update agent statuses based on last activity
 * Agents inactive for more than 5 minutes are marked as inactive
 */
export async function checkInactiveAgents() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const inactiveAgents = await prisma.agent.findMany({
    where: {
      status: 'active',
      lastActiveAt: {
        lt: fiveMinutesAgo,
      },
    },
    select: {
      id: true,
      userId: true,
      name: true,
    },
  });

  if (inactiveAgents.length > 0) {
    await prisma.agent.updateMany({
      where: {
        id: {
          in: inactiveAgents.map(a => a.id),
        },
      },
      data: {
        status: 'inactive',
      },
    });
  }

  return inactiveAgents;
}

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

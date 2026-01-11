import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  machineId: z.string().min(1).max(200),
  os: z.enum(['darwin', 'windows', 'linux']),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'inactive', 'revoked']).optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

import { api } from './api';
import type { Agent } from '@/types';

export interface CreateAgentInput {
  name: string;
  machineId: string;
  os: 'darwin' | 'windows' | 'linux';
}

export const agentsApi = {
  getAgents: () =>
    api.get<Agent[]>('/agents'),

  getAgent: (id: string) =>
    api.get<Agent>(`/agents/${id}`),

  createAgent: (input: CreateAgentInput) =>
    api.post<Agent>('/agents', input),

  updateAgent: (id: string, input: Partial<CreateAgentInput>) =>
    api.patch<Agent>(`/agents/${id}`, input),

  regenerateToken: (id: string) =>
    api.post<Agent>(`/agents/${id}/regenerate-token`),

  deleteAgent: (id: string) =>
    api.delete(`/agents/${id}`),
};

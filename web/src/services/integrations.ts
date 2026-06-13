import { api } from './api';
import type {
  Integration,
  CreateIntegrationParams,
  UpdateIntegrationParams,
  IntegrationTestResult,
} from '@/types';

export const integrationsApi = {
  // Get all integrations for a team
  getIntegrations: (teamId: string) =>
    api.get<Integration[]>(`/teams/${teamId}/integrations`),

  // Get single integration
  getIntegration: (teamId: string, integrationId: string) =>
    api.get<Integration>(`/teams/${teamId}/integrations/${integrationId}`),

  // Create integration
  createIntegration: (teamId: string, data: CreateIntegrationParams) =>
    api.post<Integration>(`/teams/${teamId}/integrations`, data),

  // Update integration
  updateIntegration: (
    teamId: string,
    integrationId: string,
    data: UpdateIntegrationParams
  ) =>
    api.patch<Integration>(
      `/teams/${teamId}/integrations/${integrationId}`,
      data
    ),

  // Delete integration
  deleteIntegration: (teamId: string, integrationId: string) =>
    api.delete<void>(`/teams/${teamId}/integrations/${integrationId}`),

  // Test integration webhook
  testIntegration: (teamId: string, integrationId: string) =>
    api.post<IntegrationTestResult>(
      `/teams/${teamId}/integrations/${integrationId}/test`
    ),
};

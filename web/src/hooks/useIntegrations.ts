'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { integrationsApi } from '@/services/integrations';
import type {
  CreateIntegrationParams,
  UpdateIntegrationParams,
} from '@/types';

// Query keys
const integrationKeys = {
  all: ['integrations'] as const,
  lists: () => [...integrationKeys.all, 'list'] as const,
  list: (teamId: string) => [...integrationKeys.lists(), teamId] as const,
  detail: (teamId: string, integrationId: string) =>
    [...integrationKeys.all, 'detail', teamId, integrationId] as const,
};

// Get all integrations for a team
export function useIntegrations(teamId: string) {
  return useQuery({
    queryKey: integrationKeys.list(teamId),
    queryFn: () => integrationsApi.getIntegrations(teamId),
    enabled: !!teamId,
  });
}

// Get single integration
export function useIntegration(teamId: string, integrationId: string) {
  return useQuery({
    queryKey: integrationKeys.detail(teamId, integrationId),
    queryFn: () => integrationsApi.getIntegration(teamId, integrationId),
    enabled: !!teamId && !!integrationId,
  });
}

// Create integration
export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: CreateIntegrationParams;
    }) => integrationsApi.createIntegration(teamId, data),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(teamId),
      });
    },
  });
}

// Update integration
export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      integrationId,
      data,
    }: {
      teamId: string;
      integrationId: string;
      data: UpdateIntegrationParams;
    }) => integrationsApi.updateIntegration(teamId, integrationId, data),
    onSuccess: (_, { teamId, integrationId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(teamId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.detail(teamId, integrationId),
      });
    },
  });
}

// Delete integration
export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      integrationId,
    }: {
      teamId: string;
      integrationId: string;
    }) => integrationsApi.deleteIntegration(teamId, integrationId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(teamId),
      });
    },
  });
}

// Test integration webhook
export function useTestIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      integrationId,
    }: {
      teamId: string;
      integrationId: string;
    }) => integrationsApi.testIntegration(teamId, integrationId),
    onSuccess: (_, { teamId }) => {
      // Refresh integrations to update lastTestedAt
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(teamId),
      });
    },
  });
}

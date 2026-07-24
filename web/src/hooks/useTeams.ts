'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { teamsApi } from '@/services/teams';
import type {
  TeamFilters,
  TeamActivityFilters,
  SharedNoteFilters,
  CreateTeamParams,
  InviteMemberParams,
  UpdateMemberRoleParams,
  CreateSharedNoteParams,
  TeamRole,
} from '@/types';

// Query keys
const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (filters: TeamFilters) => [...teamKeys.lists(), filters] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  members: (teamId: string) => [...teamKeys.all, 'members', teamId] as const,
  activity: (teamId: string, filters?: TeamActivityFilters) =>
    [...teamKeys.all, 'activity', teamId, filters] as const,
  notes: (teamId: string, filters?: SharedNoteFilters) =>
    [...teamKeys.all, 'notes', teamId, filters] as const,
  invitations: (teamId: string) =>
    [...teamKeys.all, 'invitations', teamId] as const,
};

// Teams list
export function useTeams(filters: TeamFilters = {}) {
  return useInfiniteQuery({
    queryKey: teamKeys.list(filters),
    queryFn: ({ pageParam }) =>
      teamsApi.getTeams({ ...filters, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.cursor : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

// Single team
export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamsApi.getTeam(id),
    enabled: !!id,
  });
}

// Team members
export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: teamKeys.members(teamId),
    queryFn: () => teamsApi.getMembers(teamId),
    enabled: !!teamId,
  });
}

// Team activity
export function useTeamActivity(teamId: string, filters: TeamActivityFilters = {}) {
  return useInfiniteQuery({
    queryKey: teamKeys.activity(teamId, filters),
    queryFn: ({ pageParam }) =>
      teamsApi.getActivity(teamId, {
        ...filters,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!teamId,
  });
}

// Team notes
export function useTeamNotes(teamId: string, filters: SharedNoteFilters = {}) {
  return useInfiniteQuery({
    queryKey: teamKeys.notes(teamId, filters),
    queryFn: ({ pageParam }) =>
      teamsApi.getNotes(teamId, {
        ...filters,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!teamId,
  });
}

// Team invitations
export function useTeamInvitations(teamId: string) {
  return useQuery({
    queryKey: teamKeys.invitations(teamId),
    queryFn: () => teamsApi.getInvitations(teamId),
    enabled: !!teamId,
  });
}

// Mutations
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamParams) => teamsApi.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTeamParams>;
    }) => teamsApi.updateTeam(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamsApi.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: InviteMemberParams }) =>
      teamsApi.inviteMember(teamId, data),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.invitations(teamId) });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      memberId,
      data,
    }: {
      teamId: string;
      memberId: string;
      data: UpdateMemberRoleParams;
    }) => teamsApi.updateMemberRole(teamId, memberId, data),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      queryClient.invalidateQueries({
        queryKey: teamKeys.activity(teamId),
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      teamsApi.removeMember(teamId, memberId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      queryClient.invalidateQueries({
        queryKey: teamKeys.activity(teamId),
      });
    },
  });
}

export function useLeaveTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamsApi.leaveTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      invitationId,
    }: {
      teamId: string;
      invitationId: string;
    }) => teamsApi.cancelInvitation(teamId, invitationId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.invitations(teamId) });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => teamsApi.acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useDeclineInvitation() {
  return useMutation({
    mutationFn: (invitationId: string) => teamsApi.declineInvitation(invitationId),
  });
}

// Shared Notes mutations
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: CreateSharedNoteParams;
    }) => teamsApi.createNote(teamId, data),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.notes(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      queryClient.invalidateQueries({
        queryKey: teamKeys.activity(teamId),
      });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      noteId,
      data,
    }: {
      teamId: string;
      noteId: string;
      data: Partial<CreateSharedNoteParams>;
    }) => teamsApi.updateNote(teamId, noteId, data),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.notes(teamId) });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, noteId }: { teamId: string; noteId: string }) =>
      teamsApi.deleteNote(teamId, noteId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.notes(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
    },
  });
}

export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, noteId }: { teamId: string; noteId: string }) =>
      teamsApi.togglePinNote(teamId, noteId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.notes(teamId) });
      queryClient.invalidateQueries({
        queryKey: teamKeys.activity(teamId),
      });
    },
  });
}

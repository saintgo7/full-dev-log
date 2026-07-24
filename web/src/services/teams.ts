import { api } from './api';
import type {
  Team,
  TeamMember,
  TeamActivity,
  SharedNote,
  TeamInvitation,
  CreateTeamParams,
  InviteMemberParams,
  UpdateMemberRoleParams,
  CreateSharedNoteParams,
  TeamFilters,
  TeamActivityFilters,
  SharedNoteFilters,
  PaginatedResponse,
} from '@/types';

export const teamsApi = {
  // Team CRUD
  getTeams: (filters: TeamFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    const queryString = params.toString();
    return api.get<PaginatedResponse<Team>>(`/teams${queryString ? `?${queryString}` : ''}`);
  },

  getTeam: (id: string) => api.get<Team>(`/teams/${id}`),

  createTeam: (data: CreateTeamParams) => api.post<Team>('/teams', data),

  updateTeam: (id: string, data: Partial<CreateTeamParams>) =>
    api.patch<Team>(`/teams/${id}`, data),

  deleteTeam: (id: string) => api.delete<void>(`/teams/${id}`),

  // Team Members
  getMembers: (teamId: string) =>
    api.get<TeamMember[]>(`/teams/${teamId}/members`),

  inviteMember: (teamId: string, data: InviteMemberParams) =>
    api.post<TeamInvitation>(`/teams/${teamId}/invitations`, data),

  updateMemberRole: (teamId: string, memberId: string, data: UpdateMemberRoleParams) =>
    api.patch<TeamMember>(`/teams/${teamId}/members/${memberId}`, data),

  removeMember: (teamId: string, memberId: string) =>
    api.delete<void>(`/teams/${teamId}/members/${memberId}`),

  leaveTeam: (teamId: string) =>
    api.post<void>(`/teams/${teamId}/leave`),

  // Invitations
  getInvitations: (teamId: string) =>
    api.get<TeamInvitation[]>(`/teams/${teamId}/invitations`),

  cancelInvitation: (teamId: string, invitationId: string) =>
    api.delete<void>(`/teams/${teamId}/invitations/${invitationId}`),

  acceptInvitation: (invitationId: string) =>
    api.post<TeamMember>(`/invitations/${invitationId}/accept`),

  declineInvitation: (invitationId: string) =>
    api.post<void>(`/invitations/${invitationId}/decline`),

  // Team Activity
  getActivity: (teamId: string, filters: TeamActivityFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    const queryString = params.toString();
    return api.get<PaginatedResponse<TeamActivity>>(
      `/teams/${teamId}/activity${queryString ? `?${queryString}` : ''}`
    );
  },

  // Shared Notes
  getNotes: (teamId: string, filters: SharedNoteFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    const queryString = params.toString();
    return api.get<PaginatedResponse<SharedNote>>(
      `/teams/${teamId}/notes${queryString ? `?${queryString}` : ''}`
    );
  },

  getNote: (teamId: string, noteId: string) =>
    api.get<SharedNote>(`/teams/${teamId}/notes/${noteId}`),

  createNote: (teamId: string, data: CreateSharedNoteParams) =>
    api.post<SharedNote>(`/teams/${teamId}/notes`, data),

  updateNote: (teamId: string, noteId: string, data: Partial<CreateSharedNoteParams>) =>
    api.patch<SharedNote>(`/teams/${teamId}/notes/${noteId}`, data),

  deleteNote: (teamId: string, noteId: string) =>
    api.delete<void>(`/teams/${teamId}/notes/${noteId}`),

  togglePinNote: (teamId: string, noteId: string) =>
    api.post<SharedNote>(`/teams/${teamId}/notes/${noteId}/toggle-pin`),
};

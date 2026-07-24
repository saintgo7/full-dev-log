import { api } from './api';
import type { Project, ProjectMember } from '@/types';

export interface CreateProjectInput {
  name: string;
  description?: string;
  repoUrl?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  repoUrl?: string | null;
}

export const projectsApi = {
  getProjects: () =>
    api.get<Project[]>('/projects'),

  getProject: (id: string) =>
    api.get<Project>(`/projects/${id}`),

  createProject: (input: CreateProjectInput) =>
    api.post<Project>('/projects', input),

  updateProject: (id: string, input: UpdateProjectInput) =>
    api.patch<Project>(`/projects/${id}`, input),

  deleteProject: (id: string) =>
    api.delete(`/projects/${id}`),

  addMember: (projectId: string, email: string, role: 'member' | 'viewer' = 'member') =>
    api.post<ProjectMember>(`/projects/${projectId}/members`, { email, role }),

  removeMember: (projectId: string, memberId: string) =>
    api.delete(`/projects/${projectId}/members/${memberId}`),
};

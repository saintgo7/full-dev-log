import { z } from 'zod';

// Team role enum matching Prisma schema
export const teamRoleSchema = z.enum(['owner', 'admin', 'member']);
export type TeamRoleType = z.infer<typeof teamRoleSchema>;

// Create team
export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

// Update team
export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
});
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

// Invite member
export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: teamRoleSchema.exclude(['owner']).default('member'),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// Update member role
export const updateMemberRoleSchema = z.object({
  role: teamRoleSchema.exclude(['owner']),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

// Accept invitation
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

// Add project to team
export const addProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
});
export type AddProjectInput = z.infer<typeof addProjectSchema>;

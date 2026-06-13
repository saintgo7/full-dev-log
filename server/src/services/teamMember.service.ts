import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, AuthorizationError, ConflictError, ValidationError } from '../utils/errors.js';
import type { TeamRoleType } from '../schemas/team.schema.js';

const INVITATION_EXPIRY_DAYS = 7;

/**
 * Generate a secure random token for invitations
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create an invitation to join a team
 */
export async function inviteMember(
  teamId: string,
  email: string,
  role: TeamRoleType,
  invitedBy: string
) {
  // Verify inviter is owner/admin
  const inviterMembership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: invitedBy,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!inviterMembership) {
    throw new AuthorizationError('Only team owner or admin can invite members');
  }

  // Cannot invite as owner
  if (role === 'owner') {
    throw new ValidationError('Cannot invite someone as owner');
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: existingUser.id,
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this team');
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.teamInvitation.findFirst({
    where: {
      teamId,
      email,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvitation) {
    throw new ConflictError('An invitation has already been sent to this email');
  }

  // Create invitation
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId,
      email,
      role,
      token: generateToken(),
      expiresAt,
      invitedBy,
    },
    include: {
      team: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return invitation;
}

/**
 * Accept an invitation and join the team
 */
export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: {
      team: true,
    },
  });

  if (!invitation) {
    throw new NotFoundError('Invitation');
  }

  if (invitation.expiresAt < new Date()) {
    // Clean up expired invitation
    await prisma.teamInvitation.delete({ where: { id: invitation.id } });
    throw new ValidationError('Invitation has expired');
  }

  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Verify email matches
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new AuthorizationError('This invitation was sent to a different email address');
  }

  // Check if already a member
  const existingMember = await prisma.teamMember.findFirst({
    where: {
      teamId: invitation.teamId,
      userId,
    },
  });

  if (existingMember) {
    // Clean up invitation and return existing membership
    await prisma.teamInvitation.delete({ where: { id: invitation.id } });
    throw new ConflictError('You are already a member of this team');
  }

  // Create membership and delete invitation in transaction
  const [member] = await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId,
        role: invitation.role,
      },
      include: {
        team: {
          select: { id: true, name: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.teamInvitation.delete({ where: { id: invitation.id } }),
  ]);

  return member;
}

/**
 * Remove a member from a team (owner/admin only)
 */
export async function removeMember(
  teamId: string,
  memberId: string,
  requesterId: string
) {
  // Verify requester is owner/admin
  const requesterMembership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: requesterId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!requesterMembership) {
    throw new AuthorizationError('Only team owner or admin can remove members');
  }

  // Get member to remove
  const memberToRemove = await prisma.teamMember.findFirst({
    where: { teamId, userId: memberId },
  });

  if (!memberToRemove) {
    throw new NotFoundError('Team member');
  }

  // Cannot remove owner
  if (memberToRemove.role === 'owner') {
    throw new AuthorizationError('Cannot remove team owner');
  }

  // Admin cannot remove other admins (only owner can)
  if (memberToRemove.role === 'admin' && requesterMembership.role !== 'owner') {
    throw new AuthorizationError('Only team owner can remove admins');
  }

  await prisma.teamMember.delete({
    where: {
      teamId_userId: { teamId, userId: memberId },
    },
  });
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  teamId: string,
  memberId: string,
  newRole: TeamRoleType,
  requesterId: string
) {
  // Verify requester is owner/admin
  const requesterMembership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: requesterId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!requesterMembership) {
    throw new AuthorizationError('Only team owner or admin can update roles');
  }

  // Cannot assign owner role
  if (newRole === 'owner') {
    throw new ValidationError('Cannot assign owner role. Use transfer ownership instead.');
  }

  // Get member to update
  const memberToUpdate = await prisma.teamMember.findFirst({
    where: { teamId, userId: memberId },
  });

  if (!memberToUpdate) {
    throw new NotFoundError('Team member');
  }

  // Cannot change owner's role
  if (memberToUpdate.role === 'owner') {
    throw new AuthorizationError('Cannot change owner role');
  }

  // Only owner can promote to admin or demote admins
  if (
    (newRole === 'admin' || memberToUpdate.role === 'admin') &&
    requesterMembership.role !== 'owner'
  ) {
    throw new AuthorizationError('Only team owner can promote/demote admins');
  }

  return prisma.teamMember.update({
    where: {
      teamId_userId: { teamId, userId: memberId },
    },
    data: { role: newRole },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Get all members of a team
 */
export async function getTeamMembers(teamId: string, userId: string) {
  // Verify requester is a member
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });

  if (!membership) {
    throw new AuthorizationError('You are not a member of this team');
  }

  return prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [
      { role: 'asc' }, // owner first, then admin, then member
      { joinedAt: 'asc' },
    ],
  });
}

/**
 * User leaves a team
 */
export async function leaveTeam(teamId: string, userId: string) {
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });

  if (!membership) {
    throw new NotFoundError('Team membership');
  }

  // Owner cannot leave (must transfer ownership or delete team)
  if (membership.role === 'owner') {
    throw new AuthorizationError(
      'Team owner cannot leave. Transfer ownership or delete the team instead.'
    );
  }

  await prisma.teamMember.delete({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
}

/**
 * Get pending invitations for a team (owner/admin only)
 */
export async function getTeamInvitations(teamId: string, userId: string) {
  // Verify requester is owner/admin
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!membership) {
    throw new AuthorizationError('Only team owner or admin can view invitations');
  }

  return prisma.teamInvitation.findMany({
    where: {
      teamId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Cancel/revoke an invitation
 */
export async function cancelInvitation(
  teamId: string,
  invitationId: string,
  userId: string
) {
  // Verify requester is owner/admin
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!membership) {
    throw new AuthorizationError('Only team owner or admin can cancel invitations');
  }

  const invitation = await prisma.teamInvitation.findFirst({
    where: { id: invitationId, teamId },
  });

  if (!invitation) {
    throw new NotFoundError('Invitation');
  }

  await prisma.teamInvitation.delete({ where: { id: invitationId } });
}

import { prisma } from '../lib/prisma.js';
import { cache } from '../lib/cache.js';
import { teamKeys, CACHE_TTL } from '../lib/cacheKeys.js';
import { NotFoundError, AuthorizationError, ConflictError } from '../utils/errors.js';
import type { CreateTeamInput, UpdateTeamInput } from '../schemas/team.schema.js';

/**
 * Generate a URL-friendly slug from team name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensure unique slug by appending random suffix if needed
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const existing = await prisma.team.findUnique({ where: { slug } });
    if (!existing) return slug;

    counter++;
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    if (counter > 10) {
      // Fallback to timestamp-based slug
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Create a new team with the creator as owner
 */
export async function createTeam(userId: string, input: CreateTeamInput) {
  const baseSlug = generateSlug(input.name);
  const slug = await ensureUniqueSlug(baseSlug);

  const team = await prisma.team.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'owner',
        },
      },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: {
        select: { members: true, projects: true },
      },
    },
  });

  // Invalidate user's teams cache
  cache.clear(teamKeys.userTeams(userId));

  return team;
}

/**
 * Get team by ID with member count
 * Results are cached for CACHE_TTL.MEDIUM seconds
 */
export async function getTeam(teamId: string, userId?: string) {
  const cacheKey = teamKeys.details(teamId);

  const team = await cache.wrap(
    cacheKey,
    async () => {
      return prisma.team.findUnique({
        where: { id: teamId },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: {
            select: { members: true, projects: true },
          },
        },
      });
    },
    CACHE_TTL.MEDIUM
  );

  if (!team) {
    throw new NotFoundError('Team');
  }

  // If userId provided, verify membership
  if (userId) {
    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new AuthorizationError('You are not a member of this team');
    }
  }

  return team;
}

/**
 * Update team (owner/admin only)
 */
export async function updateTeam(
  teamId: string,
  userId: string,
  input: UpdateTeamInput
) {
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!membership) {
    throw new AuthorizationError('Only team owner or admin can update team');
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data: input,
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { members: true, projects: true },
      },
    },
  });

  // Invalidate team cache
  invalidateTeamCache(teamId);

  return team;
}

/**
 * Delete team (owner only)
 */
export async function deleteTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  });

  if (!team) {
    throw new NotFoundError('Team');
  }

  if (team.ownerId !== userId) {
    throw new AuthorizationError('Only team owner can delete team');
  }

  await prisma.team.delete({ where: { id: teamId } });

  // Invalidate team cache and user's teams cache
  invalidateTeamCache(teamId);
  cache.clear(teamKeys.userTeams(userId));
}

/**
 * Get all teams a user belongs to
 * Results are cached for CACHE_TTL.MEDIUM seconds
 */
export async function getUserTeams(userId: string) {
  const cacheKey = teamKeys.userTeams(userId);

  return cache.wrap(
    cacheKey,
    async () => {
      return prisma.team.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: {
            select: { members: true, projects: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Add a project to a team (owner/admin only)
 */
export async function addProject(
  teamId: string,
  projectId: string,
  userId: string
) {
  // Verify user is owner/admin
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!membership) {
    throw new AuthorizationError('Only team owner or admin can add projects');
  }

  // Verify project exists and user has access
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      members: { some: { userId } },
    },
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Check if already linked
  const existing = await prisma.teamProject.findUnique({
    where: {
      teamId_projectId: { teamId, projectId },
    },
  });

  if (existing) {
    throw new ConflictError('Project is already linked to this team');
  }

  const teamProject = await prisma.teamProject.create({
    data: {
      teamId,
      projectId,
      addedBy: userId,
    },
    include: {
      project: true,
    },
  });

  // Invalidate team projects cache
  cache.clear(teamKeys.projects(teamId));

  return teamProject;
}

/**
 * Remove a project from a team (owner/admin only)
 */
export async function removeProject(
  teamId: string,
  projectId: string,
  userId: string
) {
  // Verify user is owner/admin
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!membership) {
    throw new AuthorizationError('Only team owner or admin can remove projects');
  }

  const teamProject = await prisma.teamProject.findUnique({
    where: {
      teamId_projectId: { teamId, projectId },
    },
  });

  if (!teamProject) {
    throw new NotFoundError('Team project association');
  }

  await prisma.teamProject.delete({
    where: {
      teamId_projectId: { teamId, projectId },
    },
  });

  // Invalidate team projects cache
  cache.clear(teamKeys.projects(teamId));
}

/**
 * Get all projects linked to a team
 * Results are cached for CACHE_TTL.MEDIUM seconds
 */
export async function getTeamProjects(teamId: string, userId: string) {
  // Verify membership (not cached for security)
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });

  if (!membership) {
    throw new AuthorizationError('You are not a member of this team');
  }

  const cacheKey = teamKeys.projects(teamId);

  return cache.wrap(
    cacheKey,
    async () => {
      return prisma.teamProject.findMany({
        where: { teamId },
        include: {
          project: {
            include: {
              _count: {
                select: { events: true, members: true },
              },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      });
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Invalidate all cached data for a team
 */
export function invalidateTeamCache(teamId: string): void {
  cache.clear(teamKeys.pattern(teamId));
}

/**
 * Invalidate all team-related cache for a user
 */
export function invalidateUserTeamsCache(userId: string): void {
  cache.clear(teamKeys.userPattern(userId));
}

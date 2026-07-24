import { prisma } from '../lib/prisma.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import type { CreateProjectInput, UpdateProjectInput } from '../schemas/project.schema.js';

export async function createProject(userId: string, input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      repoUrl: input.repoUrl,
      members: {
        create: {
          userId,
          role: 'owner',
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return project;
}

export async function getProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: {
        select: { events: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectById(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      members: { some: { userId } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: {
        select: { events: true },
      },
    },
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  return project;
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput
) {
  // Check if user is owner
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId, role: 'owner' },
  });

  if (!membership) {
    throw new AuthorizationError('Only project owner can update');
  }

  return prisma.project.update({
    where: { id: projectId },
    data: input,
  });
}

export async function deleteProject(userId: string, projectId: string) {
  // Check if user is owner
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId, role: 'owner' },
  });

  if (!membership) {
    throw new AuthorizationError('Only project owner can delete');
  }

  await prisma.project.delete({ where: { id: projectId } });
}

export async function addProjectMember(
  userId: string,
  projectId: string,
  memberEmail: string,
  role: 'member' | 'viewer' = 'member'
) {
  // Check if user is owner
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId, role: 'owner' },
  });

  if (!membership) {
    throw new AuthorizationError('Only project owner can add members');
  }

  const userToAdd = await prisma.user.findUnique({
    where: { email: memberEmail },
  });

  if (!userToAdd) {
    throw new NotFoundError('User');
  }

  return prisma.projectMember.create({
    data: {
      projectId,
      userId: userToAdd.id,
      role,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function removeProjectMember(
  userId: string,
  projectId: string,
  memberId: string
) {
  // Check if user is owner
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId, role: 'owner' },
  });

  if (!membership) {
    throw new AuthorizationError('Only project owner can remove members');
  }

  // Cannot remove owner
  const memberToRemove = await prisma.projectMember.findFirst({
    where: { projectId, userId: memberId },
  });

  if (memberToRemove?.role === 'owner') {
    throw new AuthorizationError('Cannot remove project owner');
  }

  await prisma.projectMember.deleteMany({
    where: { projectId, userId: memberId },
  });
}

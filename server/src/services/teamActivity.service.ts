import { prisma } from '../lib/prisma.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { socketManager } from '../websocket/socketManager.js';

// Activity types
export type TeamActivityType =
  | 'member_joined'
  | 'member_left'
  | 'member_role_changed'
  | 'project_added'
  | 'project_removed'
  | 'note_shared'
  | 'note_updated'
  | 'note_deleted'
  | 'milestone_reached'
  | 'comment_added';

export interface CreateActivityInput {
  teamId: string;
  userId: string;
  type: TeamActivityType;
  data?: Record<string, unknown>;
}

/**
 * Create a new team activity record and broadcast it
 */
export async function createActivity(input: CreateActivityInput) {
  const activity = await prisma.teamActivity.create({
    data: {
      teamId: input.teamId,
      userId: input.userId,
      type: input.type,
      data: input.data ? JSON.parse(JSON.stringify(input.data)) : {},
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Broadcast activity to team room
  socketManager.broadcastTeamActivity(input.teamId, {
    id: activity.id,
    type: activity.type,
    data: activity.data as Record<string, unknown>,
    user: activity.user,
    createdAt: activity.createdAt,
  });

  return activity;
}

/**
 * Get team activity feed with cursor-based pagination
 */
export async function getTeamActivity(
  teamId: string,
  userId: string,
  options: {
    cursor?: string;
    limit?: number;
    type?: string;
  } = {}
) {
  const { cursor, limit = 20, type } = options;

  // Verify user is a team member
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });

  if (!membership) {
    throw new AuthorizationError('You are not a member of this team');
  }

  const where: Record<string, unknown> = { teamId };
  if (type) {
    where.type = type;
  }

  const activities = await prisma.teamActivity.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

/**
 * Get team statistics for a period
 */
export async function getTeamStats(
  teamId: string,
  userId: string,
  period: 'day' | 'week' | 'month' = 'week'
) {
  // Verify user is a team member
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });

  if (!membership) {
    throw new AuthorizationError('You are not a member of this team');
  }

  // Calculate date range
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  // Get activity counts by type
  const activityCounts = await prisma.teamActivity.groupBy({
    by: ['type'],
    where: {
      teamId,
      createdAt: { gte: startDate },
    },
    _count: { id: true },
  });

  // Get total activities
  const totalActivities = await prisma.teamActivity.count({
    where: {
      teamId,
      createdAt: { gte: startDate },
    },
  });

  // Get active members (users with activity in period)
  const activeMembers = await prisma.teamActivity.findMany({
    where: {
      teamId,
      createdAt: { gte: startDate },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  // Get total members
  const totalMembers = await prisma.teamMember.count({
    where: { teamId },
  });

  // Get shared notes count
  const sharedNotes = await prisma.sharedNote.count({
    where: {
      teamId,
      createdAt: { gte: startDate },
    },
  });

  // Get comments count
  const comments = await prisma.noteComment.count({
    where: {
      note: { teamId },
      createdAt: { gte: startDate },
    },
  });

  // Get top contributors
  const topContributors = await prisma.teamActivity.groupBy({
    by: ['userId'],
    where: {
      teamId,
      createdAt: { gte: startDate },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  // Get user details for top contributors
  const contributorIds = topContributors.map(c => c.userId);
  const contributors = await prisma.user.findMany({
    where: { id: { in: contributorIds } },
    select: { id: true, name: true, email: true },
  });

  const topContributorsWithDetails = topContributors.map(c => {
    const user = contributors.find(u => u.id === c.userId);
    return {
      user,
      activityCount: c._count.id,
    };
  });

  return {
    period,
    startDate,
    endDate: now,
    totalActivities,
    activityByType: activityCounts.reduce(
      (acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    ),
    members: {
      total: totalMembers,
      active: activeMembers.length,
    },
    content: {
      notes: sharedNotes,
      comments,
    },
    topContributors: topContributorsWithDetails,
  };
}

/**
 * Delete old activities (for maintenance)
 */
export async function cleanupOldActivities(daysToKeep: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.teamActivity.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

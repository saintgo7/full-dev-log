import { prisma } from '../lib/prisma.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { socketManager } from '../websocket/socketManager.js';
import * as teamActivityService from './teamActivity.service.js';

export interface CreateNoteInput {
  title: string;
  content: string;
  projectId?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  projectId?: string | null;
}

export interface NoteFilters {
  search?: string;
  projectId?: string;
  authorId?: string;
  pinned?: boolean;
}

/**
 * Check if user is a member of the team
 */
async function verifyTeamMembership(teamId: string, userId: string) {
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });

  if (!membership) {
    throw new AuthorizationError('You are not a member of this team');
  }

  return membership;
}

/**
 * Check if user has admin or owner role in team
 */
async function verifyAdminRole(teamId: string, userId: string) {
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  return membership !== null;
}

/**
 * Extract @mentions from content
 * Returns array of usernames mentioned
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);

  if (!matches) {
    return [];
  }

  // Remove @ prefix and deduplicate
  const usernames = [...new Set(matches.map(m => m.slice(1)))];
  return usernames;
}

/**
 * Create mention records for a note
 */
export async function createMentions(
  noteId: string,
  teamId: string,
  usernames: string[]
) {
  if (usernames.length === 0) {
    return [];
  }

  // Find users by name who are also team members
  const teamMembers = await prisma.teamMember.findMany({
    where: {
      teamId,
      user: {
        name: { in: usernames },
      },
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  const userIds = teamMembers.map(m => m.userId);

  if (userIds.length === 0) {
    return [];
  }

  // Create mention records
  const mentions = await prisma.$transaction(
    userIds.map(userId =>
      prisma.noteMention.create({
        data: {
          noteId,
          userId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })
    )
  );

  // Broadcast mentions to users
  mentions.forEach(mention => {
    socketManager.broadcastMention(mention.userId, {
      id: mention.id,
      noteId,
      read: false,
      createdAt: mention.createdAt,
    });
  });

  return mentions;
}

/**
 * Create a shared note
 */
export async function createNote(
  teamId: string,
  authorId: string,
  input: CreateNoteInput
) {
  // Verify team membership
  await verifyTeamMembership(teamId, authorId);

  const note = await prisma.sharedNote.create({
    data: {
      teamId,
      authorId,
      title: input.title,
      content: input.content,
      projectId: input.projectId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      comments: {
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      mentions: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  // Extract and create mentions
  const usernames = extractMentions(input.content);
  if (usernames.length > 0) {
    await createMentions(note.id, teamId, usernames);
  }

  // Log activity
  await teamActivityService.createActivity({
    teamId,
    userId: authorId,
    type: 'note_shared',
    data: {
      noteId: note.id,
      noteTitle: note.title,
    },
  });

  // Broadcast note created event
  socketManager.broadcastNoteCreated(teamId, {
    id: note.id,
    title: note.title,
    author: note.author,
    createdAt: note.createdAt,
  });

  return note;
}

/**
 * Update a shared note (author only)
 */
export async function updateNote(
  noteId: string,
  userId: string,
  input: UpdateNoteInput
) {
  const note = await prisma.sharedNote.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  // Only author can update
  if (note.authorId !== userId) {
    throw new AuthorizationError('Only the author can update this note');
  }

  const updatedNote = await prisma.sharedNote.update({
    where: { id: noteId },
    data: input,
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      comments: {
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      mentions: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  // If content was updated, check for new mentions
  if (input.content) {
    const usernames = extractMentions(input.content);
    const existingMentionUserIds = updatedNote.mentions.map(m => m.userId);

    // Get users who are newly mentioned
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: note.teamId,
        user: {
          name: { in: usernames },
        },
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    const newMentions = teamMembers.filter(
      m => !existingMentionUserIds.includes(m.userId)
    );

    if (newMentions.length > 0) {
      await createMentions(
        noteId,
        note.teamId,
        newMentions.map(m => m.user.name)
      );
    }
  }

  // Log activity
  await teamActivityService.createActivity({
    teamId: note.teamId,
    userId,
    type: 'note_updated',
    data: {
      noteId: updatedNote.id,
      noteTitle: updatedNote.title,
    },
  });

  // Broadcast note updated event
  socketManager.broadcastNoteUpdated(note.teamId, {
    id: updatedNote.id,
    title: updatedNote.title,
    updatedAt: updatedNote.updatedAt,
  });

  return updatedNote;
}

/**
 * Delete a shared note (author only)
 */
export async function deleteNote(noteId: string, userId: string) {
  const note = await prisma.sharedNote.findUnique({
    where: { id: noteId },
    include: {
      team: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  // Author or team admin/owner can delete
  const isAuthor = note.authorId === userId;
  const isAdmin = note.team.members.some(m =>
    ['owner', 'admin'].includes(m.role)
  );

  if (!isAuthor && !isAdmin) {
    throw new AuthorizationError(
      'Only the author or team admins can delete this note'
    );
  }

  await prisma.sharedNote.delete({
    where: { id: noteId },
  });

  // Log activity
  await teamActivityService.createActivity({
    teamId: note.teamId,
    userId,
    type: 'note_deleted',
    data: {
      noteId: note.id,
      noteTitle: note.title,
    },
  });
}

/**
 * Get team notes with filters
 */
export async function getTeamNotes(
  teamId: string,
  userId: string,
  filters: NoteFilters = {}
) {
  // Verify team membership
  await verifyTeamMembership(teamId, userId);

  const where: Record<string, unknown> = { teamId };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.authorId) {
    where.authorId = filters.authorId;
  }

  if (typeof filters.pinned === 'boolean') {
    where.pinned = filters.pinned;
  }

  const notes = await prisma.sharedNote.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { comments: true, mentions: true },
      },
    },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  });

  return notes;
}

/**
 * Get a single note by ID
 */
export async function getNoteById(noteId: string, userId: string) {
  const note = await prisma.sharedNote.findUnique({
    where: { id: noteId },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      comments: {
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      mentions: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  // Verify team membership
  await verifyTeamMembership(note.teamId, userId);

  return note;
}

/**
 * Add a comment to a note
 */
export async function addComment(
  noteId: string,
  authorId: string,
  content: string
) {
  const note = await prisma.sharedNote.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  // Verify team membership
  await verifyTeamMembership(note.teamId, authorId);

  const comment = await prisma.noteComment.create({
    data: {
      noteId,
      authorId,
      content,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log activity
  await teamActivityService.createActivity({
    teamId: note.teamId,
    userId: authorId,
    type: 'comment_added',
    data: {
      noteId: note.id,
      noteTitle: note.title,
      commentId: comment.id,
    },
  });

  // Check for mentions in comment
  const usernames = extractMentions(content);
  if (usernames.length > 0) {
    await createMentions(noteId, note.teamId, usernames);
  }

  return comment;
}

/**
 * Delete a comment (author or team admin only)
 */
export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.noteComment.findUnique({
    where: { id: commentId },
    include: {
      note: {
        include: {
          team: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  if (!comment) {
    throw new NotFoundError('Comment');
  }

  // Author or team admin/owner can delete
  const isAuthor = comment.authorId === userId;
  const isAdmin = comment.note.team.members.some(m =>
    ['owner', 'admin'].includes(m.role)
  );

  if (!isAuthor && !isAdmin) {
    throw new AuthorizationError(
      'Only the author or team admins can delete this comment'
    );
  }

  await prisma.noteComment.delete({
    where: { id: commentId },
  });
}

/**
 * Toggle pin status (admin+ only)
 */
export async function togglePin(noteId: string, userId: string) {
  const note = await prisma.sharedNote.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  // Only admin or owner can pin
  const isAdmin = await verifyAdminRole(note.teamId, userId);
  if (!isAdmin) {
    throw new AuthorizationError('Only team admins can pin notes');
  }

  const updatedNote = await prisma.sharedNote.update({
    where: { id: noteId },
    data: { pinned: !note.pinned },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return updatedNote;
}

/**
 * Get unread mentions for a user
 */
export async function getUnreadMentions(userId: string) {
  const mentions = await prisma.noteMention.findMany({
    where: {
      userId,
      read: false,
    },
    include: {
      note: {
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return mentions;
}

/**
 * Get all mentions for a user with pagination
 */
export async function getMentions(
  userId: string,
  options: { cursor?: string; limit?: number; unreadOnly?: boolean } = {}
) {
  const { cursor, limit = 20, unreadOnly = false } = options;

  const where: Record<string, unknown> = { userId };
  if (unreadOnly) {
    where.read = false;
  }

  const mentions = await prisma.noteMention.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      note: {
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  const hasMore = mentions.length > limit;
  const items = hasMore ? mentions.slice(0, -1) : mentions;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

/**
 * Mark a mention as read
 */
export async function markMentionRead(mentionId: string, userId: string) {
  const mention = await prisma.noteMention.findUnique({
    where: { id: mentionId },
  });

  if (!mention) {
    throw new NotFoundError('Mention');
  }

  if (mention.userId !== userId) {
    throw new AuthorizationError('You can only mark your own mentions as read');
  }

  return prisma.noteMention.update({
    where: { id: mentionId },
    data: { read: true },
  });
}

/**
 * Mark all mentions as read for a user
 */
export async function markAllMentionsRead(userId: string) {
  const result = await prisma.noteMention.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  });

  return result.count;
}

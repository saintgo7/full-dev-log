import { z } from 'zod';

// Shared Note schemas
export const createSharedNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(100000),
  projectId: z.string().uuid().optional(),
});

export const updateSharedNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(100000).optional(),
  projectId: z.string().uuid().nullable().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(10000),
});

// Activity query schemas
export const activityQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z
    .enum([
      'member_joined',
      'member_left',
      'member_role_changed',
      'project_added',
      'project_removed',
      'note_shared',
      'note_updated',
      'note_deleted',
      'milestone_reached',
      'comment_added',
    ])
    .optional(),
});

// Stats query schema
export const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('week'),
});

// Note query schemas
export const noteQuerySchema = z.object({
  search: z.string().max(100).optional(),
  projectId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  pinned: z.coerce.boolean().optional(),
});

// Mention query schemas
export const mentionQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

// Export types
export type CreateSharedNoteInput = z.infer<typeof createSharedNoteSchema>;
export type UpdateSharedNoteInput = z.infer<typeof updateSharedNoteSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type NoteQuery = z.infer<typeof noteQuerySchema>;
export type MentionQuery = z.infer<typeof mentionQuerySchema>;

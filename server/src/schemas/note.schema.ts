import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

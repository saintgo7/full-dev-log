import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js';

export async function createNote(userId: string, input: CreateNoteInput) {
  return prisma.note.create({
    data: {
      userId,
      title: input.title,
      content: input.content,
      tags: input.tags,
    },
  });
}

export async function getNotes(userId: string, search?: string) {
  const where: Record<string, unknown> = { userId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }

  return prisma.note.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getNoteById(userId: string, noteId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  return note;
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput
) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  return prisma.note.update({
    where: { id: noteId },
    data: input,
  });
}

export async function deleteNote(userId: string, noteId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  await prisma.note.delete({ where: { id: noteId } });
}

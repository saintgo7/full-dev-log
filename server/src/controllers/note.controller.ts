import { Response, NextFunction } from 'express';
import * as noteService from '../services/note.service.js';
import type { AuthRequest } from '../types/index.js';
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js';

export async function createNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const note = await noteService.createNote(
      req.user!.userId,
      req.body as CreateNoteInput
    );
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

export async function getNotes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const search = req.query.search as string | undefined;
    const notes = await noteService.getNotes(req.user!.userId, search);
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
}

export async function getNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const note = await noteService.getNoteById(req.user!.userId, req.params.id);
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

export async function updateNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const note = await noteService.updateNote(
      req.user!.userId,
      req.params.id,
      req.body as UpdateNoteInput
    );
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

export async function deleteNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await noteService.deleteNote(req.user!.userId, req.params.id);
    res.json({ success: true, data: { message: 'Note deleted' } });
  } catch (error) {
    next(error);
  }
}

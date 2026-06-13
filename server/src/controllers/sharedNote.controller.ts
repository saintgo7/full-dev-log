import { Response, NextFunction } from 'express';
import * as sharedNoteService from '../services/sharedNote.service.js';
import type { AuthRequest } from '../types/index.js';
import type {
  CreateSharedNoteInput,
  UpdateSharedNoteInput,
  CreateCommentInput,
} from '../schemas/collaboration.schema.js';

/**
 * Create a shared note
 * POST /api/v1/teams/:teamId/notes
 */
export async function createNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { teamId } = req.params;
    const input = req.body as CreateSharedNoteInput;

    const note = await sharedNoteService.createNote(
      teamId,
      req.user!.userId,
      input
    );

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

/**
 * Get team notes
 * GET /api/v1/teams/:teamId/notes
 */
export async function getNotes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { teamId } = req.params;
    const { search, projectId, authorId, pinned } = req.query;

    const notes = await sharedNoteService.getTeamNotes(
      teamId,
      req.user!.userId,
      {
        search: search as string | undefined,
        projectId: projectId as string | undefined,
        authorId: authorId as string | undefined,
        pinned: pinned ? pinned === 'true' : undefined,
      }
    );

    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single note
 * GET /api/v1/teams/:teamId/notes/:noteId
 */
export async function getNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { noteId } = req.params;

    const note = await sharedNoteService.getNoteById(noteId, req.user!.userId);

    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a note
 * PATCH /api/v1/teams/:teamId/notes/:noteId
 */
export async function updateNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { noteId } = req.params;
    const input = req.body as UpdateSharedNoteInput;

    const note = await sharedNoteService.updateNote(
      noteId,
      req.user!.userId,
      input
    );

    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a note
 * DELETE /api/v1/teams/:teamId/notes/:noteId
 */
export async function deleteNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { noteId } = req.params;

    await sharedNoteService.deleteNote(noteId, req.user!.userId);

    res.json({ success: true, data: { message: 'Note deleted' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle pin on a note
 * POST /api/v1/teams/:teamId/notes/:noteId/pin
 */
export async function togglePin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { noteId } = req.params;

    const note = await sharedNoteService.togglePin(noteId, req.user!.userId);

    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

/**
 * Add a comment to a note
 * POST /api/v1/teams/:teamId/notes/:noteId/comments
 */
export async function addComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { noteId } = req.params;
    const input = req.body as CreateCommentInput;

    const comment = await sharedNoteService.addComment(
      noteId,
      req.user!.userId,
      input.content
    );

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a comment
 * DELETE /api/v1/teams/:teamId/notes/:noteId/comments/:commentId
 */
export async function deleteComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { commentId } = req.params;

    await sharedNoteService.deleteComment(commentId, req.user!.userId);

    res.json({ success: true, data: { message: 'Comment deleted' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's mentions
 * GET /api/v1/mentions
 */
export async function getMentions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { cursor, limit, unreadOnly } = req.query;

    const result = await sharedNoteService.getMentions(req.user!.userId, {
      cursor: cursor as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a mention as read
 * PATCH /api/v1/mentions/:id/read
 */
export async function markMentionRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const mention = await sharedNoteService.markMentionRead(
      id,
      req.user!.userId
    );

    res.json({ success: true, data: mention });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all mentions as read
 * POST /api/v1/mentions/read-all
 */
export async function markAllMentionsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const count = await sharedNoteService.markAllMentionsRead(req.user!.userId);

    res.json({
      success: true,
      data: { message: `Marked ${count} mentions as read` },
    });
  } catch (error) {
    next(error);
  }
}

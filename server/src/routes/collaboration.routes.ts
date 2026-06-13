import { Router } from 'express';
import * as teamActivityController from '../controllers/teamActivity.controller.js';
import * as sharedNoteController from '../controllers/sharedNote.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createSharedNoteSchema,
  updateSharedNoteSchema,
  createCommentSchema,
} from '../schemas/collaboration.schema.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// Team Activity Routes
// ============================================

// GET /api/v1/teams/:teamId/activity - Get team activity feed
router.get('/teams/:teamId/activity', teamActivityController.getActivityFeed);

// GET /api/v1/teams/:teamId/stats - Get team statistics
router.get('/teams/:teamId/stats', teamActivityController.getTeamStats);

// ============================================
// Shared Notes Routes
// ============================================

// POST /api/v1/teams/:teamId/notes - Create shared note
router.post(
  '/teams/:teamId/notes',
  validate(createSharedNoteSchema),
  sharedNoteController.createNote
);

// GET /api/v1/teams/:teamId/notes - List team notes
router.get('/teams/:teamId/notes', sharedNoteController.getNotes);

// GET /api/v1/teams/:teamId/notes/:noteId - Get single note
router.get('/teams/:teamId/notes/:noteId', sharedNoteController.getNote);

// PATCH /api/v1/teams/:teamId/notes/:noteId - Update note
router.patch(
  '/teams/:teamId/notes/:noteId',
  validate(updateSharedNoteSchema),
  sharedNoteController.updateNote
);

// DELETE /api/v1/teams/:teamId/notes/:noteId - Delete note
router.delete('/teams/:teamId/notes/:noteId', sharedNoteController.deleteNote);

// POST /api/v1/teams/:teamId/notes/:noteId/pin - Toggle pin
router.post('/teams/:teamId/notes/:noteId/pin', sharedNoteController.togglePin);

// ============================================
// Comment Routes
// ============================================

// POST /api/v1/teams/:teamId/notes/:noteId/comments - Add comment
router.post(
  '/teams/:teamId/notes/:noteId/comments',
  validate(createCommentSchema),
  sharedNoteController.addComment
);

// DELETE /api/v1/teams/:teamId/notes/:noteId/comments/:commentId - Delete comment
router.delete(
  '/teams/:teamId/notes/:noteId/comments/:commentId',
  sharedNoteController.deleteComment
);

// ============================================
// Mention Routes
// ============================================

// GET /api/v1/mentions - Get user's mentions
router.get('/mentions', sharedNoteController.getMentions);

// PATCH /api/v1/mentions/:id/read - Mark mention as read
router.patch('/mentions/:id/read', sharedNoteController.markMentionRead);

// POST /api/v1/mentions/read-all - Mark all mentions as read
router.post('/mentions/read-all', sharedNoteController.markAllMentionsRead);

export default router;

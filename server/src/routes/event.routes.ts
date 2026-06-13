import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import { authMiddleware, agentAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEventBatchSchema, eventFiltersSchema } from '../schemas/event.schema.js';

const router = Router();

// Agent routes (API token auth)
router.post(
  '/batch',
  agentAuthMiddleware,
  validate(createEventBatchSchema),
  eventController.createEventBatch
);

// User routes (JWT auth)
router.get('/', authMiddleware, validate(eventFiltersSchema, 'query'), eventController.getEvents);
router.get('/search', authMiddleware, eventController.searchEvents);
router.get('/stats', authMiddleware, eventController.getEventStats);

// Terminal event routes
router.get('/terminal', authMiddleware, validate(eventFiltersSchema, 'query'), eventController.getTerminalEvents);
router.get('/terminal/stats', authMiddleware, eventController.getTerminalStats);

router.get('/:id', authMiddleware, eventController.getEvent);

export default router;

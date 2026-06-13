import { Router } from 'express';
import * as ideController from '../controllers/ide.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerIdeSchema,
  heartbeatSchema,
  batchEventsSchema,
  disconnectSchema,
  statsQuerySchema,
} from '../schemas/ide.schema.js';

const router = Router();

// All IDE routes require user authentication
router.use(authMiddleware);

// Register a new IDE instance
// POST /api/v1/ide/register
router.post('/register', validate(registerIdeSchema), ideController.registerIDE);

// IDE heartbeat
// POST /api/v1/ide/heartbeat
router.post('/heartbeat', validate(heartbeatSchema), ideController.heartbeat);

// Batch events from IDE
// POST /api/v1/ide/events
router.post('/events', validate(batchEventsSchema), ideController.batchEvents);

// Get quick stats for IDE sidebar
// GET /api/v1/ide/stats
router.get('/stats', ideController.getQuickStats);

// Get IDE connection status
// GET /api/v1/ide/status
router.get('/status', ideController.getIdeStatus);

// Disconnect IDE instance
// DELETE /api/v1/ide/disconnect
router.delete('/disconnect', validate(disconnectSchema), ideController.disconnectIDE);

export default router;

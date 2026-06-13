import { Router } from 'express';
import * as integrationController from '../controllers/integration.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createIntegrationSchema,
  updateIntegrationSchema,
} from '../schemas/integration.schema.js';

const router = Router({ mergeParams: true }); // mergeParams to access :teamId from parent router

// All routes require authentication
router.use(authMiddleware);

/**
 * Integration Routes for Teams
 * Base path: /api/v1/teams/:teamId/integrations
 */

// GET /api/v1/teams/:teamId/integrations/events - Get available event types
// This must come before /:id routes to avoid conflict
router.get('/events', integrationController.getAvailableEvents);

// POST /api/v1/teams/:teamId/integrations - Create a new integration
router.post(
  '/',
  validate(createIntegrationSchema),
  integrationController.createIntegration
);

// GET /api/v1/teams/:teamId/integrations - List all integrations for a team
router.get('/', integrationController.getIntegrations);

// GET /api/v1/teams/:teamId/integrations/:id - Get a single integration
router.get('/:id', integrationController.getIntegration);

// PATCH /api/v1/teams/:teamId/integrations/:id - Update an integration
router.patch(
  '/:id',
  validate(updateIntegrationSchema),
  integrationController.updateIntegration
);

// DELETE /api/v1/teams/:teamId/integrations/:id - Delete an integration
router.delete('/:id', integrationController.deleteIntegration);

// POST /api/v1/teams/:teamId/integrations/:id/test - Test an integration
router.post('/:id/test', integrationController.testIntegration);

export default router;

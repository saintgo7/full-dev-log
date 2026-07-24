import { Response, NextFunction } from 'express';
import { integrationService, VALID_EVENTS } from '../services/integration.service.js';
import type { AuthRequest } from '../types/index.js';
import type {
  CreateIntegrationInput,
  UpdateIntegrationInput,
} from '../schemas/integration.schema.js';

/**
 * Create a new integration for a team
 * POST /api/v1/teams/:teamId/integrations
 */
export async function createIntegration(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { teamId } = req.params;
    const userId = req.user!.userId;
    const input = req.body as CreateIntegrationInput;

    const integration = await integrationService.createIntegration(
      teamId,
      userId,
      input
    );

    res.status(201).json({
      success: true,
      data: integration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all integrations for a team
 * GET /api/v1/teams/:teamId/integrations
 */
export async function getIntegrations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { teamId } = req.params;
    const userId = req.user!.userId;

    const integrations = await integrationService.getTeamIntegrations(
      teamId,
      userId
    );

    res.json({
      success: true,
      data: integrations,
      meta: {
        total: integrations.length,
        availableEvents: VALID_EVENTS,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single integration
 * GET /api/v1/teams/:teamId/integrations/:id
 */
export async function getIntegration(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const integration = await integrationService.getIntegration(id, userId);

    res.json({
      success: true,
      data: integration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an integration
 * PATCH /api/v1/teams/:teamId/integrations/:id
 */
export async function updateIntegration(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const input = req.body as UpdateIntegrationInput;

    const integration = await integrationService.updateIntegration(
      id,
      userId,
      input
    );

    res.json({
      success: true,
      data: integration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an integration
 * DELETE /api/v1/teams/:teamId/integrations/:id
 */
export async function deleteIntegration(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await integrationService.deleteIntegration(id, userId);

    res.json({
      success: true,
      data: { message: 'Integration deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Test an integration by sending a test message
 * POST /api/v1/teams/:teamId/integrations/:id/test
 */
export async function testIntegration(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await integrationService.testIntegration(id, userId);

    if (result.success) {
      res.json({
        success: true,
        data: { message: 'Test message sent successfully' },
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: result.error || 'Failed to send test message',
        },
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get available event types
 * GET /api/v1/teams/:teamId/integrations/events
 */
export async function getAvailableEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({
      success: true,
      data: {
        events: VALID_EVENTS,
        descriptions: {
          member_joined: 'When a new member joins the team',
          member_left: 'When a member leaves the team',
          member_role_changed: 'When a member\'s role is changed',
          note_created: 'When a new note is created',
          note_shared: 'When a note is shared with the team',
          note_updated: 'When a note is updated',
          note_deleted: 'When a note is deleted',
          comment_added: 'When a comment is added to a note',
          project_added: 'When a project is added to the team',
          project_removed: 'When a project is removed from the team',
          report_ready: 'When a report is ready for review',
          milestone_reached: 'When a team milestone is reached',
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

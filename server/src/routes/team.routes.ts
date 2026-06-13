import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  addProjectSchema,
} from '../schemas/team.schema.js';
import integrationRoutes from './integration.routes.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============ Team CRUD ============
// POST /api/v1/teams - Create team
router.post('/', validate(createTeamSchema), teamController.createTeam);

// GET /api/v1/teams - List user's teams
router.get('/', teamController.getTeams);

// GET /api/v1/teams/:id - Get team
router.get('/:id', teamController.getTeam);

// PATCH /api/v1/teams/:id - Update team
router.patch('/:id', validate(updateTeamSchema), teamController.updateTeam);

// DELETE /api/v1/teams/:id - Delete team
router.delete('/:id', teamController.deleteTeam);

// ============ Team Members ============
// GET /api/v1/teams/:id/members - Get team members
router.get('/:id/members', teamController.getMembers);

// POST /api/v1/teams/:id/members/invite - Invite member
router.post(
  '/:id/members/invite',
  validate(inviteMemberSchema),
  teamController.inviteMember
);

// DELETE /api/v1/teams/:id/members/:memberId - Remove member
router.delete('/:id/members/:memberId', teamController.removeMember);

// PATCH /api/v1/teams/:id/members/:memberId - Update member role
router.patch(
  '/:id/members/:memberId',
  validate(updateMemberRoleSchema),
  teamController.updateMemberRole
);

// POST /api/v1/teams/:id/leave - Leave team
router.post('/:id/leave', teamController.leaveTeam);

// ============ Invitations ============
// POST /api/v1/teams/invitations/:token/accept - Accept invitation
router.post('/invitations/:token/accept', teamController.acceptInvitation);

// GET /api/v1/teams/:id/invitations - Get pending invitations
router.get('/:id/invitations', teamController.getInvitations);

// DELETE /api/v1/teams/:id/invitations/:invitationId - Cancel invitation
router.delete(
  '/:id/invitations/:invitationId',
  teamController.cancelInvitation
);

// ============ Team Projects ============
// GET /api/v1/teams/:id/projects - Get team projects
router.get('/:id/projects', teamController.getProjects);

// POST /api/v1/teams/:id/projects - Add project to team
router.post(
  '/:id/projects',
  validate(addProjectSchema),
  teamController.addProject
);

// DELETE /api/v1/teams/:id/projects/:projectId - Remove project from team
router.delete('/:id/projects/:projectId', teamController.removeProject);

// ============ Team Integrations ============
// Mount integration routes under /api/v1/teams/:teamId/integrations
router.use('/:teamId/integrations', integrationRoutes);

export default router;

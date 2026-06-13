import { Response, NextFunction } from 'express';
import * as teamService from '../services/team.service.js';
import * as teamMemberService from '../services/teamMember.service.js';
import type { AuthRequest } from '../types/index.js';
import type {
  CreateTeamInput,
  UpdateTeamInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
  AddProjectInput,
} from '../schemas/team.schema.js';

// ============ Team CRUD ============

export async function createTeam(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const team = await teamService.createTeam(
      req.user!.userId,
      req.body as CreateTeamInput
    );
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

export async function getTeams(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const teams = await teamService.getUserTeams(req.user!.userId);
    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
}

export async function getTeam(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const team = await teamService.getTeam(req.params.id, req.user!.userId);
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const team = await teamService.updateTeam(
      req.params.id,
      req.user!.userId,
      req.body as UpdateTeamInput
    );
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeam(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await teamService.deleteTeam(req.params.id, req.user!.userId);
    res.json({ success: true, data: { message: 'Team deleted' } });
  } catch (error) {
    next(error);
  }
}

// ============ Team Members ============

export async function getMembers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const members = await teamMemberService.getTeamMembers(
      req.params.id,
      req.user!.userId
    );
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
}

export async function inviteMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, role } = req.body as InviteMemberInput;
    const invitation = await teamMemberService.inviteMember(
      req.params.id,
      email,
      role,
      req.user!.userId
    );
    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

export async function acceptInvitation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const member = await teamMemberService.acceptInvitation(
      req.params.token,
      req.user!.userId
    );
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await teamMemberService.removeMember(
      req.params.id,
      req.params.memberId,
      req.user!.userId
    );
    res.json({ success: true, data: { message: 'Member removed' } });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { role } = req.body as UpdateMemberRoleInput;
    const member = await teamMemberService.updateMemberRole(
      req.params.id,
      req.params.memberId,
      role,
      req.user!.userId
    );
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function leaveTeam(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await teamMemberService.leaveTeam(req.params.id, req.user!.userId);
    res.json({ success: true, data: { message: 'Left team successfully' } });
  } catch (error) {
    next(error);
  }
}

// ============ Invitations ============

export async function getInvitations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const invitations = await teamMemberService.getTeamInvitations(
      req.params.id,
      req.user!.userId
    );
    res.json({ success: true, data: invitations });
  } catch (error) {
    next(error);
  }
}

export async function cancelInvitation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await teamMemberService.cancelInvitation(
      req.params.id,
      req.params.invitationId,
      req.user!.userId
    );
    res.json({ success: true, data: { message: 'Invitation cancelled' } });
  } catch (error) {
    next(error);
  }
}

// ============ Team Projects ============

export async function getProjects(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const projects = await teamService.getTeamProjects(
      req.params.id,
      req.user!.userId
    );
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
}

export async function addProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { projectId } = req.body as AddProjectInput;
    const teamProject = await teamService.addProject(
      req.params.id,
      projectId,
      req.user!.userId
    );
    res.status(201).json({ success: true, data: teamProject });
  } catch (error) {
    next(error);
  }
}

export async function removeProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await teamService.removeProject(
      req.params.id,
      req.params.projectId,
      req.user!.userId
    );
    res.json({ success: true, data: { message: 'Project removed from team' } });
  } catch (error) {
    next(error);
  }
}

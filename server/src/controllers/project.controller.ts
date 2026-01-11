import { Response, NextFunction } from 'express';
import * as projectService from '../services/project.service.js';
import type { AuthRequest } from '../types/index.js';
import type { CreateProjectInput, UpdateProjectInput } from '../schemas/project.schema.js';

export async function createProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const project = await projectService.createProject(
      req.user!.userId,
      req.body as CreateProjectInput
    );
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

export async function getProjects(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const projects = await projectService.getProjects(req.user!.userId);
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
}

export async function getProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const project = await projectService.getProjectById(
      req.user!.userId,
      req.params.id
    );
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const project = await projectService.updateProject(
      req.user!.userId,
      req.params.id,
      req.body as UpdateProjectInput
    );
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await projectService.deleteProject(req.user!.userId, req.params.id);
    res.json({ success: true, data: { message: 'Project deleted' } });
  } catch (error) {
    next(error);
  }
}

export async function addMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, role } = req.body;
    const member = await projectService.addProjectMember(
      req.user!.userId,
      req.params.id,
      email,
      role
    );
    res.status(201).json({ success: true, data: member });
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
    await projectService.removeProjectMember(
      req.user!.userId,
      req.params.id,
      req.params.memberId
    );
    res.json({ success: true, data: { message: 'Member removed' } });
  } catch (error) {
    next(error);
  }
}

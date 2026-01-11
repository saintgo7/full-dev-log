import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.patch('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/members', projectController.addMember);
router.delete('/:id/members/:memberId', projectController.removeMember);

export default router;

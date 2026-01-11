import { Router } from 'express';
import * as agentController from '../controllers/agent.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAgentSchema, updateAgentSchema } from '../schemas/agent.schema.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createAgentSchema), agentController.createAgent);
router.get('/', agentController.getAgents);
router.get('/:id', agentController.getAgent);
router.patch('/:id', validate(updateAgentSchema), agentController.updateAgent);
router.post('/:id/regenerate-token', agentController.regenerateToken);
router.delete('/:id', agentController.deleteAgent);

export default router;

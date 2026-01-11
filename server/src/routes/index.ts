import { Router } from 'express';
import authRoutes from './auth.routes.js';
import agentRoutes from './agent.routes.js';
import eventRoutes from './event.routes.js';
import noteRoutes from './note.routes.js';
import projectRoutes from './project.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/agents', agentRoutes);
router.use('/events', eventRoutes);
router.use('/notes', noteRoutes);
router.use('/projects', projectRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

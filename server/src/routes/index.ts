import { Router } from 'express';
import authRoutes from './auth.routes.js';
import agentRoutes from './agent.routes.js';
import eventRoutes from './event.routes.js';
import noteRoutes from './note.routes.js';
import projectRoutes from './project.routes.js';
import reportRoutes from './report.routes.js';
import insightsRoutes from './insights.routes.js';
import ideRoutes from './ide.routes.js';
import teamRoutes from './team.routes.js';
import collaborationRoutes from './collaboration.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import { healthApiRoutes } from './health.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/agents', agentRoutes);
router.use('/events', eventRoutes);
router.use('/notes', noteRoutes);
router.use('/projects', projectRoutes);
router.use('/reports', reportRoutes);
router.use('/insights', insightsRoutes);
router.use('/ide', ideRoutes);
router.use('/teams', teamRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
// Collaboration routes (team activity, shared notes, mentions)
router.use('/', collaborationRoutes);
// Health check API routes (authenticated)
router.use('/health', healthApiRoutes);

export default router;

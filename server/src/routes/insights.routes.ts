/**
 * Insights Routes - DevLog Hub
 * M9-T2: Anomaly Detection and Recommendations API
 *
 * Routes for AI-powered insights, anomaly detection,
 * and personalized recommendations.
 */

import { Router } from 'express';
import * as insightsController from '../controllers/insights.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ==================== Main Insights Routes ====================

/**
 * GET /api/v1/insights
 * Get all AI insights for user (anomalies + recommendations)
 */
router.get('/', insightsController.getInsights);

/**
 * POST /api/v1/insights/refresh
 * Refresh insights (clear cache and recalculate)
 */
router.post('/refresh', insightsController.refreshInsights);

// ==================== Anomaly Routes ====================

/**
 * GET /api/v1/insights/anomalies
 * Get detected anomalies
 * Query params:
 *   - type: 'work_pattern' | 'overwork' | 'inactivity'
 *   - severity: 'low' | 'medium' | 'high'
 *   - includeDismissed: boolean
 */
router.get('/anomalies', insightsController.getAnomalies);

/**
 * POST /api/v1/insights/anomalies/:id/dismiss
 * Dismiss an anomaly
 */
router.post('/anomalies/:id/dismiss', insightsController.dismissAnomaly);

/**
 * POST /api/v1/insights/anomalies/:id/restore
 * Restore a dismissed anomaly
 */
router.post('/anomalies/:id/restore', insightsController.restoreAnomaly);

// ==================== Recommendation Routes ====================

/**
 * GET /api/v1/insights/recommendations
 * Get personalized recommendations
 * Query params:
 *   - type: 'optimal_hours' | 'break_suggestion' | 'productivity_tip'
 *   - minPriority: number (1-5)
 */
router.get('/recommendations', insightsController.getRecommendations);

/**
 * GET /api/v1/insights/optimal-hours
 * Get optimal work hours analysis
 */
router.get('/optimal-hours', insightsController.getOptimalHours);

/**
 * GET /api/v1/insights/break-suggestion
 * Get break suggestions based on current activity
 */
router.get('/break-suggestion', insightsController.getBreakSuggestion);

/**
 * GET /api/v1/insights/productivity-tips
 * Get personalized productivity tips
 */
router.get('/productivity-tips', insightsController.getProductivityTips);

export default router;

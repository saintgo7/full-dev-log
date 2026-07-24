/**
 * Insights Controller - DevLog Hub
 * M9-T2: Anomaly Detection and Recommendations API
 *
 * Handles endpoints for AI-powered insights, anomaly detection,
 * and personalized recommendations.
 */

import { Response, NextFunction } from 'express';
import { anomalyDetector, type Anomaly } from '../services/anomaly.service.js';
import {
  recommendationEngine,
  type Recommendation,
  type OptimalHours,
  type BreakSuggestion,
  type ProductivityTip,
} from '../services/recommendation.service.js';
import type { AuthRequest } from '../types/index.js';

// In-memory storage for dismissed anomalies (in production, use database)
const dismissedAnomalies = new Map<string, Set<string>>();

/**
 * Get all AI insights for user (anomalies + recommendations)
 * GET /api/v1/insights
 */
export async function getInsights(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;

    // Get anomalies and recommendations in parallel
    const [anomalies, recommendations] = await Promise.all([
      anomalyDetector.detectAll(userId),
      recommendationEngine.getAllRecommendations(userId),
    ]);

    // Filter out dismissed anomalies
    const userDismissed = dismissedAnomalies.get(userId) || new Set();
    const activeAnomalies = anomalies.filter(a => !userDismissed.has(a.id));

    // Calculate summary statistics
    const summary = {
      totalAnomalies: activeAnomalies.length,
      totalRecommendations: recommendations.length,
      highPriorityAnomalies: activeAnomalies.filter(a => a.severity === 'high').length,
      highPriorityRecommendations: recommendations.filter(r => r.priority >= 4).length,
      anomaliesBySeverity: {
        high: activeAnomalies.filter(a => a.severity === 'high').length,
        medium: activeAnomalies.filter(a => a.severity === 'medium').length,
        low: activeAnomalies.filter(a => a.severity === 'low').length,
      },
      anomaliesByType: {
        work_pattern: activeAnomalies.filter(a => a.type === 'work_pattern').length,
        overwork: activeAnomalies.filter(a => a.type === 'overwork').length,
        inactivity: activeAnomalies.filter(a => a.type === 'inactivity').length,
      },
    };

    res.json({
      success: true,
      data: {
        summary,
        anomalies: activeAnomalies,
        recommendations,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get detected anomalies only
 * GET /api/v1/insights/anomalies
 */
export async function getAnomalies(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;

    // Parse query parameters
    const type = req.query.type as string | undefined;
    const severity = req.query.severity as string | undefined;
    const includeDismissed = req.query.includeDismissed === 'true';

    // Get all anomalies
    let anomalies = await anomalyDetector.detectAll(userId);

    // Filter out dismissed unless requested
    if (!includeDismissed) {
      const userDismissed = dismissedAnomalies.get(userId) || new Set();
      anomalies = anomalies.filter(a => !userDismissed.has(a.id));
    }

    // Filter by type if specified
    if (type) {
      anomalies = anomalies.filter(a => a.type === type);
    }

    // Filter by severity if specified
    if (severity) {
      anomalies = anomalies.filter(a => a.severity === severity);
    }

    // Sort by severity (high first) then by detection time (newest first)
    const severityOrder = { high: 0, medium: 1, low: 2 };
    anomalies.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.detectedAt.getTime() - a.detectedAt.getTime();
    });

    res.json({
      success: true,
      data: {
        items: anomalies,
        total: anomalies.length,
        filters: { type, severity, includeDismissed },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get personalized recommendations
 * GET /api/v1/insights/recommendations
 */
export async function getRecommendations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;

    // Parse query parameters
    const type = req.query.type as string | undefined;
    const minPriority = parseInt(req.query.minPriority as string) || 1;

    // Get all recommendations
    let recommendations = await recommendationEngine.getAllRecommendations(userId);

    // Filter by type if specified
    if (type) {
      recommendations = recommendations.filter(r => r.type === type);
    }

    // Filter by minimum priority
    recommendations = recommendations.filter(r => r.priority >= minPriority);

    res.json({
      success: true,
      data: {
        items: recommendations,
        total: recommendations.length,
        filters: { type, minPriority },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get optimal work hours analysis
 * GET /api/v1/insights/optimal-hours
 */
export async function getOptimalHours(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const optimalHours = await recommendationEngine.getOptimalWorkHours(userId);

    res.json({
      success: true,
      data: optimalHours,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get break suggestions
 * GET /api/v1/insights/break-suggestion
 */
export async function getBreakSuggestion(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const breakSuggestion = await recommendationEngine.getBreakSuggestions(userId);

    res.json({
      success: true,
      data: breakSuggestion,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get productivity tips
 * GET /api/v1/insights/productivity-tips
 */
export async function getProductivityTips(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const tips = await recommendationEngine.getProductivityTips(userId);

    res.json({
      success: true,
      data: {
        items: tips,
        total: tips.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dismiss an anomaly
 * POST /api/v1/insights/anomalies/:id/dismiss
 */
export async function dismissAnomaly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const anomalyId = req.params.id;

    // Add to dismissed set
    if (!dismissedAnomalies.has(userId)) {
      dismissedAnomalies.set(userId, new Set());
    }
    dismissedAnomalies.get(userId)!.add(anomalyId);

    res.json({
      success: true,
      data: {
        message: 'Anomaly dismissed successfully',
        anomalyId,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restore a dismissed anomaly
 * POST /api/v1/insights/anomalies/:id/restore
 */
export async function restoreAnomaly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const anomalyId = req.params.id;

    // Remove from dismissed set
    const userDismissed = dismissedAnomalies.get(userId);
    if (userDismissed) {
      userDismissed.delete(anomalyId);
    }

    res.json({
      success: true,
      data: {
        message: 'Anomaly restored successfully',
        anomalyId,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh insights (clear cache and recalculate)
 * POST /api/v1/insights/refresh
 */
export async function refreshInsights(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;

    // Clear caches
    anomalyDetector.clearCache(userId);
    recommendationEngine.clearCache(userId);

    // Recalculate
    const [anomalies, recommendations] = await Promise.all([
      anomalyDetector.detectAll(userId),
      recommendationEngine.getAllRecommendations(userId),
    ]);

    // Filter out dismissed anomalies
    const userDismissed = dismissedAnomalies.get(userId) || new Set();
    const activeAnomalies = anomalies.filter(a => !userDismissed.has(a.id));

    res.json({
      success: true,
      data: {
        message: 'Insights refreshed successfully',
        anomalies: activeAnomalies,
        recommendations,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

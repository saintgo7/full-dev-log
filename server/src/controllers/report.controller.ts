/**
 * Report Controller - DevLog Hub Report API
 * M8-T2: Report Generation Service Implementation
 */

import { Response, NextFunction } from 'express';
import * as reportService from '../services/report.service.js';
import type { AuthRequest } from '../types/index.js';
import type {
  GenerateReportInput,
  ReportFiltersInput,
  ExportFormatInput,
} from '../schemas/report.schema.js';

/**
 * Generate a new report
 * POST /api/v1/reports/generate
 */
export async function generateReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = req.body as GenerateReportInput;
    const report = await reportService.generateReport(req.user!.userId, input);

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's reports list with cursor-based pagination
 * GET /api/v1/reports
 */
export async function getReports(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = req.query as unknown as ReportFiltersInput;
    const result = await reportService.getReports(req.user!.userId, filters);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single report by ID
 * GET /api/v1/reports/:id
 */
export async function getReportById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const report = await reportService.getReportById(req.user!.userId, req.params.id);

    if (!report) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a report
 * DELETE /api/v1/reports/:id
 */
export async function deleteReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const deleted = await reportService.deleteReport(req.user!.userId, req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { message: 'Report deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export a report to markdown, HTML, or JSON
 * GET /api/v1/reports/:id/export
 */
export async function exportReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { format } = req.query as unknown as ExportFormatInput;
    const result = await reportService.exportReport(
      req.user!.userId,
      req.params.id,
      format || 'markdown'
    );

    if (!result) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
      return;
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  } catch (error) {
    next(error);
  }
}

/**
 * Regenerate an existing report with fresh data
 * POST /api/v1/reports/:id/regenerate
 */
export async function regenerateReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const report = await reportService.regenerateReport(req.user!.userId, req.params.id);

    if (!report) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

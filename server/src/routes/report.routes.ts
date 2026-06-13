/**
 * Report Routes - DevLog Hub Report API Endpoints
 * M8-T1 & M8-T2: Report Template Design & Generation Service
 * M8-T6: Report Schedule Routes
 */

import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import * as scheduleController from '../controllers/schedule.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  generateReportSchema,
  reportFiltersSchema,
  exportFormatSchema,
  createScheduleSchema,
  toggleScheduleSchema,
} from '../schemas/report.schema.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/v1/reports/generate - Generate a new report
router.post(
  '/generate',
  validate(generateReportSchema),
  reportController.generateReport
);

// GET /api/v1/reports - Get user's reports list with pagination
router.get(
  '/',
  validate(reportFiltersSchema, 'query'),
  reportController.getReports
);

// GET /api/v1/reports/:id - Get a single report by ID
router.get('/:id', reportController.getReportById);

// DELETE /api/v1/reports/:id - Delete a report
router.delete('/:id', reportController.deleteReport);

// GET /api/v1/reports/:id/export - Export report to markdown, HTML, or JSON
router.get(
  '/:id/export',
  validate(exportFormatSchema, 'query'),
  reportController.exportReport
);

// POST /api/v1/reports/:id/regenerate - Regenerate report with fresh data
router.post('/:id/regenerate', reportController.regenerateReport);

// ==================== Schedule Routes ====================

// POST /api/v1/reports/schedules - Create a new schedule
router.post(
  '/schedules',
  validate(createScheduleSchema),
  scheduleController.createSchedule
);

// GET /api/v1/reports/schedules - Get user's schedules
router.get('/schedules', scheduleController.getSchedules);

// DELETE /api/v1/reports/schedules/:id - Delete a schedule
router.delete('/schedules/:id', scheduleController.deleteSchedule);

// PATCH /api/v1/reports/schedules/:id - Toggle schedule enabled/disabled
router.patch(
  '/schedules/:id',
  validate(toggleScheduleSchema),
  scheduleController.toggleSchedule
);

export default router;

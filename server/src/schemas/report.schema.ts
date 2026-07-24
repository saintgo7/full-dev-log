/**
 * Report Schemas - Zod validation schemas for report API
 * M8-T1 & M8-T2: Report Template Design & Generation Service
 */

import { z } from 'zod';

/**
 * Report type enum
 */
export const reportTypeEnum = z.enum(['daily', 'weekly', 'monthly', 'custom']);

/**
 * Report format enum
 */
export const reportFormatEnum = z.enum(['json', 'markdown', 'html']);

/**
 * Generate report request schema
 * POST /api/v1/reports/generate
 */
export const generateReportSchema = z.object({
  type: reportTypeEnum,
  projectId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    // For custom type, startDate and endDate are required
    if (data.type === 'custom') {
      return data.startDate && data.endDate;
    }
    return true;
  },
  {
    message: 'startDate and endDate are required for custom report type',
    path: ['startDate'],
  }
).refine(
  (data) => {
    // If both dates are provided, startDate must be before endDate
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'startDate must be before or equal to endDate',
    path: ['endDate'],
  }
);

/**
 * Get reports list schema (query parameters)
 * GET /api/v1/reports
 */
export const reportFiltersSchema = z.object({
  type: reportTypeEnum.optional(),
  projectId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Export report format schema (query parameters)
 * GET /api/v1/reports/:id/export
 */
export const exportFormatSchema = z.object({
  format: z.enum(['json', 'markdown', 'html']).default('markdown'),
});

/**
 * Create schedule schema
 * POST /api/v1/reports/schedules
 */
export const createScheduleSchema = z.object({
  reportType: z.enum(['daily', 'weekly', 'monthly']),
  projectId: z.string().uuid().optional(),
  enabled: z.boolean().default(true),
});

/**
 * Toggle schedule schema
 * PATCH /api/v1/reports/schedules/:id
 */
export const toggleScheduleSchema = z.object({
  enabled: z.boolean(),
});

// Type exports
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
export type ExportFormatInput = z.infer<typeof exportFormatSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type ToggleScheduleInput = z.infer<typeof toggleScheduleSchema>;

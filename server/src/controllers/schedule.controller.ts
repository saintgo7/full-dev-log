/**
 * Schedule Controller - M8-T6
 * Handles report schedule API requests
 */

import { Response } from 'express';
import { reportScheduler } from '../services/scheduler.service.js';
import type { AuthRequest } from '../types/index.js';
import type { CreateScheduleInput, ToggleScheduleInput } from '../schemas/report.schema.js';

/**
 * Create a new report schedule
 * POST /api/v1/reports/schedules
 */
export async function createSchedule(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const input = req.body as CreateScheduleInput;

    const schedule = await reportScheduler.createSchedule({
      userId,
      reportType: input.reportType,
      projectId: input.projectId,
      enabled: input.enabled,
    });

    // Get next run time
    const nextRun = reportScheduler.getNextRunTime(schedule.reportType);

    res.status(201).json({
      success: true,
      data: {
        ...schedule,
        nextRun: nextRun?.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create schedule';
    res.status(400).json({
      success: false,
      error: { code: 'SCHEDULE_CREATE_ERROR', message },
    });
  }
}

/**
 * Get user's schedules
 * GET /api/v1/reports/schedules
 */
export async function getSchedules(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const schedules = await reportScheduler.getUserSchedules(userId);

    // Add next run time to each schedule
    const schedulesWithNextRun = schedules.map(schedule => ({
      ...schedule,
      nextRun: schedule.enabled
        ? reportScheduler.getNextRunTime(schedule.reportType)?.toISOString()
        : null,
    }));

    res.json({
      success: true,
      data: schedulesWithNextRun,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SCHEDULE_LIST_ERROR', message: 'Failed to fetch schedules' },
    });
  }
}

/**
 * Delete a schedule
 * DELETE /api/v1/reports/schedules/:id
 */
export async function deleteSchedule(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const scheduleId = req.params.id;

    const deleted = await reportScheduler.deleteSchedule(scheduleId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found' },
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SCHEDULE_DELETE_ERROR', message: 'Failed to delete schedule' },
    });
  }
}

/**
 * Toggle schedule enabled/disabled
 * PATCH /api/v1/reports/schedules/:id
 */
export async function toggleSchedule(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const scheduleId = req.params.id;
    const input = req.body as ToggleScheduleInput;

    const schedule = await reportScheduler.toggleSchedule(scheduleId, userId, input.enabled);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found' },
      });
    }

    // Get next run time if enabled
    const nextRun = schedule.enabled
      ? reportScheduler.getNextRunTime(schedule.reportType)?.toISOString()
      : null;

    res.json({
      success: true,
      data: {
        ...schedule,
        nextRun,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SCHEDULE_TOGGLE_ERROR', message: 'Failed to toggle schedule' },
    });
  }
}

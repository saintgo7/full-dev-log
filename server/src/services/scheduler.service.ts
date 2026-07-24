/**
 * Report Scheduler Service - M8-T6
 * Handles automatic report generation on schedule
 */

import * as cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { generateReport } from './report.service.js';
import { socketManager } from '../websocket/socketManager.js';

// Cron expressions for report types
const CRON_EXPRESSIONS: Record<string, string> = {
  daily: '0 0 * * *',      // Every day at 00:00
  weekly: '0 0 * * 1',     // Every Monday at 00:00
  monthly: '0 0 1 * *',    // First day of month at 00:00
};

// Type for scheduled task
type ScheduledTask = ReturnType<typeof cron.schedule>;

interface ScheduledJob {
  id: string;
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  projectId: string | null;
  enabled: boolean;
  createdAt: Date;
  task?: ScheduledTask;
}

class ReportScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize scheduler and load existing schedules from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⏰ Report scheduler already initialized');
      return;
    }

    try {
      // Load all enabled schedules from database
      const schedules = await prisma.reportSchedule.findMany({
        where: { enabled: true },
      });

      for (const schedule of schedules) {
        await this.startJob({
          id: schedule.id,
          userId: schedule.userId,
          reportType: schedule.reportType as 'daily' | 'weekly' | 'monthly',
          projectId: schedule.projectId,
          enabled: schedule.enabled,
          createdAt: schedule.createdAt,
        });
      }

      this.initialized = true;
      console.log(`⏰ Report scheduler initialized with ${schedules.length} schedule(s)`);
    } catch (error) {
      console.error('Failed to initialize report scheduler:', error);
    }
  }

  /**
   * Start a cron job for a schedule
   */
  private async startJob(schedule: ScheduledJob): Promise<void> {
    const cronExpression = CRON_EXPRESSIONS[schedule.reportType];
    if (!cronExpression) {
      console.error(`Invalid report type: ${schedule.reportType}`);
      return;
    }

    const task = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Running scheduled ${schedule.reportType} report for user ${schedule.userId}`);

      try {
        const report = await generateReport(schedule.userId, {
          type: schedule.reportType,
          projectId: schedule.projectId || undefined,
        });

        // Notify user via WebSocket
        socketManager.broadcastNotification(schedule.userId, {
          type: 'success',
          title: 'Report Generated',
          message: `Your ${schedule.reportType} report is ready`,
          timestamp: new Date(),
        });

        console.log(`✅ Generated scheduled report ${report.id}`);
      } catch (error) {
        console.error(`Failed to generate scheduled report:`, error);

        socketManager.broadcastNotification(schedule.userId, {
          type: 'error',
          title: 'Report Generation Failed',
          message: `Failed to generate your ${schedule.reportType} report`,
          timestamp: new Date(),
        });
      }
    });

    this.jobs.set(schedule.id, { ...schedule, task });
  }

  /**
   * Create a new report schedule
   */
  async createSchedule(params: {
    userId: string;
    reportType: 'daily' | 'weekly' | 'monthly';
    projectId?: string;
    enabled?: boolean;
  }): Promise<ScheduledJob> {
    const { userId, reportType, projectId, enabled = true } = params;

    // Check for existing schedule
    const existing = await prisma.reportSchedule.findFirst({
      where: {
        userId,
        reportType,
        projectId: projectId || null,
      },
    });

    if (existing) {
      throw new Error('Schedule already exists for this configuration');
    }

    // Create database record
    const schedule = await prisma.reportSchedule.create({
      data: {
        userId,
        reportType,
        projectId: projectId || null,
        enabled,
      },
    });

    const job: ScheduledJob = {
      id: schedule.id,
      userId: schedule.userId,
      reportType: schedule.reportType as 'daily' | 'weekly' | 'monthly',
      projectId: schedule.projectId,
      enabled: schedule.enabled,
      createdAt: schedule.createdAt,
    };

    // Start the cron job if enabled
    if (enabled) {
      await this.startJob(job);
    }

    return job;
  }

  /**
   * Delete a report schedule
   */
  async deleteSchedule(scheduleId: string, userId: string): Promise<boolean> {
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, userId },
    });

    if (!schedule) {
      return false;
    }

    // Stop the cron job
    const job = this.jobs.get(scheduleId);
    if (job?.task) {
      job.task.stop();
    }
    this.jobs.delete(scheduleId);

    // Delete from database
    await prisma.reportSchedule.delete({
      where: { id: scheduleId },
    });

    return true;
  }

  /**
   * Toggle schedule enabled/disabled
   */
  async toggleSchedule(scheduleId: string, userId: string, enabled: boolean): Promise<ScheduledJob | null> {
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, userId },
    });

    if (!schedule) {
      return null;
    }

    // Update database
    const updated = await prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: { enabled },
    });

    const job = this.jobs.get(scheduleId);

    if (enabled && !job?.task) {
      // Start the job
      await this.startJob({
        id: updated.id,
        userId: updated.userId,
        reportType: updated.reportType as 'daily' | 'weekly' | 'monthly',
        projectId: updated.projectId,
        enabled: updated.enabled,
        createdAt: updated.createdAt,
      });
    } else if (!enabled && job?.task) {
      // Stop the job
      job.task.stop();
      this.jobs.set(scheduleId, { ...job, task: undefined });
    }

    return this.jobs.get(scheduleId) || {
      id: updated.id,
      userId: updated.userId,
      reportType: updated.reportType as 'daily' | 'weekly' | 'monthly',
      projectId: updated.projectId,
      enabled: updated.enabled,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Get all schedules for a user
   */
  async getUserSchedules(userId: string): Promise<ScheduledJob[]> {
    const schedules = await prisma.reportSchedule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return schedules.map(s => ({
      id: s.id,
      userId: s.userId,
      reportType: s.reportType as 'daily' | 'weekly' | 'monthly',
      projectId: s.projectId,
      enabled: s.enabled,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Get next run time for a schedule type
   */
  getNextRunTime(reportType: string): Date | null {
    const now = new Date();

    switch (reportType) {
      case 'daily':
        // Next midnight
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;

      case 'weekly':
        // Next Monday at midnight
        const nextMonday = new Date(now);
        nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
        nextMonday.setHours(0, 0, 0, 0);
        return nextMonday;

      case 'monthly':
        // First day of next month at midnight
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
        return nextMonth;

      default:
        return null;
    }
  }

  /**
   * Shutdown all scheduled jobs
   */
  shutdown(): void {
    for (const [id, job] of this.jobs) {
      if (job.task) {
        job.task.stop();
        console.log(`⏰ Stopped schedule ${id}`);
      }
    }
    this.jobs.clear();
    this.initialized = false;
    console.log('⏰ Report scheduler shut down');
  }
}

export const reportScheduler = new ReportScheduler();

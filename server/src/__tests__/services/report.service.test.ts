/**
 * Report Service Unit Tests
 * Tests report generation, date range calculation, and export formats
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as reportService from '../../services/report.service.js';
import { prisma } from '../../lib/prisma.js';
import { mockReport, mockEvent, mockEvents } from '../mocks/prisma.mock.js';

describe('Report Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate daily report successfully', async () => {
      const userId = 'user-123';
      const input = {
        type: 'daily' as const,
        projectId: undefined,
        startDate: undefined,
        endDate: undefined,
      };

      const gitEvents = mockEvents(5, { userId, eventType: 'git', eventAction: 'commit' });
      const fileEvents = mockEvents(10, { userId, eventType: 'file' });
      const terminalEvents = mockEvents(15, { userId, eventType: 'terminal' });

      (prisma.event.findMany as jest.Mock)
        .mockResolvedValueOnce(gitEvents)
        .mockResolvedValueOnce(fileEvents)
        .mockResolvedValueOnce(terminalEvents)
        .mockResolvedValueOnce([]) // hourlyDistribution
        .mockResolvedValueOnce([]); // dailyDistribution

      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.create as jest.Mock).mockResolvedValue(
        mockReport({
          userId,
          reportType: 'daily',
          title: 'Daily Report - 2024-01-01',
        })
      );

      const result = await reportService.generateReport(userId, input);

      expect(result).toBeDefined();
      expect(result.type).toBe('daily');
      expect(result.userId).toBe(userId);
      expect(result.summary).toBeDefined();
      expect(result.gitActivity).toBeDefined();
      expect(result.fileActivity).toBeDefined();
      expect(result.terminalActivity).toBeDefined();

      expect(prisma.report.create).toHaveBeenCalled();
    });

    it('should generate weekly report', async () => {
      const userId = 'user-123';
      const input = {
        type: 'weekly' as const,
        projectId: undefined,
        startDate: undefined,
        endDate: undefined,
      };

      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.create as jest.Mock).mockResolvedValue(
        mockReport({ userId, reportType: 'weekly' })
      );

      const result = await reportService.generateReport(userId, input);

      expect(result.type).toBe('weekly');
    });

    it('should generate monthly report', async () => {
      const userId = 'user-123';
      const input = {
        type: 'monthly' as const,
        projectId: undefined,
        startDate: undefined,
        endDate: undefined,
      };

      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.create as jest.Mock).mockResolvedValue(
        mockReport({ userId, reportType: 'monthly' })
      );

      const result = await reportService.generateReport(userId, input);

      expect(result.type).toBe('monthly');
    });

    it('should generate custom date range report', async () => {
      const userId = 'user-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-15T23:59:59Z';
      const input = {
        type: 'custom' as const,
        projectId: undefined,
        startDate,
        endDate,
      };

      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.create as jest.Mock).mockResolvedValue(
        mockReport({
          userId,
          reportType: 'custom',
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
      );

      const result = await reportService.generateReport(userId, input);

      expect(result.type).toBe('custom');
      expect(result.startDate).toEqual(new Date(startDate));
      expect(result.endDate).toEqual(new Date(endDate));
    });

    it('should throw error for custom report without dates', async () => {
      const userId = 'user-123';
      const input = {
        type: 'custom' as const,
        projectId: undefined,
        startDate: undefined,
        endDate: undefined,
      };

      await expect(reportService.generateReport(userId, input)).rejects.toThrow();
    });

    it('should calculate summary statistics correctly', async () => {
      const userId = 'user-123';
      const input = {
        type: 'daily' as const,
        projectId: undefined,
        startDate: undefined,
        endDate: undefined,
      };

      const gitEvents = mockEvents(10, { userId, eventType: 'git', eventAction: 'commit' });
      const fileEvents = mockEvents(20, { userId, eventType: 'file' });
      const terminalEvents = mockEvents(30, { userId, eventType: 'terminal' });

      (prisma.event.findMany as jest.Mock)
        .mockResolvedValueOnce(gitEvents)
        .mockResolvedValueOnce(fileEvents)
        .mockResolvedValueOnce(terminalEvents)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.create as jest.Mock).mockResolvedValue(mockReport({ userId }));

      const result = await reportService.generateReport(userId, input);

      // Total events should be: 10 commits + 20 files + 30 terminal = 60
      expect(result.summary.totalEvents).toBeGreaterThanOrEqual(60);
      expect(result.summary.productivity).toBeGreaterThanOrEqual(0);
      expect(result.summary.productivity).toBeLessThanOrEqual(100);
    });

    it('should include project name in report when projectId provided', async () => {
      const userId = 'user-123';
      const projectId = 'project-123';
      const input = {
        type: 'daily' as const,
        projectId,
        startDate: undefined,
        endDate: undefined,
      };

      (prisma.project.findFirst as jest.Mock).mockResolvedValue({
        id: projectId,
        name: 'Test Project',
      });
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.report.create as jest.Mock).mockResolvedValue(
        mockReport({ userId, projectId })
      );

      const result = await reportService.generateReport(userId, input);

      expect(result.projectId).toBe(projectId);
      expect(result.projectName).toBe('Test Project');
    });
  });

  describe('getReports', () => {
    it('should return paginated reports', async () => {
      const userId = 'user-123';
      const filters = {
        limit: 20,
      };

      const reports = Array.from({ length: 15 }, (_, i) =>
        mockReport({
          id: `report-${i + 1}`,
          userId,
        })
      );

      (prisma.report.findMany as jest.Mock).mockResolvedValue(reports);
      (prisma.report.count as jest.Mock).mockResolvedValue(15);

      const result = await reportService.getReports(userId, filters);

      expect(result.items).toHaveLength(15);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.total).toBe(15);
    });

    it('should filter reports by type', async () => {
      const userId = 'user-123';
      const filters = {
        type: 'daily' as const,
        limit: 20,
      };

      const dailyReports = [
        mockReport({ userId, reportType: 'daily' }),
        mockReport({ userId, reportType: 'daily' }),
      ];

      (prisma.report.findMany as jest.Mock).mockResolvedValue(dailyReports);
      (prisma.report.count as jest.Mock).mockResolvedValue(2);

      const result = await reportService.getReports(userId, filters);

      expect(result.items).toHaveLength(2);
      expect(result.items.every((r) => r.reportType === 'daily')).toBe(true);
    });

    it('should filter reports by projectId', async () => {
      const userId = 'user-123';
      const projectId = 'project-123';
      const filters = {
        projectId,
        limit: 20,
      };

      const projectReports = [mockReport({ userId, projectId })];

      (prisma.report.findMany as jest.Mock).mockResolvedValue(projectReports);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      const result = await reportService.getReports(userId, filters);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].projectId).toBe(projectId);
    });

    it('should handle cursor-based pagination', async () => {
      const userId = 'user-123';
      const filters = {
        cursor: 'report-10',
        limit: 10,
      };

      const reports = Array.from({ length: 11 }, (_, i) =>
        mockReport({ id: `report-${i + 11}`, userId })
      );

      (prisma.report.findMany as jest.Mock).mockResolvedValue(reports);
      (prisma.report.count as jest.Mock).mockResolvedValue(50);

      const result = await reportService.getReports(userId, filters);

      expect(result.items).toHaveLength(10);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.cursor).toBe('report-20');
    });
  });

  describe('getReportById', () => {
    it('should return report by id', async () => {
      const userId = 'user-123';
      const reportId = 'report-123';
      const report = mockReport({ id: reportId, userId });

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(report);

      const result = await reportService.getReportById(userId, reportId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(reportId);
      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: { id: reportId, userId },
        include: expect.any(Object),
      });
    });

    it('should return null if report not found', async () => {
      const userId = 'user-123';
      const reportId = 'nonexistent';

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await reportService.getReportById(userId, reportId);

      expect(result).toBeNull();
    });
  });

  describe('deleteReport', () => {
    it('should delete report successfully', async () => {
      const userId = 'user-123';
      const reportId = 'report-123';
      const report = mockReport({ id: reportId, userId });

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(report);
      (prisma.report.delete as jest.Mock).mockResolvedValue(report);

      const result = await reportService.deleteReport(userId, reportId);

      expect(result).toBe(true);
      expect(prisma.report.delete).toHaveBeenCalledWith({
        where: { id: reportId },
      });
    });

    it('should return false if report not found', async () => {
      const userId = 'user-123';
      const reportId = 'nonexistent';

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await reportService.deleteReport(userId, reportId);

      expect(result).toBe(false);
      expect(prisma.report.delete).not.toHaveBeenCalled();
    });
  });

  describe('exportReport', () => {
    it('should export report as JSON', async () => {
      const userId = 'user-123';
      const reportId = 'report-123';
      const report = mockReport({ id: reportId, userId });

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(report);

      const result = await reportService.exportReport(userId, reportId, 'json');

      expect(result).toBeDefined();
      expect(result?.contentType).toBe('application/json');
      expect(result?.filename).toBe(`report-${reportId}.json`);
      expect(result?.content).toContain('"type"');
    });

    it('should export report as Markdown', async () => {
      const userId = 'user-123';
      const reportId = 'report-123';
      const report = mockReport({ id: reportId, userId });

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(report);

      const result = await reportService.exportReport(userId, reportId, 'markdown');

      expect(result).toBeDefined();
      expect(result?.contentType).toBe('text/markdown');
      expect(result?.filename).toBe(`report-${reportId}.md`);
      expect(result?.content).toContain('#');
    });

    it('should export report as HTML', async () => {
      const userId = 'user-123';
      const reportId = 'report-123';
      const report = mockReport({ id: reportId, userId });

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(report);

      const result = await reportService.exportReport(userId, reportId, 'html');

      expect(result).toBeDefined();
      expect(result?.contentType).toBe('text/html');
      expect(result?.filename).toBe(`report-${reportId}.html`);
      expect(result?.content).toContain('<!DOCTYPE html>');
      expect(result?.content).toContain('<html');
    });

    it('should return null if report not found', async () => {
      const userId = 'user-123';
      const reportId = 'nonexistent';

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await reportService.exportReport(userId, reportId, 'json');

      expect(result).toBeNull();
    });
  });

  describe('regenerateReport', () => {
    it('should regenerate existing report', async () => {
      const userId = 'user-123';
      const reportId = 'report-123';
      const existingReport = mockReport({ id: reportId, userId });

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(existingReport);
      (prisma.report.delete as jest.Mock).mockResolvedValue(existingReport);

      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.create as jest.Mock).mockResolvedValue(
        mockReport({ id: 'new-report-id', userId })
      );

      const result = await reportService.regenerateReport(userId, reportId);

      expect(result).toBeDefined();
      expect(prisma.report.delete).toHaveBeenCalledWith({
        where: { id: reportId },
      });
      expect(prisma.report.create).toHaveBeenCalled();
    });

    it('should return null if report not found', async () => {
      const userId = 'user-123';
      const reportId = 'nonexistent';

      (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await reportService.regenerateReport(userId, reportId);

      expect(result).toBeNull();
      expect(prisma.report.delete).not.toHaveBeenCalled();
    });
  });
});

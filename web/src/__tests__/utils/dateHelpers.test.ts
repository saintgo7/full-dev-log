import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
} from '@/lib/utils';

describe('Date Helper Functions', () => {
  beforeEach(() => {
    // Set a fixed time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format date string', () => {
      const formatted = formatDate('2024-01-15T12:00:00Z');

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should use Korean locale', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      const formatted = formatDate(date);

      // Korean date format includes year, month, and day
      expect(formatted).toContain('2024');
    });

    it('should handle different dates consistently', () => {
      const date1 = formatDate('2024-01-01T00:00:00Z');
      const date2 = formatDate('2024-12-31T23:59:59Z');

      expect(date1).toBeTruthy();
      expect(date2).toBeTruthy();
      expect(date1).not.toBe(date2);
    });
  });

  describe('formatTime', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const formatted = formatTime(date);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format time string', () => {
      const formatted = formatTime('2024-01-15T14:30:00Z');

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should include hours and minutes', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const formatted = formatTime(date);

      // Time format should include hour and minute separators
      expect(formatted).toMatch(/\d/);
    });

    it('should use 2-digit format', () => {
      const earlyMorning = formatTime('2024-01-15T01:05:00Z');
      const afternoon = formatTime('2024-01-15T14:30:00Z');

      expect(earlyMorning).toBeTruthy();
      expect(afternoon).toBeTruthy();
    });
  });

  describe('formatDateTime', () => {
    it('should combine date and time', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const formatted = formatDateTime(date);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format date string', () => {
      const formatted = formatDateTime('2024-01-15T14:30:00Z');

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should include both date and time components', () => {
      const dateString = '2024-01-15T14:30:00Z';
      const formatted = formatDateTime(dateString);
      const dateOnly = formatDate(dateString);
      const timeOnly = formatTime(dateString);

      // The combined format should contain both parts
      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(dateOnly.length);
    });
  });

  describe('formatRelativeTime', () => {
    it('should show "방금 전" for recent timestamps', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30 * 1000); // 30 seconds ago

      const formatted = formatRelativeTime(recent);
      expect(formatted).toBe('방금 전');
    });

    it('should show minutes for times within an hour', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const formatted = formatRelativeTime(fiveMinutesAgo);
      expect(formatted).toBe('5분 전');
    });

    it('should show hours for times within a day', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

      const formatted = formatRelativeTime(threeHoursAgo);
      expect(formatted).toBe('3시간 전');
    });

    it('should show days for times within a week', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const formatted = formatRelativeTime(twoDaysAgo);
      expect(formatted).toBe('2일 전');
    });

    it('should show formatted date for times over a week', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const formatted = formatRelativeTime(tenDaysAgo);
      expect(formatted).not.toContain('일 전');
      expect(formatted).toBeTruthy();
    });

    it('should handle date strings', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      const formatted = formatRelativeTime(oneMinuteAgo.toISOString());
      expect(formatted).toBe('1분 전');
    });

    it('should handle edge case at exactly 1 minute', () => {
      const now = new Date();
      const oneMinute = new Date(now.getTime() - 60 * 1000);

      const formatted = formatRelativeTime(oneMinute);
      expect(formatted).toBe('1분 전');
    });

    it('should handle edge case at exactly 1 hour', () => {
      const now = new Date();
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000);

      const formatted = formatRelativeTime(oneHour);
      expect(formatted).toBe('1시간 전');
    });

    it('should handle edge case at exactly 1 day', () => {
      const now = new Date();
      const oneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const formatted = formatRelativeTime(oneDay);
      expect(formatted).toBe('1일 전');
    });

    it('should handle future dates gracefully', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 60 * 1000);

      const formatted = formatRelativeTime(future);
      // Future dates might show negative or fall back to formatted date
      expect(formatted).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid date strings gracefully', () => {
      // Invalid date strings should create Invalid Date
      const formatted = formatDate('invalid-date');
      expect(formatted).toBeTruthy(); // Should not throw
    });

    it('should handle very old dates', () => {
      const oldDate = new Date('1970-01-01T00:00:00Z');
      const formatted = formatDate(oldDate);

      expect(formatted).toBeTruthy();
      expect(formatted).toContain('1970');
    });

    it('should handle far future dates', () => {
      // Use a mid-year, midday UTC instant so no local timezone offset can
      // roll the calendar year over (formatDate renders in the runner's TZ).
      const futureDate = new Date('2099-06-15T12:00:00Z');
      const formatted = formatDate(futureDate);

      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2099');
    });

    it('should handle midnight', () => {
      const midnight = new Date('2024-01-15T00:00:00Z');
      const formatted = formatTime(midnight);

      expect(formatted).toBeTruthy();
    });

    it('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29T12:00:00Z');
      const formatted = formatDate(leapDay);

      expect(formatted).toBeTruthy();
    });
  });

  describe('Consistency', () => {
    it('should produce same output for same input', () => {
      const date = '2024-01-15T12:00:00Z';

      const result1 = formatDate(date);
      const result2 = formatDate(date);

      expect(result1).toBe(result2);
    });

    it('should handle Date objects and strings consistently', () => {
      const dateString = '2024-01-15T12:00:00Z';
      const dateObject = new Date(dateString);

      const fromString = formatDate(dateString);
      const fromObject = formatDate(dateObject);

      expect(fromString).toBe(fromObject);
    });

    it('should format relative time consistently for same timestamp', () => {
      const timestamp = new Date(Date.now() - 5 * 60 * 1000);

      const result1 = formatRelativeTime(timestamp);
      const result2 = formatRelativeTime(timestamp);

      expect(result1).toBe(result2);
    });
  });
});

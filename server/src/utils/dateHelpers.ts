/**
 * Date Helpers - DevLog Hub Date Utilities
 * M13-T1: Consistent date handling for database queries
 */

/**
 * Supported time periods for date range queries
 */
export type TimePeriod =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'last365days';

/**
 * Report type periods (matching ReportType enum)
 */
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Date range result
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Get the start and end of today in UTC
 *
 * @returns Date range for today
 */
export function getToday(): DateRange {
  const now = new Date();
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get the start and end of yesterday in UTC
 *
 * @returns Date range for yesterday
 */
export function getYesterday(): DateRange {
  const now = new Date();
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - 1,
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - 1,
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get the start and end of the current week (Monday to Sunday) in UTC
 *
 * @returns Date range for this week
 */
export function getThisWeek(): DateRange {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  // Adjust for Monday start (0 = Sunday, so Monday = 1)
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - diff,
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + (6 - diff),
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get the start and end of last week in UTC
 *
 * @returns Date range for last week
 */
export function getLastWeek(): DateRange {
  const thisWeek = getThisWeek();
  const start = new Date(thisWeek.start.getTime() - 7 * 24 * 60 * 60 * 1000);
  const end = new Date(thisWeek.end.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Get the start and end of the current month in UTC
 *
 * @returns Date range for this month
 */
export function getThisMonth(): DateRange {
  const now = new Date();
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1,
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    0, // Day 0 of next month = last day of current month
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get the start and end of last month in UTC
 *
 * @returns Date range for last month
 */
export function getLastMonth(): DateRange {
  const now = new Date();
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() - 1,
    1,
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    0, // Day 0 of current month = last day of last month
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get the start and end of the current quarter in UTC
 *
 * @returns Date range for this quarter
 */
export function getThisQuarter(): DateRange {
  const now = new Date();
  const currentQuarter = Math.floor(now.getUTCMonth() / 3);
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    currentQuarter * 3,
    1,
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    currentQuarter * 3 + 3,
    0,
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get the start and end of last quarter in UTC
 *
 * @returns Date range for last quarter
 */
export function getLastQuarter(): DateRange {
  const now = new Date();
  const currentQuarter = Math.floor(now.getUTCMonth() / 3);
  const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
  const year = currentQuarter === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();

  const start = new Date(Date.UTC(
    year,
    lastQuarter * 3,
    1,
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    year,
    lastQuarter * 3 + 3,
    0,
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get the start and end of the current year in UTC
 *
 * @returns Date range for this year
 */
export function getThisYear(): DateRange {
  const now = new Date();
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    0, 1,
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    11, 31,
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get the start and end of last year in UTC
 *
 * @returns Date range for last year
 */
export function getLastYear(): DateRange {
  const now = new Date();
  const start = new Date(Date.UTC(
    now.getUTCFullYear() - 1,
    0, 1,
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    now.getUTCFullYear() - 1,
    11, 31,
    23, 59, 59, 999
  ));
  return { start, end };
}

/**
 * Get a date range for the last N days from now
 *
 * @param days - Number of days to go back
 * @returns Date range for the last N days
 */
export function getLastNDays(days: number): DateRange {
  const now = new Date();
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 59, 59, 999
  ));
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

/**
 * Get date range for a named time period
 *
 * @param period - Named time period
 * @returns Date range for the period
 *
 * @example
 * const { start, end } = getDateRangeForPeriod('thisWeek');
 */
export function getDateRangeForPeriod(period: TimePeriod): DateRange {
  switch (period) {
    case 'today':
      return getToday();
    case 'yesterday':
      return getYesterday();
    case 'thisWeek':
      return getThisWeek();
    case 'lastWeek':
      return getLastWeek();
    case 'thisMonth':
      return getThisMonth();
    case 'lastMonth':
      return getLastMonth();
    case 'thisQuarter':
      return getThisQuarter();
    case 'lastQuarter':
      return getLastQuarter();
    case 'thisYear':
      return getThisYear();
    case 'lastYear':
      return getLastYear();
    case 'last7days':
      return getLastNDays(7);
    case 'last30days':
      return getLastNDays(30);
    case 'last90days':
      return getLastNDays(90);
    case 'last365days':
      return getLastNDays(365);
    default:
      return getLastNDays(7); // Default to last 7 days
  }
}

/**
 * Get date range for report type (daily, weekly, monthly, yearly)
 *
 * @param type - Report period type
 * @returns Date range for the report period
 */
export function getDateRangeForReportType(type: ReportPeriod): DateRange {
  switch (type) {
    case 'daily':
      return getYesterday(); // Reports are typically for completed periods
    case 'weekly':
      return getLastWeek();
    case 'monthly':
      return getLastMonth();
    case 'yearly':
      return getLastYear();
    default:
      return getLastWeek();
  }
}

/**
 * Convert a date to UTC, preserving the local date/time values
 *
 * @param date - Date to convert
 * @returns UTC date
 */
export function toUTC(date: Date | string): Date {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  ));
}

/**
 * Convert a UTC date to local timezone, preserving the UTC values as local
 *
 * @param date - UTC date to convert
 * @returns Local date
 */
export function fromUTC(date: Date | string): Date {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  );
}

/**
 * Get the start of day for a given date in UTC
 *
 * @param date - Input date
 * @returns Start of day (00:00:00.000 UTC)
 */
export function startOfDayUTC(date: Date | string): Date {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    0, 0, 0, 0
  ));
}

/**
 * Get the end of day for a given date in UTC
 *
 * @param date - Input date
 * @returns End of day (23:59:59.999 UTC)
 */
export function endOfDayUTC(date: Date | string): Date {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    23, 59, 59, 999
  ));
}

/**
 * Format date as YYYY-MM-DD string
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date as human-readable string
 *
 * @param date - Date to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDateReadable(
  date: Date,
  locale: string = 'en-US'
): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time as human-readable string
 *
 * @param date - Date to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted datetime string
 */
export function formatDateTimeReadable(
  date: Date,
  locale: string = 'en-US'
): string {
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get the number of days between two dates
 *
 * @param start - Start date
 * @param end - End date
 * @returns Number of days
 */
export function daysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

/**
 * Check if a date is within a date range
 *
 * @param date - Date to check
 * @param range - Date range
 * @returns True if date is within range
 */
export function isWithinRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

/**
 * Add days to a date
 *
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Add months to a date
 *
 * @param date - Base date
 * @param months - Number of months to add (can be negative)
 * @returns New date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/**
 * Get an array of dates for each day in a range
 *
 * @param range - Date range
 * @returns Array of dates
 */
export function getDateArray(range: DateRange): Date[] {
  const dates: Date[] = [];
  const current = new Date(range.start);

  while (current <= range.end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Group dates by week, month, or year
 *
 * @param dates - Array of dates with associated data
 * @param groupBy - Grouping period
 * @returns Grouped data
 */
export function groupDatesByPeriod<T extends { date: Date }>(
  data: T[],
  groupBy: 'week' | 'month' | 'year'
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  data.forEach(item => {
    let key: string;

    switch (groupBy) {
      case 'week':
        const weekStart = new Date(item.date);
        const dayOfWeek = weekStart.getUTCDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setUTCDate(weekStart.getUTCDate() - diff);
        key = formatDateISO(weekStart);
        break;
      case 'month':
        key = `${item.date.getUTCFullYear()}-${String(item.date.getUTCMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(item.date.getUTCFullYear());
        break;
    }

    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  });

  return groups;
}

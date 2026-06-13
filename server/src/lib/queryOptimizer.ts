/**
 * Query Optimizer - DevLog Hub Database Performance Utilities
 * M13-T1: Query optimization helpers for Prisma
 */

import { Prisma } from '@prisma/client';

/**
 * Type for model field selection
 */
export type SelectFields<T> = Partial<Record<keyof T, boolean>>;

/**
 * Cursor-based pagination options
 */
export interface PaginationOptions {
  cursor?: string;
  limit: number;
  cursorField?: string;
}

/**
 * Pagination result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    total?: number;
  };
}

/**
 * Helper to create a select object with only needed fields
 * Reduces data transfer and memory usage
 *
 * @param fields - Array of field names to select
 * @returns Select object for Prisma query
 *
 * @example
 * const select = selectFields(['id', 'title', 'createdAt']);
 * // Returns: { id: true, title: true, createdAt: true }
 */
export function selectFields<T extends string>(
  fields: T[]
): Record<T, true> {
  return fields.reduce(
    (acc, field) => ({ ...acc, [field]: true }),
    {} as Record<T, true>
  );
}

/**
 * Helper for cursor-based pagination
 * More efficient than offset-based pagination for large datasets
 *
 * @param options - Pagination options
 * @returns Prisma query options for pagination
 *
 * @example
 * const paginationOpts = paginateQuery({ cursor: 'abc123', limit: 20 });
 * const results = await prisma.event.findMany({
 *   ...paginationOpts,
 *   where: { userId }
 * });
 */
export function paginateQuery(options: PaginationOptions): {
  take: number;
  skip?: number;
  cursor?: { id: string };
} {
  const { cursor, limit } = options;

  const result: {
    take: number;
    skip?: number;
    cursor?: { id: string };
  } = {
    take: limit + 1, // Fetch one extra to check if there are more
  };

  if (cursor) {
    result.cursor = { id: cursor };
    result.skip = 1; // Skip the cursor item itself
  }

  return result;
}

/**
 * Process paginated results and extract pagination metadata
 *
 * @param items - Raw query results
 * @param limit - Requested limit
 * @param total - Optional total count
 * @returns Paginated result with metadata
 */
export function processPaginatedResults<T extends { id: string }>(
  items: T[],
  limit: number,
  total?: number
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const processedItems = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore && processedItems.length > 0
    ? processedItems[processedItems.length - 1].id
    : null;

  return {
    items: processedItems,
    pagination: {
      cursor: nextCursor,
      hasMore,
      ...(total !== undefined && { total }),
    },
  };
}

/**
 * DataLoader-style batch loader to prevent N+1 queries
 * Groups multiple ID lookups into a single query
 *
 * @param ids - Array of IDs to load
 * @param loader - Function that loads items by IDs
 * @returns Map of ID to loaded item
 *
 * @example
 * const userMap = await batchLoader(userIds, async (ids) => {
 *   const users = await prisma.user.findMany({ where: { id: { in: ids } } });
 *   return users;
 * });
 */
export async function batchLoader<T extends { id: string }>(
  ids: string[],
  loader: (ids: string[]) => Promise<T[]>
): Promise<Map<string, T>> {
  // Remove duplicates
  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const items = await loader(uniqueIds);

  return new Map(items.map((item) => [item.id, item]));
}

/**
 * Create optimized where clause for date range queries
 * Uses indexed timestamp fields efficiently
 *
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @param timestampField - Field name for timestamp
 * @returns Where clause object
 */
export function dateRangeWhere(
  dateFrom?: Date | string,
  dateTo?: Date | string,
  timestampField: string = 'localTimestamp'
): Record<string, { gte?: Date; lte?: Date }> | undefined {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const where: { gte?: Date; lte?: Date } = {};

  if (dateFrom) {
    where.gte = dateFrom instanceof Date ? dateFrom : new Date(dateFrom);
  }

  if (dateTo) {
    where.lte = dateTo instanceof Date ? dateTo : new Date(dateTo);
  }

  return { [timestampField]: where };
}

/**
 * Build optimized event filters
 * Combines multiple filter conditions efficiently
 *
 * @param filters - Filter options
 * @returns Prisma where clause
 */
export interface EventFilterOptions {
  userId: string;
  projectId?: string;
  eventType?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  search?: string;
}

export function buildEventFilters(
  options: EventFilterOptions
): Prisma.EventWhereInput {
  const { userId, projectId, eventType, dateFrom, dateTo, search } = options;

  const where: Prisma.EventWhereInput = { userId };

  if (projectId) {
    where.projectId = projectId;
  }

  if (eventType) {
    where.eventType = eventType as Prisma.EnumEventTypeFilter;
  }

  const dateRange = dateRangeWhere(dateFrom, dateTo);
  if (dateRange) {
    where.localTimestamp = dateRange.localTimestamp;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

/**
 * Create a chunked batch processor for large datasets
 * Processes items in chunks to avoid memory issues
 *
 * @param items - Array of items to process
 * @param chunkSize - Size of each chunk
 * @param processor - Async function to process each chunk
 * @returns Combined results from all chunks
 */
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Optimized select presets for common models
 */
export const selectPresets = {
  // Event minimal fields for list views
  eventList: selectFields([
    'id',
    'eventType',
    'eventAction',
    'title',
    'localTimestamp',
    'projectId',
  ]),

  // Event with content for detail views
  eventDetail: selectFields([
    'id',
    'eventType',
    'eventAction',
    'title',
    'content',
    'metadata',
    'filePath',
    'gitBranch',
    'gitCommitHash',
    'localTimestamp',
    'serverTimestamp',
    'projectId',
    'agentId',
  ]),

  // Notification minimal fields
  notificationList: selectFields([
    'id',
    'type',
    'title',
    'message',
    'read',
    'createdAt',
  ]),

  // Report list fields
  reportList: selectFields([
    'id',
    'reportType',
    'title',
    'startDate',
    'endDate',
    'status',
    'createdAt',
  ]),

  // User minimal fields for references
  userMinimal: selectFields(['id', 'name', 'email']),

  // Project minimal fields for references
  projectMinimal: selectFields(['id', 'name']),

  // Agent minimal fields for references
  agentMinimal: selectFields(['id', 'name']),
};

/**
 * Optimized include presets for common relations
 */
export const includePresets = {
  // Event with minimal relations
  eventWithRelations: {
    project: { select: selectPresets.projectMinimal },
    agent: { select: selectPresets.agentMinimal },
  },

  // Report with project relation
  reportWithProject: {
    project: { select: selectPresets.projectMinimal },
  },

  // Notification with user
  notificationWithUser: {
    user: { select: selectPresets.userMinimal },
  },
};

/**
 * Query performance hints for common operations
 */
export const queryHints = {
  /**
   * For timeline queries (most recent first):
   * - Use composite index: (userId, localTimestamp DESC)
   * - Always include ORDER BY with the indexed column
   * - Use cursor-based pagination
   */
  timeline: {
    orderBy: { localTimestamp: 'desc' as const },
  },

  /**
   * For statistics/aggregation:
   * - Use groupBy with indexed columns
   * - Prefer raw SQL for complex aggregations
   * - Limit date ranges to reduce scan size
   */
  aggregation: {
    // Use with prisma.$queryRaw for complex aggregations
  },

  /**
   * For search queries:
   * - Consider full-text search indexes for large datasets
   * - Limit results with take
   * - Use indexed columns in WHERE before text search
   */
  search: {
    // Always filter by indexed column (userId) first
  },
};

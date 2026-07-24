import { z } from 'zod';

const eventTypeEnum = z.enum(['git', 'file', 'terminal', 'manual']);

export const createEventSchema = z.object({
  eventType: eventTypeEnum,
  eventAction: z.string().min(1).max(50),
  title: z.string().max(500).optional(),
  content: z.string().max(50000).optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  filePath: z.string().max(1000).optional(),
  gitBranch: z.string().max(200).optional(),
  gitCommitHash: z.string().length(40).optional(),
  localTimestamp: z.string().datetime(),
});

export const createEventBatchSchema = z.object({
  events: z.array(createEventSchema).min(1).max(100),
});

export const eventFiltersSchema = z.object({
  projectId: z.string().uuid().optional(),
  eventType: eventTypeEnum.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateEventBatchInput = z.infer<typeof createEventBatchSchema>;
export type EventFiltersInput = z.infer<typeof eventFiltersSchema>;

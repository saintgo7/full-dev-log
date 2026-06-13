import { z } from 'zod';

// IDE Instance Types
export const ideTypeSchema = z.enum([
  'vscode',
  'cursor',
  'jetbrains',
  'vim',
  'neovim',
  'emacs',
  'sublime',
  'atom',
  'other'
]);

// Register IDE Input
export const registerIdeSchema = z.object({
  ideName: z.string().min(1).max(100),
  ideType: ideTypeSchema,
  ideVersion: z.string().max(50).optional(),
  extensionVersion: z.string().max(50).optional(),
  workspacePath: z.string().max(500).optional(),
  workspaceName: z.string().max(200).optional(),
  machineId: z.string().max(200).optional(),
  os: z.enum(['darwin', 'windows', 'linux']).optional(),
});

// Heartbeat Input
export const heartbeatSchema = z.object({
  ideInstanceId: z.string().uuid(),
  activeFile: z.string().max(500).optional(),
  activeLanguage: z.string().max(50).optional(),
  workspacePath: z.string().max(500).optional(),
});

// IDE Event Types
export const ideEventTypeSchema = z.enum([
  'file_open',
  'file_close',
  'file_save',
  'file_edit',
  'debug_start',
  'debug_stop',
  'terminal_command',
  'extension_install',
  'extension_uninstall',
  'build_start',
  'build_complete',
  'test_start',
  'test_complete',
  'error',
  'warning',
  'git_operation',
  'refactor',
  'search',
  'navigation',
  'other'
]);

// Single IDE Event
export const ideEventSchema = z.object({
  eventType: ideEventTypeSchema,
  eventAction: z.string().max(100),
  title: z.string().max(500).optional(),
  content: z.string().max(10000).optional(),
  filePath: z.string().max(500).optional(),
  language: z.string().max(50).optional(),
  lineNumber: z.number().int().positive().optional(),
  columnNumber: z.number().int().positive().optional(),
  duration: z.number().int().nonnegative().optional(), // milliseconds
  metadata: z.record(z.unknown()).optional(),
  localTimestamp: z.string().datetime(),
});

// Batch Events Input
export const batchEventsSchema = z.object({
  ideInstanceId: z.string().uuid(),
  events: z.array(ideEventSchema).min(1).max(100),
});

// Disconnect Input
export const disconnectSchema = z.object({
  ideInstanceId: z.string().uuid(),
  reason: z.string().max(200).optional(),
});

// Query params for stats
export const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
  ideInstanceId: z.string().uuid().optional(),
});

// Types export
export type IdeType = z.infer<typeof ideTypeSchema>;
export type RegisterIdeInput = z.infer<typeof registerIdeSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type IdeEventType = z.infer<typeof ideEventTypeSchema>;
export type IdeEventInput = z.infer<typeof ideEventSchema>;
export type BatchEventsInput = z.infer<typeof batchEventsSchema>;
export type DisconnectInput = z.infer<typeof disconnectSchema>;
export type StatsQueryInput = z.infer<typeof statsQuerySchema>;

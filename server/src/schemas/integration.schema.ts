import { z } from 'zod';

// Valid integration types
export const integrationTypeSchema = z.enum(['slack', 'discord']);
export type IntegrationType = z.infer<typeof integrationTypeSchema>;

// Valid event types that can be subscribed to
export const integrationEventSchema = z.enum([
  'member_joined',
  'member_left',
  'member_role_changed',
  'note_created',
  'note_shared',
  'note_updated',
  'note_deleted',
  'comment_added',
  'project_added',
  'project_removed',
  'report_ready',
  'milestone_reached',
]);
export type IntegrationEventType = z.infer<typeof integrationEventSchema>;

// Webhook URL validation
// Slack webhooks: https://hooks.slack.com/services/...
// Discord webhooks: https://discord.com/api/webhooks/... or https://discordapp.com/api/webhooks/...
const webhookUrlSchema = z.string().url('Invalid URL format').refine(
  (url) => {
    try {
      const parsed = new URL(url);
      // Check for Slack webhook URL pattern
      const isSlack = parsed.hostname === 'hooks.slack.com' &&
                      parsed.pathname.startsWith('/services/');

      // Check for Discord webhook URL pattern
      const isDiscord = (parsed.hostname === 'discord.com' ||
                         parsed.hostname === 'discordapp.com') &&
                        parsed.pathname.startsWith('/api/webhooks/');

      return isSlack || isDiscord;
    } catch {
      return false;
    }
  },
  {
    message: 'Webhook URL must be a valid Slack or Discord webhook URL',
  }
);

// Create integration schema
export const createIntegrationSchema = z.object({
  type: integrationTypeSchema,
  webhookUrl: webhookUrlSchema,
  name: z
    .string()
    .min(1, 'Integration name is required')
    .max(100, 'Integration name too long'),
  enabled: z.boolean().optional().default(true),
  events: z
    .array(integrationEventSchema)
    .min(1, 'At least one event must be selected')
    .refine(
      (events) => new Set(events).size === events.length,
      { message: 'Duplicate events are not allowed' }
    ),
});
export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;

// Update integration schema (all fields optional)
export const updateIntegrationSchema = z.object({
  webhookUrl: webhookUrlSchema.optional(),
  name: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  events: z
    .array(integrationEventSchema)
    .min(1, 'At least one event must be selected')
    .refine(
      (events) => new Set(events).size === events.length,
      { message: 'Duplicate events are not allowed' }
    )
    .optional(),
});
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;

// Query params for listing integrations
export const listIntegrationsQuerySchema = z.object({
  type: integrationTypeSchema.optional(),
  enabled: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});
export type ListIntegrationsQuery = z.infer<typeof listIntegrationsQuerySchema>;

// Path params
export const integrationIdParamSchema = z.object({
  id: z.string().uuid('Invalid integration ID'),
});
export type IntegrationIdParam = z.infer<typeof integrationIdParamSchema>;

export const teamIdParamSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
});
export type TeamIdParam = z.infer<typeof teamIdParamSchema>;

// Combined params for team integration routes
export const teamIntegrationParamsSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  id: z.string().uuid('Invalid integration ID'),
});
export type TeamIntegrationParams = z.infer<typeof teamIntegrationParamsSchema>;

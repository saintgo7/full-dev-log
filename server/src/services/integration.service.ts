/**
 * Integration Service - Manages external integrations (Slack, Discord)
 * Provides CRUD operations and event triggering for webhooks
 */

import { prisma } from '../lib/prisma.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors.js';
import { webhookService, WebhookEventData } from './webhook.service.js';
import type {
  CreateIntegrationInput,
  UpdateIntegrationInput,
} from '../schemas/integration.schema.js';

// Valid event types that can be subscribed to
export const VALID_EVENTS = [
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
] as const;

export type IntegrationEvent = (typeof VALID_EVENTS)[number];

/**
 * IntegrationService class for managing external integrations
 */
export class IntegrationService {
  /**
   * Verify user has admin/owner access to the team
   */
  private async verifyTeamAdmin(teamId: string, userId: string): Promise<void> {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      throw new AuthorizationError('Only team owner or admin can manage integrations');
    }
  }

  /**
   * Verify user is a member of the team
   */
  private async verifyTeamMember(teamId: string, userId: string): Promise<void> {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!membership) {
      throw new AuthorizationError('You are not a member of this team');
    }
  }

  /**
   * Get team details for webhook messages
   */
  private async getTeamDetails(teamId: string): Promise<{ name: string } | null> {
    return prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });
  }

  /**
   * Create a new integration for a team
   */
  async createIntegration(
    teamId: string,
    userId: string,
    input: CreateIntegrationInput
  ) {
    // Verify admin access
    await this.verifyTeamAdmin(teamId, userId);

    // Validate events
    const invalidEvents = input.events.filter(
      (e) => !VALID_EVENTS.includes(e as IntegrationEvent)
    );
    if (invalidEvents.length > 0) {
      throw new ValidationError(`Invalid events: ${invalidEvents.join(', ')}`);
    }

    const integration = await prisma.integration.create({
      data: {
        teamId,
        type: input.type,
        webhookUrl: input.webhookUrl,
        name: input.name,
        enabled: input.enabled ?? true,
        events: input.events,
        createdBy: userId,
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    });

    return integration;
  }

  /**
   * Update an existing integration
   */
  async updateIntegration(
    integrationId: string,
    userId: string,
    input: UpdateIntegrationInput
  ) {
    // Get integration to verify team access
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: { teamId: true },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    // Verify admin access
    await this.verifyTeamAdmin(integration.teamId, userId);

    // Validate events if provided
    if (input.events) {
      const invalidEvents = input.events.filter(
        (e) => !VALID_EVENTS.includes(e as IntegrationEvent)
      );
      if (invalidEvents.length > 0) {
        throw new ValidationError(`Invalid events: ${invalidEvents.join(', ')}`);
      }
    }

    const updated = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.webhookUrl !== undefined && { webhookUrl: input.webhookUrl }),
        ...(input.enabled !== undefined && { enabled: input.enabled }),
        ...(input.events !== undefined && { events: input.events }),
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(integrationId: string, userId: string): Promise<void> {
    // Get integration to verify team access
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: { teamId: true },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    // Verify admin access
    await this.verifyTeamAdmin(integration.teamId, userId);

    await prisma.integration.delete({
      where: { id: integrationId },
    });
  }

  /**
   * Get all integrations for a team
   */
  async getTeamIntegrations(teamId: string, userId: string) {
    // Verify membership
    await this.verifyTeamMember(teamId, userId);

    const integrations = await prisma.integration.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        enabled: true,
        events: true,
        createdAt: true,
        createdBy: true,
        // Mask webhook URL for security (show only partial)
        webhookUrl: true,
      },
    });

    // Mask webhook URLs for non-admin users
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: { in: ['owner', 'admin'] },
      },
    });

    const isAdmin = !!membership;

    return integrations.map((integration) => ({
      ...integration,
      webhookUrl: isAdmin
        ? integration.webhookUrl
        : this.maskWebhookUrl(integration.webhookUrl),
    }));
  }

  /**
   * Get a single integration by ID
   */
  async getIntegration(integrationId: string, userId: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    // Verify membership
    await this.verifyTeamMember(integration.teamId, userId);

    // Check if user is admin for full webhook URL
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: integration.teamId,
        userId,
        role: { in: ['owner', 'admin'] },
      },
    });

    return {
      ...integration,
      webhookUrl: membership
        ? integration.webhookUrl
        : this.maskWebhookUrl(integration.webhookUrl),
    };
  }

  /**
   * Test an integration by sending a test message
   */
  async testIntegration(
    integrationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        team: {
          select: { name: true },
        },
      },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    // Verify admin access
    await this.verifyTeamAdmin(integration.teamId, userId);

    const result = await webhookService.sendTestMessage(
      integration.type as 'slack' | 'discord',
      integration.webhookUrl,
      integration.team.name
    );

    return result;
  }

  /**
   * Trigger an event to all enabled integrations for a team
   * This is called when team activities occur
   */
  async triggerEvent(
    teamId: string,
    event: IntegrationEvent,
    data: WebhookEventData
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    // Get all enabled integrations for this team that subscribe to this event
    const integrations = await prisma.integration.findMany({
      where: {
        teamId,
        enabled: true,
        events: { has: event },
      },
      include: {
        team: {
          select: { name: true },
        },
      },
    });

    if (integrations.length === 0) {
      return { sent: 0, failed: 0, errors: [] };
    }

    const results = await Promise.allSettled(
      integrations.map(async (integration) => {
        const eventData: WebhookEventData = {
          ...data,
          teamName: integration.team.name,
          timestamp: data.timestamp || new Date(),
        };

        const result = await webhookService.sendMessage(
          integration.type as 'slack' | 'discord',
          integration.webhookUrl,
          event,
          eventData
        );

        if (!result.success) {
          throw new Error(
            `Failed to send to ${integration.name} (${integration.type}): ${result.error}`
          );
        }

        return result;
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason?.message || String(r.reason));

    // Log errors for debugging (in production, use proper logging)
    if (errors.length > 0) {
      console.error(`[Integration] Event ${event} errors:`, errors);
    }

    return { sent, failed, errors };
  }

  /**
   * Mask webhook URL for security (show only last 8 characters)
   */
  private maskWebhookUrl(url: string): string {
    if (url.length <= 16) {
      return '****' + url.slice(-4);
    }
    return url.slice(0, 8) + '...' + url.slice(-8);
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();

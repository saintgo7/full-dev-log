/**
 * Webhook Service - Handles sending messages to Slack and Discord
 * Supports retry logic with exponential backoff for failed requests
 */

// Slack message payload types
export interface SlackAttachment {
  color?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

export interface SlackPayload {
  text?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  channel?: string;
  attachments?: SlackAttachment[];
  blocks?: unknown[];
}

// Discord message payload types
export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
}

export interface DiscordPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

// Event data structure for formatting
export interface WebhookEventData {
  teamName?: string;
  userName?: string;
  userEmail?: string;
  projectName?: string;
  noteTitle?: string;
  noteContent?: string;
  reportTitle?: string;
  reportType?: string;
  memberRole?: string;
  commentContent?: string;
  timestamp?: Date;
  [key: string]: unknown;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function getBackoffDelay(attempt: number): number {
  return INITIAL_DELAY_MS * Math.pow(2, attempt);
}

/**
 * WebhookService class for sending messages to external services
 */
export class WebhookService {
  /**
   * Send a message to Slack webhook with retry logic
   */
  async sendSlackMessage(
    webhookUrl: string,
    payload: SlackPayload
  ): Promise<{ success: boolean; error?: string }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          return { success: true };
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : getBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }

        // Non-retryable errors
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const text = await response.text();
          return { success: false, error: `Slack API error: ${response.status} - ${text}` };
        }

        lastError = new Error(`Slack API returned ${response.status}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Wait before retry with exponential backoff
      if (attempt < MAX_RETRIES - 1) {
        await sleep(getBackoffDelay(attempt));
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to send Slack message after retries',
    };
  }

  /**
   * Send a message to Discord webhook with retry logic
   */
  async sendDiscordMessage(
    webhookUrl: string,
    payload: DiscordPayload
  ): Promise<{ success: boolean; error?: string }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // Discord returns 204 No Content on success
        if (response.ok || response.status === 204) {
          return { success: true };
        }

        // Handle rate limiting
        if (response.status === 429) {
          const data = await response.json() as { retry_after?: number };
          const delay = data.retry_after ? data.retry_after * 1000 : getBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }

        // Non-retryable errors
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const text = await response.text();
          return { success: false, error: `Discord API error: ${response.status} - ${text}` };
        }

        lastError = new Error(`Discord API returned ${response.status}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Wait before retry with exponential backoff
      if (attempt < MAX_RETRIES - 1) {
        await sleep(getBackoffDelay(attempt));
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to send Discord message after retries',
    };
  }

  /**
   * Format a payload for Slack based on event type
   */
  formatSlackPayload(event: string, data: WebhookEventData): SlackPayload {
    const timestamp = data.timestamp ? Math.floor(data.timestamp.getTime() / 1000) : Math.floor(Date.now() / 1000);
    const teamName = data.teamName || 'DevLog Hub';

    switch (event) {
      case 'member_joined':
        return {
          username: 'DevLog Hub',
          icon_emoji: ':wave:',
          attachments: [
            {
              color: '#36a64f',
              title: 'New Team Member',
              text: `*${data.userName}* (${data.userEmail}) has joined the team${data.memberRole ? ` as ${data.memberRole}` : ''}.`,
              footer: teamName,
              ts: timestamp,
            },
          ],
        };

      case 'member_left':
        return {
          username: 'DevLog Hub',
          icon_emoji: ':wave:',
          attachments: [
            {
              color: '#ff6b6b',
              title: 'Member Left',
              text: `*${data.userName}* has left the team.`,
              footer: teamName,
              ts: timestamp,
            },
          ],
        };

      case 'note_created':
      case 'note_shared':
        return {
          username: 'DevLog Hub',
          icon_emoji: ':memo:',
          attachments: [
            {
              color: '#4a90d9',
              title: data.noteTitle || 'New Note',
              text: data.noteContent
                ? data.noteContent.substring(0, 200) + (data.noteContent.length > 200 ? '...' : '')
                : 'A new note has been shared.',
              fields: [
                {
                  title: 'Author',
                  value: data.userName || 'Unknown',
                  short: true,
                },
                ...(data.projectName
                  ? [{ title: 'Project', value: data.projectName, short: true }]
                  : []),
              ],
              footer: teamName,
              ts: timestamp,
            },
          ],
        };

      case 'report_ready':
        return {
          username: 'DevLog Hub',
          icon_emoji: ':bar_chart:',
          attachments: [
            {
              color: '#9b59b6',
              title: data.reportTitle || 'Report Ready',
              text: `A new ${data.reportType || 'activity'} report is ready for review.`,
              fields: [
                {
                  title: 'Generated by',
                  value: data.userName || 'System',
                  short: true,
                },
              ],
              footer: teamName,
              ts: timestamp,
            },
          ],
        };

      case 'project_added':
        return {
          username: 'DevLog Hub',
          icon_emoji: ':file_folder:',
          attachments: [
            {
              color: '#f39c12',
              title: 'Project Added',
              text: `*${data.projectName}* has been added to the team.`,
              fields: [
                {
                  title: 'Added by',
                  value: data.userName || 'Unknown',
                  short: true,
                },
              ],
              footer: teamName,
              ts: timestamp,
            },
          ],
        };

      case 'comment_added':
        return {
          username: 'DevLog Hub',
          icon_emoji: ':speech_balloon:',
          attachments: [
            {
              color: '#3498db',
              title: `Comment on: ${data.noteTitle || 'Note'}`,
              text: data.commentContent
                ? data.commentContent.substring(0, 200) + (data.commentContent.length > 200 ? '...' : '')
                : 'A new comment has been added.',
              fields: [
                {
                  title: 'By',
                  value: data.userName || 'Unknown',
                  short: true,
                },
              ],
              footer: teamName,
              ts: timestamp,
            },
          ],
        };

      case 'milestone_reached':
        return {
          username: 'DevLog Hub',
          icon_emoji: ':trophy:',
          attachments: [
            {
              color: '#f1c40f',
              title: 'Milestone Reached!',
              text: String(data.milestone) || 'A team milestone has been reached!',
              footer: teamName,
              ts: timestamp,
            },
          ],
        };

      default:
        return {
          username: 'DevLog Hub',
          icon_emoji: ':bell:',
          attachments: [
            {
              color: '#95a5a6',
              title: 'Team Activity',
              text: `Event: ${event}`,
              footer: teamName,
              ts: timestamp,
            },
          ],
        };
    }
  }

  /**
   * Format a payload for Discord based on event type
   */
  formatDiscordPayload(event: string, data: WebhookEventData): DiscordPayload {
    const timestamp = data.timestamp?.toISOString() || new Date().toISOString();
    const teamName = data.teamName || 'DevLog Hub';

    // Discord color values (decimal)
    const colors = {
      green: 3066993,    // #2ecc71
      red: 15158332,     // #e74c3c
      blue: 3447003,     // #3498db
      purple: 10181046,  // #9b59b6
      orange: 15105570,  // #e67e22
      yellow: 15844367,  // #f1c40f
      gray: 9807270,     // #95a5a6
    };

    switch (event) {
      case 'member_joined':
        return {
          username: 'DevLog Hub',
          embeds: [
            {
              title: 'New Team Member',
              description: `**${data.userName}** (${data.userEmail}) has joined the team${data.memberRole ? ` as ${data.memberRole}` : ''}.`,
              color: colors.green,
              footer: { text: teamName },
              timestamp,
            },
          ],
        };

      case 'member_left':
        return {
          username: 'DevLog Hub',
          embeds: [
            {
              title: 'Member Left',
              description: `**${data.userName}** has left the team.`,
              color: colors.red,
              footer: { text: teamName },
              timestamp,
            },
          ],
        };

      case 'note_created':
      case 'note_shared':
        return {
          username: 'DevLog Hub',
          embeds: [
            {
              title: data.noteTitle || 'New Note',
              description: data.noteContent
                ? data.noteContent.substring(0, 300) + (data.noteContent.length > 300 ? '...' : '')
                : 'A new note has been shared.',
              color: colors.blue,
              fields: [
                {
                  name: 'Author',
                  value: data.userName || 'Unknown',
                  inline: true,
                },
                ...(data.projectName
                  ? [{ name: 'Project', value: data.projectName, inline: true }]
                  : []),
              ],
              footer: { text: teamName },
              timestamp,
            },
          ],
        };

      case 'report_ready':
        return {
          username: 'DevLog Hub',
          embeds: [
            {
              title: data.reportTitle || 'Report Ready',
              description: `A new ${data.reportType || 'activity'} report is ready for review.`,
              color: colors.purple,
              fields: [
                {
                  name: 'Generated by',
                  value: data.userName || 'System',
                  inline: true,
                },
              ],
              footer: { text: teamName },
              timestamp,
            },
          ],
        };

      case 'project_added':
        return {
          username: 'DevLog Hub',
          embeds: [
            {
              title: 'Project Added',
              description: `**${data.projectName}** has been added to the team.`,
              color: colors.orange,
              fields: [
                {
                  name: 'Added by',
                  value: data.userName || 'Unknown',
                  inline: true,
                },
              ],
              footer: { text: teamName },
              timestamp,
            },
          ],
        };

      case 'comment_added':
        return {
          username: 'DevLog Hub',
          embeds: [
            {
              title: `Comment on: ${data.noteTitle || 'Note'}`,
              description: data.commentContent
                ? data.commentContent.substring(0, 300) + (data.commentContent.length > 300 ? '...' : '')
                : 'A new comment has been added.',
              color: colors.blue,
              fields: [
                {
                  name: 'By',
                  value: data.userName || 'Unknown',
                  inline: true,
                },
              ],
              footer: { text: teamName },
              timestamp,
            },
          ],
        };

      case 'milestone_reached':
        return {
          username: 'DevLog Hub',
          embeds: [
            {
              title: 'Milestone Reached!',
              description: String(data.milestone) || 'A team milestone has been reached!',
              color: colors.yellow,
              footer: { text: teamName },
              timestamp,
            },
          ],
        };

      default:
        return {
          username: 'DevLog Hub',
          embeds: [
            {
              title: 'Team Activity',
              description: `Event: ${event}`,
              color: colors.gray,
              footer: { text: teamName },
              timestamp,
            },
          ],
        };
    }
  }

  /**
   * Send a message to the appropriate service based on integration type
   */
  async sendMessage(
    type: 'slack' | 'discord',
    webhookUrl: string,
    event: string,
    data: WebhookEventData
  ): Promise<{ success: boolean; error?: string }> {
    if (type === 'slack') {
      const payload = this.formatSlackPayload(event, data);
      return this.sendSlackMessage(webhookUrl, payload);
    } else if (type === 'discord') {
      const payload = this.formatDiscordPayload(event, data);
      return this.sendDiscordMessage(webhookUrl, payload);
    }

    return { success: false, error: `Unknown integration type: ${type}` };
  }

  /**
   * Send a test message to verify webhook configuration
   */
  async sendTestMessage(
    type: 'slack' | 'discord',
    webhookUrl: string,
    teamName?: string
  ): Promise<{ success: boolean; error?: string }> {
    const testData: WebhookEventData = {
      teamName: teamName || 'DevLog Hub',
      timestamp: new Date(),
    };

    if (type === 'slack') {
      const payload: SlackPayload = {
        username: 'DevLog Hub',
        icon_emoji: ':white_check_mark:',
        attachments: [
          {
            color: '#36a64f',
            title: 'Test Message',
            text: 'This is a test message from DevLog Hub. Your integration is working correctly!',
            footer: testData.teamName,
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };
      return this.sendSlackMessage(webhookUrl, payload);
    } else if (type === 'discord') {
      const payload: DiscordPayload = {
        username: 'DevLog Hub',
        embeds: [
          {
            title: 'Test Message',
            description: 'This is a test message from DevLog Hub. Your integration is working correctly!',
            color: 3066993, // Green
            footer: { text: testData.teamName || 'DevLog Hub' },
            timestamp: new Date().toISOString(),
          },
        ],
      };
      return this.sendDiscordMessage(webhookUrl, payload);
    }

    return { success: false, error: `Unknown integration type: ${type}` };
  }
}

// Export singleton instance
export const webhookService = new WebhookService();

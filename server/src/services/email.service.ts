/**
 * Email Service (Mock Implementation)
 *
 * This service provides email sending capabilities for notifications.
 * Currently implemented as a mock - actual email provider integration
 * (SendGrid, Mailgun, AWS SES, etc.) can be added later.
 */

// Email template types
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export interface ReportInfo {
  id: string;
  title: string;
  reportType: string;
  url?: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  slug: string;
}

export interface NoteInfo {
  id: string;
  title: string;
  url?: string;
}

export interface WeeklyStats {
  totalEvents: number;
  gitCommits: number;
  filesModified: number;
  terminalCommands: number;
  topProjects: Array<{ name: string; eventCount: number }>;
  period: { start: Date; end: Date };
}

// Configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'DevLog Hub <noreply@devloghub.io>',
  baseUrl: process.env.APP_URL || 'http://localhost:3020',
};

/**
 * Send a generic email
 * In production, replace with actual email provider (SendGrid, Mailgun, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;

  // Mock implementation - log to console
  console.log('========== EMAIL (MOCK) ==========');
  console.log(`From: ${EMAIL_CONFIG.from}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('----------------------------------');
  console.log(text || html.replace(/<[^>]*>/g, ''));
  console.log('==================================');

  // Simulate async email sending
  await new Promise((resolve) => setTimeout(resolve, 100));

  // In production, integrate with email provider:
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, from: EMAIL_CONFIG.from, subject, html, text });

  return true;
}

/**
 * Send report ready notification email
 */
export async function sendReportReady(
  user: UserInfo,
  report: ReportInfo
): Promise<boolean> {
  const reportUrl = `${EMAIL_CONFIG.baseUrl}/reports/${report.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin-top: 16px; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Report is Ready</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Your <strong>${report.reportType}</strong> report "<strong>${report.title}</strong>" has been generated and is ready to view.</p>
          <a href="${reportUrl}" class="button">View Report</a>
          <p class="footer">
            This email was sent by DevLog Hub.<br>
            If you didn't request this report, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${user.name},

Your ${report.reportType} report "${report.title}" has been generated and is ready to view.

View your report: ${reportUrl}

---
This email was sent by DevLog Hub.
  `.trim();

  return sendEmail({
    to: user.email,
    subject: `Your ${report.reportType} report is ready - ${report.title}`,
    html,
    text,
  });
}

/**
 * Send team invitation email
 */
export async function sendTeamInvite(
  email: string,
  team: TeamInfo,
  inviter: UserInfo
): Promise<boolean> {
  const inviteUrl = `${EMAIL_CONFIG.baseUrl}/teams/invite?team=${team.slug}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin-top: 16px; }
        .team-info { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Team Invitation</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${inviter.name}</strong> has invited you to join the team:</p>
          <div class="team-info">
            <h3>${team.name}</h3>
          </div>
          <p>Join the team to collaborate on development activities and share insights.</p>
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
          <p class="footer">
            This invitation was sent by DevLog Hub on behalf of ${inviter.name}.<br>
            If you don't want to join this team, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi there,

${inviter.name} has invited you to join the team "${team.name}" on DevLog Hub.

Accept the invitation: ${inviteUrl}

---
This invitation was sent by DevLog Hub on behalf of ${inviter.name}.
If you don't want to join this team, you can safely ignore this email.
  `.trim();

  return sendEmail({
    to: email,
    subject: `${inviter.name} invited you to join ${team.name}`,
    html,
    text,
  });
}

/**
 * Send mention notification email
 */
export async function sendMentionNotification(
  user: UserInfo,
  note: NoteInfo,
  mentioner: UserInfo
): Promise<boolean> {
  const noteUrl = `${EMAIL_CONFIG.baseUrl}/notes/${note.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B5CF6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin-top: 16px; }
        .note-info { background: white; padding: 16px; border-radius: 8px; margin: 16px 0;
                     border-left: 4px solid #8B5CF6; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You Were Mentioned</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p><strong>${mentioner.name}</strong> mentioned you in a note:</p>
          <div class="note-info">
            <strong>${note.title}</strong>
          </div>
          <a href="${noteUrl}" class="button">View Note</a>
          <p class="footer">
            This email was sent by DevLog Hub.<br>
            You can manage your notification preferences in settings.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${user.name},

${mentioner.name} mentioned you in a note: "${note.title}"

View the note: ${noteUrl}

---
This email was sent by DevLog Hub.
You can manage your notification preferences in settings.
  `.trim();

  return sendEmail({
    to: user.email,
    subject: `${mentioner.name} mentioned you in "${note.title}"`,
    html,
    text,
  });
}

/**
 * Send weekly digest email
 */
export async function sendWeeklyDigest(
  user: UserInfo,
  stats: WeeklyStats
): Promise<boolean> {
  const dashboardUrl = `${EMAIL_CONFIG.baseUrl}/dashboard`;
  const startDate = stats.period.start.toLocaleDateString();
  const endDate = stats.period.end.toLocaleDateString();

  const topProjectsHtml = stats.topProjects
    .map(
      (p) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${p.eventCount}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
        .stat-card { background: white; padding: 16px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .stat-label { font-size: 14px; color: #6b7280; }
        .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin-top: 16px; }
        table { width: 100%; background: white; border-radius: 8px; margin-top: 16px; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Weekly Digest</h1>
          <p>${startDate} - ${endDate}</p>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Here's a summary of your development activity this week:</p>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.totalEvents}</div>
              <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.gitCommits}</div>
              <div class="stat-label">Git Commits</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.filesModified}</div>
              <div class="stat-label">Files Modified</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.terminalCommands}</div>
              <div class="stat-label">Terminal Commands</div>
            </div>
          </div>

          ${
            stats.topProjects.length > 0
              ? `
            <h3>Top Projects</h3>
            <table>
              <thead>
                <tr>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Project</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Events</th>
                </tr>
              </thead>
              <tbody>
                ${topProjectsHtml}
              </tbody>
            </table>
          `
              : ''
          }

          <a href="${dashboardUrl}" class="button">View Full Dashboard</a>

          <p class="footer">
            This email was sent by DevLog Hub.<br>
            You can manage your notification preferences in settings.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const topProjectsText = stats.topProjects
    .map((p) => `  - ${p.name}: ${p.eventCount} events`)
    .join('\n');

  const text = `
Hi ${user.name},

Here's your weekly digest for ${startDate} - ${endDate}:

Summary:
- Total Events: ${stats.totalEvents}
- Git Commits: ${stats.gitCommits}
- Files Modified: ${stats.filesModified}
- Terminal Commands: ${stats.terminalCommands}

${stats.topProjects.length > 0 ? `Top Projects:\n${topProjectsText}` : ''}

View your full dashboard: ${dashboardUrl}

---
This email was sent by DevLog Hub.
You can manage your notification preferences in settings.
  `.trim();

  return sendEmail({
    to: user.email,
    subject: `Your Weekly DevLog Digest (${startDate} - ${endDate})`,
    html,
    text,
  });
}

/**
 * Send anomaly alert email
 */
export async function sendAnomalyAlert(
  user: UserInfo,
  anomaly: { type: string; description: string; severity: string }
): Promise<boolean> {
  const dashboardUrl = `${EMAIL_CONFIG.baseUrl}/dashboard`;

  const severityColor =
    anomaly.severity === 'high' ? '#EF4444' : anomaly.severity === 'medium' ? '#F59E0B' : '#3B82F6';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-box { background: white; padding: 16px; border-radius: 8px; margin: 16px 0;
                     border-left: 4px solid ${severityColor}; }
        .severity { display: inline-block; padding: 4px 12px; border-radius: 12px;
                    background: ${severityColor}; color: white; font-size: 12px; text-transform: uppercase; }
        .button { display: inline-block; background: ${severityColor}; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin-top: 16px; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Anomaly Detected</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>We detected an unusual pattern in your development activity:</p>
          <div class="alert-box">
            <span class="severity">${anomaly.severity} severity</span>
            <h3>${anomaly.type}</h3>
            <p>${anomaly.description}</p>
          </div>
          <a href="${dashboardUrl}" class="button">View Dashboard</a>
          <p class="footer">
            This email was sent by DevLog Hub.<br>
            You can manage your anomaly alerts in notification settings.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${user.name},

We detected an unusual pattern in your development activity:

Type: ${anomaly.type}
Severity: ${anomaly.severity.toUpperCase()}
${anomaly.description}

View your dashboard: ${dashboardUrl}

---
This email was sent by DevLog Hub.
You can manage your anomaly alerts in notification settings.
  `.trim();

  return sendEmail({
    to: user.email,
    subject: `[${anomaly.severity.toUpperCase()}] Anomaly Detected - ${anomaly.type}`,
    html,
    text,
  });
}

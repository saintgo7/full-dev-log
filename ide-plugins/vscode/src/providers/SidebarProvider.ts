import * as vscode from 'vscode';
import { DevLogClient, ConnectionState, DevLogEvent } from '../api/client';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'devlog.sidebarView';

  private view?: vscode.WebviewView;
  private client: DevLogClient;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    client: DevLogClient
  ) {
    this.client = client;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    // Handle messages from webview
    this.disposables.push(
      webviewView.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
          case 'connect':
            await vscode.commands.executeCommand('devlog.connect');
            break;
          case 'disconnect':
            await vscode.commands.executeCommand('devlog.disconnect');
            break;
          case 'syncNow':
            await vscode.commands.executeCommand('devlog.syncNow');
            break;
          case 'viewInsights':
            await vscode.commands.executeCommand('devlog.viewInsights');
            break;
          case 'refresh':
            await this.refreshData();
            break;
        }
      })
    );

    // Listen for connection changes
    this.disposables.push(
      this.client.onConnectionChange((state) => {
        this.updateConnectionStatus(state);
      })
    );

    // Initial data load
    this.refreshData();
  }

  public updateConnectionStatus(state: ConnectionState): void {
    if (this.view) {
      this.view.webview.postMessage({
        type: 'connectionStatus',
        data: state,
      });
    }
  }

  public updateRecentActivity(events: DevLogEvent[]): void {
    if (this.view) {
      this.view.webview.postMessage({
        type: 'recentActivity',
        data: events,
      });
    }
  }

  private async refreshData(): Promise<void> {
    try {
      const state = this.client.getConnectionState();
      this.updateConnectionStatus(state);

      if (state.connected) {
        const activity = await this.client.getRecentActivity();
        this.updateRecentActivity(activity);
      }
    } catch (error) {
      console.error('Failed to refresh sidebar data:', error);
    }
  }

  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>DevLog Hub</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background);
      padding: 12px;
    }
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-sideBarSectionHeader-foreground);
      margin-bottom: 8px;
    }
    .status-card {
      background-color: var(--vscode-editor-background);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 8px;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-dot.connected {
      background-color: var(--vscode-testing-iconPassed);
    }
    .status-dot.disconnected {
      background-color: var(--vscode-testing-iconFailed);
    }
    .status-text {
      font-size: 12px;
    }
    .button {
      display: block;
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 8px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    .button.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .button.secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    .activity-list {
      max-height: 200px;
      overflow-y: auto;
    }
    .activity-item {
      padding: 8px;
      border-bottom: 1px solid var(--vscode-widget-border);
      font-size: 11px;
    }
    .activity-item:last-child {
      border-bottom: none;
    }
    .activity-type {
      font-weight: 600;
      color: var(--vscode-textLink-foreground);
    }
    .activity-time {
      color: var(--vscode-descriptionForeground);
      font-size: 10px;
    }
    .empty-state {
      text-align: center;
      padding: 20px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="section">
    <div class="section-title">Connection Status</div>
    <div class="status-card">
      <div class="status-indicator">
        <span id="statusDot" class="status-dot disconnected"></span>
        <span id="statusText" class="status-text">Disconnected</span>
      </div>
      <button id="connectBtn" class="button">Connect</button>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Quick Actions</div>
    <button id="syncBtn" class="button secondary">Sync Now</button>
    <button id="insightsBtn" class="button secondary">View Insights</button>
    <button id="refreshBtn" class="button secondary">Refresh</button>
  </div>

  <div class="section">
    <div class="section-title">Recent Activity</div>
    <div id="activityList" class="activity-list">
      <div class="empty-state">No recent activity</div>
    </div>
  </div>

  <script>
    (function() {
      const vscode = acquireVsCodeApi();
      let isConnected = false;

      // DOM elements
      const statusDot = document.getElementById('statusDot');
      const statusText = document.getElementById('statusText');
      const connectBtn = document.getElementById('connectBtn');
      const syncBtn = document.getElementById('syncBtn');
      const insightsBtn = document.getElementById('insightsBtn');
      const refreshBtn = document.getElementById('refreshBtn');
      const activityList = document.getElementById('activityList');

      // Handle messages from extension
      window.addEventListener('message', function(event) {
        const message = event.data;
        switch (message.type) {
          case 'connectionStatus':
            updateConnectionStatus(message.data);
            break;
          case 'recentActivity':
            updateRecentActivity(message.data);
            break;
        }
      });

      function updateConnectionStatus(state) {
        isConnected = state.connected;

        statusDot.className = 'status-dot ' + (state.connected ? 'connected' : 'disconnected');
        statusText.textContent = state.connected ? 'Connected' : (state.error || 'Disconnected');
        connectBtn.textContent = state.connected ? 'Disconnect' : 'Connect';
      }

      function updateRecentActivity(events) {
        // Clear existing content safely
        while (activityList.firstChild) {
          activityList.removeChild(activityList.firstChild);
        }

        if (!events || events.length === 0) {
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'empty-state';
          emptyDiv.textContent = 'No recent activity';
          activityList.appendChild(emptyDiv);
          return;
        }

        const displayEvents = events.slice(0, 10);
        displayEvents.forEach(function(event) {
          const time = new Date(event.timestamp).toLocaleTimeString();
          const fileName = event.data.filePath ? event.data.filePath.split('/').pop() : '';

          const itemDiv = document.createElement('div');
          itemDiv.className = 'activity-item';

          const typeSpan = document.createElement('span');
          typeSpan.className = 'activity-type';
          typeSpan.textContent = event.type;

          const fileText = document.createTextNode(' ' + fileName);

          const timeDiv = document.createElement('div');
          timeDiv.className = 'activity-time';
          timeDiv.textContent = time;

          itemDiv.appendChild(typeSpan);
          itemDiv.appendChild(fileText);
          itemDiv.appendChild(timeDiv);

          activityList.appendChild(itemDiv);
        });
      }

      // Event listeners
      connectBtn.addEventListener('click', function() {
        vscode.postMessage({ command: isConnected ? 'disconnect' : 'connect' });
      });

      syncBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'syncNow' });
      });

      insightsBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'viewInsights' });
      });

      refreshBtn.addEventListener('click', function() {
        vscode.postMessage({ command: 'refresh' });
      });
    })();
  </script>
</body>
</html>`;
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}

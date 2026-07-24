import * as vscode from 'vscode';
import { DevLogClient } from './api/client';
import { SidebarProvider } from './providers/SidebarProvider';
import { StatusBarItem } from './providers/StatusBarItem';
import { FileWatcher } from './watchers/FileWatcher';
import { getConfig, onConfigChange, DevLogConfig } from './config';

let client: DevLogClient;
let sidebarProvider: SidebarProvider;
let statusBarItem: StatusBarItem;
let fileWatcher: FileWatcher;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('DevLog Hub extension is activating...');

  const config = getConfig();

  // Initialize API client
  client = new DevLogClient(config);

  // Initialize sidebar provider
  sidebarProvider = new SidebarProvider(context.extensionUri, client);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  // Initialize status bar item
  statusBarItem = new StatusBarItem(client);
  context.subscriptions.push(statusBarItem);

  // Initialize file watcher
  fileWatcher = new FileWatcher(client);
  context.subscriptions.push(fileWatcher);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('devlog.connect', async () => {
      try {
        await client.connect();
        vscode.window.showInformationMessage('DevLog Hub: Connected to server');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`DevLog Hub: Failed to connect - ${message}`);
      }
    }),

    vscode.commands.registerCommand('devlog.disconnect', () => {
      client.disconnect();
      vscode.window.showInformationMessage('DevLog Hub: Disconnected from server');
    }),

    vscode.commands.registerCommand('devlog.toggleConnection', async () => {
      const state = client.getConnectionState();
      if (state.connected) {
        await vscode.commands.executeCommand('devlog.disconnect');
      } else {
        await vscode.commands.executeCommand('devlog.connect');
      }
    }),

    vscode.commands.registerCommand('devlog.viewInsights', async () => {
      try {
        const insights = await client.getInsights();

        if (insights.length === 0) {
          vscode.window.showInformationMessage('DevLog Hub: No insights available');
          return;
        }

        // Create a quick pick to show insights
        const items = insights.map((insight) => ({
          label: insight.title,
          description: insight.type,
          detail: insight.description,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select an insight to view details',
        });

        if (selected) {
          vscode.window.showInformationMessage(selected.detail || 'No details available');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`DevLog Hub: Failed to fetch insights - ${message}`);
      }
    }),

    vscode.commands.registerCommand('devlog.syncNow', async () => {
      try {
        const state = client.getConnectionState();
        if (!state.connected) {
          vscode.window.showWarningMessage('DevLog Hub: Not connected to server');
          return;
        }

        const result = await client.syncNow();
        vscode.window.showInformationMessage(
          `DevLog Hub: Synced ${result.synced} events`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`DevLog Hub: Sync failed - ${message}`);
      }
    })
  );

  // Listen for config changes
  context.subscriptions.push(
    onConfigChange((newConfig: DevLogConfig) => {
      client.updateConfig(newConfig);

      // Reconnect if auto-connect is enabled and settings changed
      if (newConfig.autoConnect) {
        const state = client.getConnectionState();
        if (!state.connected) {
          client.connect().catch(console.error);
        }
      }
    })
  );

  // Send session start event
  await sendSessionEvent('session_start');

  // Auto-connect if enabled
  if (config.autoConnect && config.serverUrl && config.agentId) {
    try {
      await client.connect();
      console.log('DevLog Hub: Auto-connected to server');
    } catch (error) {
      console.error('DevLog Hub: Auto-connect failed', error);
    }
  }

  console.log('DevLog Hub extension activated');
}

export async function deactivate(): Promise<void> {
  console.log('DevLog Hub extension is deactivating...');

  // Send session end event
  await sendSessionEvent('session_end');

  // Cleanup
  if (client) {
    client.disconnect();
  }

  if (fileWatcher) {
    fileWatcher.dispose();
  }

  if (statusBarItem) {
    statusBarItem.dispose();
  }

  if (sidebarProvider) {
    sidebarProvider.dispose();
  }

  console.log('DevLog Hub extension deactivated');
}

async function sendSessionEvent(type: 'session_start' | 'session_end'): Promise<void> {
  if (!client) {
    return;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  const project = workspaceFolders?.[0]?.name || 'unknown';

  await client.sendEvent({
    type,
    timestamp: new Date().toISOString(),
    data: {
      project,
      editor: 'vscode',
      editorVersion: vscode.version,
    },
  });
}

import * as vscode from 'vscode';
import { DevLogClient, ConnectionState } from '../api/client';

export class StatusBarItem {
  private statusBarItem: vscode.StatusBarItem;
  private client: DevLogClient;
  private disposables: vscode.Disposable[] = [];

  constructor(client: DevLogClient) {
    this.client = client;

    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );

    this.statusBarItem.command = 'devlog.toggleConnection';
    this.statusBarItem.tooltip = 'DevLog Hub - Click to toggle connection';

    this.updateStatus(this.client.getConnectionState());
    this.statusBarItem.show();

    // Listen for connection changes
    this.disposables.push(
      this.client.onConnectionChange((state) => {
        this.updateStatus(state);
      })
    );
  }

  private updateStatus(state: ConnectionState): void {
    if (state.connected) {
      this.statusBarItem.text = '$(plug) DevLog: Connected';
      this.statusBarItem.backgroundColor = undefined;
    } else if (state.error) {
      this.statusBarItem.text = '$(warning) DevLog: Error';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
    } else {
      this.statusBarItem.text = '$(debug-disconnect) DevLog: Disconnected';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}

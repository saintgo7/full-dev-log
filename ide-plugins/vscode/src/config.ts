import * as vscode from 'vscode';

export interface DevLogConfig {
  serverUrl: string;
  wsUrl: string;
  autoConnect: boolean;
  syncInterval: number;
  agentId: string;
  apiKey: string;
}

export function getConfig(): DevLogConfig {
  const config = vscode.workspace.getConfiguration('devlog');

  return {
    serverUrl: config.get<string>('serverUrl', 'http://localhost:3001'),
    wsUrl: config.get<string>('wsUrl', 'ws://localhost:3001'),
    autoConnect: config.get<boolean>('autoConnect', true),
    syncInterval: config.get<number>('syncInterval', 30000),
    agentId: config.get<string>('agentId', ''),
    apiKey: config.get<string>('apiKey', ''),
  };
}

export function onConfigChange(callback: (config: DevLogConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('devlog')) {
      callback(getConfig());
    }
  });
}

export async function updateConfig<K extends keyof DevLogConfig>(
  key: K,
  value: DevLogConfig[K],
  global: boolean = true
): Promise<void> {
  const config = vscode.workspace.getConfiguration('devlog');
  await config.update(key, value, global);
}

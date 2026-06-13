import * as vscode from 'vscode';
import * as path from 'path';
import { DevLogClient, DevLogEvent } from '../api/client';

interface PendingChange {
  uri: vscode.Uri;
  type: 'create' | 'change' | 'delete';
  timestamp: Date;
}

export class FileWatcher {
  private client: DevLogClient;
  private disposables: vscode.Disposable[] = [];
  private pendingChanges: Map<string, PendingChange> = new Map();
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceMs = 1000;
  private readonly batchSize = 20;

  constructor(client: DevLogClient) {
    this.client = client;
    this.initialize();
  }

  private initialize(): void {
    // Watch for file changes
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');

    this.disposables.push(
      fileWatcher.onDidCreate((uri) => this.handleFileEvent(uri, 'create')),
      fileWatcher.onDidChange((uri) => this.handleFileEvent(uri, 'change')),
      fileWatcher.onDidDelete((uri) => this.handleFileEvent(uri, 'delete')),
      fileWatcher
    );

    // Watch for document saves
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        this.handleDocumentSave(document);
      })
    );

    // Watch for active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.handleEditorChange(editor);
        }
      })
    );
  }

  private handleFileEvent(uri: vscode.Uri, type: 'create' | 'change' | 'delete'): void {
    // Skip if not in workspace
    if (!this.isInWorkspace(uri)) {
      return;
    }

    // Skip ignored patterns
    if (this.shouldIgnore(uri.fsPath)) {
      return;
    }

    this.pendingChanges.set(uri.fsPath, {
      uri,
      type,
      timestamp: new Date(),
    });

    this.scheduleBatchProcess();
  }

  private handleDocumentSave(document: vscode.TextDocument): void {
    if (!this.isInWorkspace(document.uri)) {
      return;
    }

    if (this.shouldIgnore(document.uri.fsPath)) {
      return;
    }

    const event: DevLogEvent = {
      type: 'file_change',
      timestamp: new Date().toISOString(),
      data: {
        filePath: this.getRelativePath(document.uri),
        language: document.languageId,
        linesAdded: document.lineCount,
        project: this.getProjectName(),
      },
    };

    this.client.sendEvent(event);
  }

  private handleEditorChange(editor: vscode.TextEditor): void {
    // Track which files are being actively edited
    // This could be used for session tracking
  }

  private scheduleBatchProcess(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processBatch();
    }, this.debounceMs);
  }

  private processBatch(): void {
    const changes = Array.from(this.pendingChanges.values());
    this.pendingChanges.clear();

    if (changes.length === 0) {
      return;
    }

    // Process in batches
    for (let i = 0; i < changes.length; i += this.batchSize) {
      const batch = changes.slice(i, i + this.batchSize);

      batch.forEach((change) => {
        const eventType = this.mapChangeType(change.type);

        const event: DevLogEvent = {
          type: eventType,
          timestamp: change.timestamp.toISOString(),
          data: {
            filePath: this.getRelativePath(change.uri),
            language: this.getLanguageFromPath(change.uri.fsPath),
            project: this.getProjectName(),
          },
        };

        this.client.sendEvent(event);
      });
    }
  }

  private mapChangeType(type: 'create' | 'change' | 'delete'): DevLogEvent['type'] {
    switch (type) {
      case 'create':
        return 'file_create';
      case 'delete':
        return 'file_delete';
      default:
        return 'file_change';
    }
  }

  private isInWorkspace(uri: vscode.Uri): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return false;
    }

    return workspaceFolders.some((folder) =>
      uri.fsPath.startsWith(folder.uri.fsPath)
    );
  }

  private shouldIgnore(filePath: string): boolean {
    const ignorePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.next/,
      /\.vscode/,
      /\.idea/,
      /\.DS_Store/,
      /\.log$/,
      /\.lock$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
    ];

    return ignorePatterns.some((pattern) => pattern.test(filePath));
  }

  private getRelativePath(uri: vscode.Uri): string {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
      return path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
    }
    return uri.fsPath;
  }

  private getProjectName(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return workspaceFolders[0].name;
    }
    return 'unknown';
  }

  private getLanguageFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescriptreact',
      '.js': 'javascript',
      '.jsx': 'javascriptreact',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
      '.md': 'markdown',
      '.sql': 'sql',
      '.sh': 'shellscript',
      '.bash': 'shellscript',
    };

    return languageMap[ext] || 'plaintext';
  }

  public dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.pendingChanges.clear();
  }
}

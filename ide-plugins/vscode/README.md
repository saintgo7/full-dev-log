# DevLog Hub VS Code Extension

Track and sync your development activity with DevLog Hub.

## Features

- **Real-time Activity Tracking**: Automatically tracks file changes, creates, and deletes in your workspace
- **Server Connection**: Connect to your DevLog Hub server via WebSocket for real-time synchronization
- **Sidebar Panel**: View connection status and recent activity at a glance
- **Status Bar Integration**: Quick connection status indicator with one-click toggle
- **Manual Sync**: Force sync your activity data anytime
- **Insights View**: Access development insights from the DevLog Hub platform

## Commands

- `DevLog: Connect to Server` - Establish connection to DevLog Hub server
- `DevLog: Disconnect from Server` - Close the server connection
- `DevLog: Sync Now` - Manually trigger a sync operation
- `DevLog: View Insights` - Open the insights panel

## Configuration

Configure the extension in VS Code settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `devlog.serverUrl` | URL of the DevLog Hub server | `http://localhost:3001` |
| `devlog.wsUrl` | WebSocket URL of the DevLog Hub server | `ws://localhost:3001` |
| `devlog.autoConnect` | Automatically connect on startup | `true` |
| `devlog.syncInterval` | Sync interval in milliseconds | `30000` |
| `devlog.agentId` | Agent ID for this VS Code instance | `""` |
| `devlog.apiKey` | API key for authentication | `""` |

## Setup

1. Install the extension
2. Configure your `devlog.serverUrl` and `devlog.agentId` in VS Code settings
3. Set your `devlog.apiKey` for authentication
4. The extension will auto-connect on startup if `devlog.autoConnect` is enabled

## Development

### Build

```bash
npm install
npm run compile
```

### Watch

```bash
npm run watch
```

### Package

```bash
npm run package
```

## Requirements

- VS Code 1.85.0 or higher
- DevLog Hub server running and accessible

## Privacy

The extension only tracks file activity within your workspace. No file contents are transmitted - only metadata such as file paths, languages, and timestamps.

## License

MIT

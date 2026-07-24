# DevLog Hub - JetBrains Plugin

IntelliJ IDEA plugin for DevLog Hub - Development Activity Tracker.

## Features

- Real-time file change tracking
- WebSocket-based sync with DevLog Hub server
- Activity insights and statistics
- Configurable sync intervals
- Tool window with connection status and activity log

## Requirements

- IntelliJ IDEA 2023.2 or later (or compatible JetBrains IDE)
- JDK 17 or later
- DevLog Hub server running

## Building

```bash
./gradlew build
```

## Running in Development

```bash
./gradlew runIde
```

## Installing

1. Build the plugin: `./gradlew buildPlugin`
2. The plugin ZIP will be in `build/distributions/`
3. In IntelliJ IDEA: Settings > Plugins > Install Plugin from Disk
4. Select the ZIP file and restart the IDE

## Configuration

1. Go to Settings > Tools > DevLog Hub
2. Enter your DevLog Hub server URL (default: http://localhost:3001)
3. Configure tracking options as needed
4. Enable auto-connect if desired

## Usage

1. Open the DevLog Hub tool window (View > Tool Windows > DevLog Hub)
2. Click "Connect" to connect to the server
3. Your development activities will be automatically tracked

## Project Structure

```
src/main/kotlin/com/devlog/hub/
├── DevLogPlugin.kt          # Main plugin entry point
├── services/
│   └── DevLogService.kt     # WebSocket connection service
├── ui/
│   └── DevLogToolWindow.kt  # Tool window UI
├── listeners/
│   └── FileChangeListener.kt # File system event listener
├── actions/
│   └── DevLogActions.kt     # Menu actions
└── settings/
    └── DevLogSettings.kt    # Plugin settings
```

## License

MIT License

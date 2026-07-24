package collector

import (
	"bufio"
	"context"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/saintgo7/devlog-hub/agent/internal/config"
	"github.com/saintgo7/devlog-hub/agent/internal/models"
)

// TerminalEvent represents a terminal command event
type TerminalEvent struct {
	Command          string    `json:"command"`
	WorkingDirectory string    `json:"working_directory"`
	Shell            string    `json:"shell"`
	Timestamp        time.Time `json:"timestamp"`
}

// TerminalCollector collects terminal command history
type TerminalCollector struct {
	config         *config.TerminalCollectorConfig
	handler        EventHandler
	watcher        *fsnotify.Watcher
	ctx            context.Context
	cancel         context.CancelFunc
	running        bool
	mu             sync.RWMutex
	lastPositions  map[string]int64  // history file path -> last read position
	filterPatterns []*regexp.Regexp  // compiled filter patterns
}

// NewTerminalCollector creates a new terminal collector
func NewTerminalCollector(cfg *config.TerminalCollectorConfig, handler EventHandler) *TerminalCollector {
	// Compile filter patterns (case-insensitive)
	var patterns []*regexp.Regexp
	for _, pattern := range cfg.FilterPatterns {
		re, err := regexp.Compile("(?i)" + regexp.QuoteMeta(pattern))
		if err != nil {
			log.Warn().Err(err).Str("pattern", pattern).Msg("Failed to compile filter pattern")
			continue
		}
		patterns = append(patterns, re)
	}

	return &TerminalCollector{
		config:         cfg,
		handler:        handler,
		lastPositions:  make(map[string]int64),
		filterPatterns: patterns,
	}
}

func (c *TerminalCollector) Name() string {
	return "terminal"
}

func (c *TerminalCollector) Start() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.running {
		return nil
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	c.watcher = watcher

	c.ctx, c.cancel = context.WithCancel(context.Background())
	c.running = true

	// Initialize last positions for existing history files
	for _, historyFile := range c.config.HistoryFiles {
		if info, err := os.Stat(historyFile); err == nil {
			// Start from the current end of file to avoid processing old history
			c.lastPositions[historyFile] = info.Size()

			// Add watcher for the history file
			if err := c.watcher.Add(historyFile); err != nil {
				log.Warn().Err(err).Str("file", historyFile).Msg("Failed to watch history file")
			} else {
				log.Debug().Str("file", historyFile).Msg("Watching history file")
			}
		}
	}

	go c.watchLoop()
	log.Info().Msg("Terminal collector started")
	return nil
}

func (c *TerminalCollector) Stop() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.running {
		return nil
	}

	c.cancel()
	if c.watcher != nil {
		c.watcher.Close()
	}
	c.running = false
	log.Info().Msg("Terminal collector stopped")
	return nil
}

func (c *TerminalCollector) Collect() ([]models.Event, error) {
	// Terminal collector is event-driven via fsnotify
	// This method can be used for manual collection if needed
	var allEvents []models.Event

	for _, historyFile := range c.config.HistoryFiles {
		events, err := c.collectFromHistory(historyFile)
		if err != nil {
			log.Warn().Err(err).Str("file", historyFile).Msg("Failed to collect from history file")
			continue
		}
		allEvents = append(allEvents, events...)
	}

	return allEvents, nil
}

func (c *TerminalCollector) watchLoop() {
	// Use a ticker for periodic checks (backup in case fsnotify misses events)
	ticker := time.NewTicker(c.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-c.ctx.Done():
			return

		case event, ok := <-c.watcher.Events:
			if !ok {
				return
			}

			// Only process write events
			if event.Op&fsnotify.Write == fsnotify.Write {
				c.processHistoryFile(event.Name)
			}

		case err, ok := <-c.watcher.Errors:
			if !ok {
				return
			}
			log.Error().Err(err).Msg("Terminal watcher error")

		case <-ticker.C:
			// Periodic check for all history files
			for _, historyFile := range c.config.HistoryFiles {
				c.processHistoryFile(historyFile)
			}
		}
	}
}

func (c *TerminalCollector) processHistoryFile(filePath string) {
	events, err := c.collectFromHistory(filePath)
	if err != nil {
		log.Warn().Err(err).Str("file", filePath).Msg("Failed to process history file")
		return
	}

	if len(events) > 0 && c.handler != nil {
		if err := c.handler(events); err != nil {
			log.Error().Err(err).Msg("Failed to handle terminal events")
		}
	}
}

func (c *TerminalCollector) collectFromHistory(filePath string) ([]models.Event, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Get file info for size
	info, err := file.Stat()
	if err != nil {
		return nil, err
	}

	c.mu.RLock()
	lastPos := c.lastPositions[filePath]
	c.mu.RUnlock()

	// If file was truncated (smaller than last position), reset to beginning
	if info.Size() < lastPos {
		lastPos = 0
	}

	// No new content
	if info.Size() == lastPos {
		return nil, nil
	}

	// Seek to last position
	if lastPos > 0 {
		if _, err := file.Seek(lastPos, 0); err != nil {
			return nil, err
		}
	}

	shell := c.detectShell(filePath)
	var events []models.Event
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		line := scanner.Text()
		command := c.parseHistoryLine(line, shell)

		if command == "" {
			continue
		}

		// Apply security filters
		if c.shouldFilter(command) {
			log.Debug().Str("command", truncateForLog(command, 50)).Msg("Filtered sensitive command")
			continue
		}

		event := c.createEvent(command, shell)
		events = append(events, event)
	}

	if err := scanner.Err(); err != nil {
		return events, err
	}

	// Update last position
	newPos, _ := file.Seek(0, 1) // Get current position
	c.mu.Lock()
	c.lastPositions[filePath] = newPos
	c.mu.Unlock()

	if len(events) > 0 {
		log.Debug().
			Str("file", filePath).
			Int("count", len(events)).
			Msg("Collected terminal events")
	}

	return events, nil
}

func (c *TerminalCollector) detectShell(filePath string) string {
	fileName := filepath.Base(filePath)
	switch {
	case strings.Contains(fileName, "zsh"):
		return "zsh"
	case strings.Contains(fileName, "bash"):
		return "bash"
	case strings.Contains(fileName, "fish"):
		return "fish"
	default:
		return "unknown"
	}
}

func (c *TerminalCollector) parseHistoryLine(line, shell string) string {
	line = strings.TrimSpace(line)
	if line == "" {
		return ""
	}

	switch shell {
	case "zsh":
		// zsh extended history format: : timestamp:0;command
		if strings.HasPrefix(line, ": ") {
			parts := strings.SplitN(line, ";", 2)
			if len(parts) == 2 {
				return strings.TrimSpace(parts[1])
			}
		}
		// Simple format or already plain command
		if strings.HasPrefix(line, ":") {
			return ""
		}
		return line

	case "bash":
		// bash history is usually plain commands
		// Skip comments and empty lines
		if strings.HasPrefix(line, "#") {
			return ""
		}
		return line

	default:
		return line
	}
}

func (c *TerminalCollector) shouldFilter(command string) bool {
	lowerCmd := strings.ToLower(command)

	for _, pattern := range c.filterPatterns {
		if pattern.MatchString(lowerCmd) {
			return true
		}
	}

	return false
}

func (c *TerminalCollector) createEvent(command, shell string) models.Event {
	// Try to get current working directory
	cwd, _ := os.Getwd()

	return models.Event{
		ID:             uuid.New().String(),
		EventType:      models.EventTypeTerminal,
		EventAction:    "execute",
		Title:          truncateForLog(command, 100),
		Content:        command,
		LocalTimestamp: time.Now(),
		Metadata: map[string]any{
			"command":           command,
			"shell":             shell,
			"working_directory": cwd,
		},
		SyncStatus: models.SyncStatusPending,
		CreatedAt:  time.Now(),
	}
}

// truncateForLog truncates a string for logging purposes
func truncateForLog(s string, maxLen int) string {
	// Remove newlines for cleaner logging
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\r", " ")

	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

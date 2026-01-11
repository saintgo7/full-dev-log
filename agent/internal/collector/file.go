package collector

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/saintgo7/devlog-hub/agent/internal/config"
	"github.com/saintgo7/devlog-hub/agent/internal/models"
)

// FileCollector watches for file changes
type FileCollector struct {
	config    *config.FileCollectorConfig
	watchDirs []string
	handler   EventHandler
	watcher   *fsnotify.Watcher
	ctx       context.Context
	cancel    context.CancelFunc
	running   bool
}

// NewFileCollector creates a new file collector
func NewFileCollector(cfg *config.FileCollectorConfig, watchDirs []string, handler EventHandler) *FileCollector {
	return &FileCollector{
		config:    cfg,
		watchDirs: watchDirs,
		handler:   handler,
	}
}

func (c *FileCollector) Name() string {
	return "file"
}

func (c *FileCollector) Start() error {
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

	// Add watch directories
	for _, dir := range c.watchDirs {
		if err := c.addWatchRecursive(dir); err != nil {
			log.Warn().Err(err).Str("dir", dir).Msg("Failed to watch directory")
		}
	}

	go c.watchLoop()
	log.Info().Msg("File collector started")
	return nil
}

func (c *FileCollector) Stop() error {
	if !c.running {
		return nil
	}

	c.cancel()
	c.watcher.Close()
	c.running = false
	log.Info().Msg("File collector stopped")
	return nil
}

func (c *FileCollector) Collect() ([]models.Event, error) {
	// File collector is event-driven, not polling-based
	return nil, nil
}

func (c *FileCollector) addWatchRecursive(dir string) error {
	return filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Skip errors
		}

		if info.IsDir() {
			// Skip ignored directories
			for _, ignored := range c.config.IgnoreDirs {
				if info.Name() == ignored {
					return filepath.SkipDir
				}
			}

			return c.watcher.Add(path)
		}
		return nil
	})
}

func (c *FileCollector) watchLoop() {
	// Debounce events
	eventBuffer := make(map[string]fsnotify.Event)
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-c.ctx.Done():
			return

		case event, ok := <-c.watcher.Events:
			if !ok {
				return
			}

			if c.shouldProcess(event.Name) {
				eventBuffer[event.Name] = event
			}

		case err, ok := <-c.watcher.Errors:
			if !ok {
				return
			}
			log.Error().Err(err).Msg("File watcher error")

		case <-ticker.C:
			if len(eventBuffer) > 0 {
				c.processEvents(eventBuffer)
				eventBuffer = make(map[string]fsnotify.Event)
			}
		}
	}
}

func (c *FileCollector) shouldProcess(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	for _, allowed := range c.config.Extensions {
		if ext == allowed {
			return true
		}
	}
	return false
}

func (c *FileCollector) processEvents(buffer map[string]fsnotify.Event) {
	var events []models.Event

	for path, fsEvent := range buffer {
		action := "modify"
		switch {
		case fsEvent.Op&fsnotify.Create == fsnotify.Create:
			action = "create"
		case fsEvent.Op&fsnotify.Remove == fsnotify.Remove:
			action = "delete"
		case fsEvent.Op&fsnotify.Rename == fsnotify.Rename:
			action = "rename"
		}

		event := models.Event{
			ID:             uuid.New().String(),
			EventType:      models.EventTypeFile,
			EventAction:    action,
			Title:          filepath.Base(path),
			FilePath:       path,
			LocalTimestamp: time.Now(),
			Metadata: map[string]any{
				"extension": filepath.Ext(path),
				"directory": filepath.Dir(path),
			},
			SyncStatus: models.SyncStatusPending,
			CreatedAt:  time.Now(),
		}
		events = append(events, event)
	}

	if len(events) > 0 && c.handler != nil {
		if err := c.handler(events); err != nil {
			log.Error().Err(err).Msg("Failed to handle file events")
		}
	}

	log.Debug().Int("count", len(events)).Msg("Processed file events")
}

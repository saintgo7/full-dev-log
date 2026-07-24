package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/saintgo7/devlog-hub/agent/internal/collector"
	"github.com/saintgo7/devlog-hub/agent/internal/config"
	"github.com/saintgo7/devlog-hub/agent/internal/models"
	"github.com/saintgo7/devlog-hub/agent/internal/storage"
	"github.com/saintgo7/devlog-hub/agent/internal/sync"
	"github.com/saintgo7/devlog-hub/agent/pkg/version"
)

func main() {
	// Command line flags
	configPath := flag.String("config", config.GetConfigPath(), "Path to config file")
	showVersion := flag.Bool("version", false, "Show version")
	flag.Parse()

	if *showVersion {
		fmt.Println(version.Info())
		os.Exit(0)
	}

	// Load configuration
	cfg, err := config.Load(*configPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// Setup logging
	setupLogging(cfg.Logging)
	log.Info().Str("version", version.Short()).Msg("Starting DevLog Agent")

	// Validate configuration
	if cfg.Server.APIToken == "" {
		log.Fatal().Msg("API token not configured. Please set server.api_token in config.")
	}

	if len(cfg.Agent.WatchDirs) == 0 {
		log.Fatal().Msg("No watch directories configured. Please set agent.watch_dirs in config.")
	}

	// Initialize storage
	store := storage.NewSQLiteStorage(cfg.Storage.DBPath)
	if err := store.Init(); err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize storage")
	}
	defer store.Close()

	// Event handler that saves to storage
	eventHandler := func(events []models.Event) error {
		return store.SaveBatch(events)
	}

	// Initialize collectors
	var collectors []collector.Collector

	if cfg.Collectors.Git.Enabled {
		gitCollector := collector.NewGitCollector(
			&cfg.Collectors.Git,
			cfg.Agent.WatchDirs,
			eventHandler,
		)
		collectors = append(collectors, gitCollector)
	}

	if cfg.Collectors.File.Enabled {
		fileCollector := collector.NewFileCollector(
			&cfg.Collectors.File,
			cfg.Agent.WatchDirs,
			eventHandler,
		)
		collectors = append(collectors, fileCollector)
	}

	if cfg.Collectors.Terminal.Enabled {
		terminalCollector := collector.NewTerminalCollector(
			&cfg.Collectors.Terminal,
			eventHandler,
		)
		collectors = append(collectors, terminalCollector)
	}

	// Initialize syncer
	syncer := sync.NewSyncer(
		&cfg.Sync,
		cfg.Server.URL,
		cfg.Server.APIToken,
		store,
	)

	// Start all collectors
	for _, c := range collectors {
		if err := c.Start(); err != nil {
			log.Error().Err(err).Str("collector", c.Name()).Msg("Failed to start collector")
		} else {
			log.Info().Str("collector", c.Name()).Msg("Collector started")
		}
	}

	// Start syncer
	if err := syncer.Start(); err != nil {
		log.Fatal().Err(err).Msg("Failed to start syncer")
	}

	log.Info().
		Strs("watch_dirs", cfg.Agent.WatchDirs).
		Dur("sync_interval", cfg.Sync.Interval).
		Msg("Agent running")

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	log.Info().Msg("Shutting down...")

	// Stop collectors
	for _, c := range collectors {
		c.Stop()
	}

	// Stop syncer
	syncer.Stop()

	log.Info().Msg("Agent stopped")
}

func setupLogging(cfg config.LoggingConfig) {
	// Set log level
	level, err := zerolog.ParseLevel(cfg.Level)
	if err != nil {
		level = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(level)

	// Console format for development
	if cfg.Format == "console" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}
}

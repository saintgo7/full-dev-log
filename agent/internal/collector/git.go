package collector

import (
	"context"
	"fmt"
	"path/filepath"
	"sync"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/saintgo7/devlog-hub/agent/internal/config"
	"github.com/saintgo7/devlog-hub/agent/internal/models"
)

// GitCollector collects git events from repositories
type GitCollector struct {
	config       *config.GitCollectorConfig
	watchDirs    []string
	handler      EventHandler
	lastCommits  map[string]string // repo path -> last commit hash
	mu           sync.RWMutex
	ctx          context.Context
	cancel       context.CancelFunc
	running      bool
}

// NewGitCollector creates a new git collector
func NewGitCollector(cfg *config.GitCollectorConfig, watchDirs []string, handler EventHandler) *GitCollector {
	return &GitCollector{
		config:      cfg,
		watchDirs:   watchDirs,
		handler:     handler,
		lastCommits: make(map[string]string),
	}
}

func (c *GitCollector) Name() string {
	return "git"
}

func (c *GitCollector) Start() error {
	if c.running {
		return nil
	}

	c.ctx, c.cancel = context.WithCancel(context.Background())
	c.running = true

	go c.pollLoop()
	log.Info().Msg("Git collector started")
	return nil
}

func (c *GitCollector) Stop() error {
	if !c.running {
		return nil
	}

	c.cancel()
	c.running = false
	log.Info().Msg("Git collector stopped")
	return nil
}

func (c *GitCollector) pollLoop() {
	ticker := time.NewTicker(c.config.PollInterval)
	defer ticker.Stop()

	// Initial collection
	c.collectAndHandle()

	for {
		select {
		case <-c.ctx.Done():
			return
		case <-ticker.C:
			c.collectAndHandle()
		}
	}
}

func (c *GitCollector) collectAndHandle() {
	events, err := c.Collect()
	if err != nil {
		log.Error().Err(err).Msg("Failed to collect git events")
		return
	}

	if len(events) > 0 && c.handler != nil {
		if err := c.handler(events); err != nil {
			log.Error().Err(err).Msg("Failed to handle git events")
		}
	}
}

func (c *GitCollector) Collect() ([]models.Event, error) {
	var allEvents []models.Event

	for _, dir := range c.watchDirs {
		events, err := c.collectFromDir(dir)
		if err != nil {
			log.Warn().Err(err).Str("dir", dir).Msg("Failed to collect from directory")
			continue
		}
		allEvents = append(allEvents, events...)
	}

	return allEvents, nil
}

func (c *GitCollector) collectFromDir(dir string) ([]models.Event, error) {
	// Find git repositories
	repos := findGitRepos(dir)
	var events []models.Event

	for _, repoPath := range repos {
		repoEvents, err := c.collectFromRepo(repoPath)
		if err != nil {
			log.Warn().Err(err).Str("repo", repoPath).Msg("Failed to collect from repo")
			continue
		}
		events = append(events, repoEvents...)
	}

	return events, nil
}

func (c *GitCollector) collectFromRepo(repoPath string) ([]models.Event, error) {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repo: %w", err)
	}

	head, err := repo.Head()
	if err != nil {
		return nil, fmt.Errorf("failed to get HEAD: %w", err)
	}

	currentHash := head.Hash().String()

	c.mu.RLock()
	lastHash := c.lastCommits[repoPath]
	c.mu.RUnlock()

	if lastHash == currentHash {
		return nil, nil // No new commits
	}

	var events []models.Event

	// Get commit log
	commitIter, err := repo.Log(&git.LogOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get log: %w", err)
	}

	// Collect new commits
	err = commitIter.ForEach(func(commit *object.Commit) error {
		if commit.Hash.String() == lastHash {
			return fmt.Errorf("reached last known commit")
		}

		event := models.Event{
			ID:             uuid.New().String(),
			EventType:      models.EventTypeGit,
			EventAction:    "commit",
			Title:          truncate(commit.Message, 100),
			Content:        commit.Message,
			GitBranch:      head.Name().Short(),
			GitCommitHash:  commit.Hash.String(),
			LocalTimestamp: commit.Author.When,
			Metadata: map[string]any{
				"author":     commit.Author.Name,
				"authorEmail": commit.Author.Email,
				"repoPath":   repoPath,
				"repoName":   filepath.Base(repoPath),
			},
			SyncStatus: models.SyncStatusPending,
			CreatedAt:  time.Now(),
		}
		events = append(events, event)
		return nil
	})

	// Update last known commit
	c.mu.Lock()
	c.lastCommits[repoPath] = currentHash
	c.mu.Unlock()

	log.Debug().
		Str("repo", repoPath).
		Int("events", len(events)).
		Msg("Collected git events")

	return events, nil
}

func findGitRepos(dir string) []string {
	var repos []string

	// Check if dir itself is a git repo
	if _, err := git.PlainOpen(dir); err == nil {
		return []string{dir}
	}

	// Search subdirectories (1 level deep)
	entries, err := filepath.Glob(filepath.Join(dir, "*", ".git"))
	if err != nil {
		return repos
	}

	for _, entry := range entries {
		repos = append(repos, filepath.Dir(entry))
	}

	return repos
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

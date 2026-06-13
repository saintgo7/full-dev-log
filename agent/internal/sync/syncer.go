package sync

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/saintgo7/devlog-hub/agent/internal/config"
	"github.com/saintgo7/devlog-hub/agent/internal/storage"
)

// Syncer handles event synchronization with the server
type Syncer struct {
	config     *config.SyncConfig
	serverURL  string
	apiToken   string
	storage    storage.Storage
	httpClient *http.Client
	ctx        context.Context
	cancel     context.CancelFunc
	running    bool
}

// BatchRequest represents a batch of events to sync
type BatchRequest struct {
	Events []EventPayload `json:"events"`
}

// EventPayload is the event format for API
type EventPayload struct {
	EventType      string         `json:"eventType"`
	EventAction    string         `json:"eventAction"`
	Title          string         `json:"title,omitempty"`
	Content        string         `json:"content,omitempty"`
	Metadata       map[string]any `json:"metadata"`
	FilePath       string         `json:"filePath,omitempty"`
	GitBranch      string         `json:"gitBranch,omitempty"`
	GitCommitHash  string         `json:"gitCommitHash,omitempty"`
	LocalTimestamp string         `json:"localTimestamp"`
}

// BatchResponse is the response from batch sync API
type BatchResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Processed int `json:"processed"`
		Failed    int `json:"failed"`
	} `json:"data"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// NewSyncer creates a new syncer
func NewSyncer(cfg *config.SyncConfig, serverURL, apiToken string, store storage.Storage) *Syncer {
	return &Syncer{
		config:    cfg,
		serverURL: serverURL,
		apiToken:  apiToken,
		storage:   store,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Start begins the sync loop
func (s *Syncer) Start() error {
	if s.running {
		return nil
	}

	s.ctx, s.cancel = context.WithCancel(context.Background())
	s.running = true

	go s.syncLoop()
	log.Info().Msg("Syncer started")
	return nil
}

// Stop stops the syncer
func (s *Syncer) Stop() error {
	if !s.running {
		return nil
	}

	s.cancel()
	s.running = false
	log.Info().Msg("Syncer stopped")
	return nil
}

func (s *Syncer) syncLoop() {
	ticker := time.NewTicker(s.config.Interval)
	defer ticker.Stop()

	// Initial sync
	s.sync()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			s.sync()
		}
	}
}

func (s *Syncer) sync() {
	events, err := s.storage.GetPending(s.config.BatchSize)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get pending events")
		return
	}

	if len(events) == 0 {
		return
	}

	log.Debug().Int("count", len(events)).Msg("Syncing events")

	// Convert to API payload
	payloads := make([]EventPayload, len(events))
	ids := make([]string, len(events))
	for i, event := range events {
		payloads[i] = EventPayload{
			EventType:      string(event.EventType),
			EventAction:    event.EventAction,
			Title:          event.Title,
			Content:        event.Content,
			Metadata:       event.Metadata,
			FilePath:       event.FilePath,
			GitBranch:      event.GitBranch,
			GitCommitHash:  event.GitCommitHash,
			LocalTimestamp: event.LocalTimestamp.Format(time.RFC3339),
		}
		ids[i] = event.ID
	}

	// Send to server
	resp, err := s.sendBatch(payloads)
	if err != nil {
		log.Error().Err(err).Msg("Failed to sync events")
		s.storage.MarkFailed(ids)
		return
	}

	if resp.Success {
		s.storage.MarkSynced(ids)
		log.Info().
			Int("processed", resp.Data.Processed).
			Int("failed", resp.Data.Failed).
			Msg("Events synced successfully")
	} else {
		log.Error().
			Str("code", resp.Error.Code).
			Str("message", resp.Error.Message).
			Msg("Server rejected events")
		s.storage.MarkFailed(ids)
	}
}

func (s *Syncer) sendBatch(events []EventPayload) (*BatchResponse, error) {
	body := BatchRequest{Events: events}
	data, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal events: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/events/batch", s.serverURL)
	req, err := http.NewRequestWithContext(s.ctx, "POST", url, bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	var result BatchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if resp.StatusCode >= 400 {
		if result.Error != nil {
			return &result, fmt.Errorf("server error: %s", result.Error.Message)
		}
		return nil, fmt.Errorf("server error: status %d", resp.StatusCode)
	}

	return &result, nil
}

// SyncNow triggers an immediate sync
func (s *Syncer) SyncNow() {
	go s.sync()
}

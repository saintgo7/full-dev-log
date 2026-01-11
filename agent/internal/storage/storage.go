package storage

import (
	"github.com/saintgo7/devlog-hub/agent/internal/models"
)

// Storage is the interface for event persistence
type Storage interface {
	// Init initializes the storage
	Init() error

	// Close closes the storage
	Close() error

	// Save saves an event
	Save(event models.Event) error

	// SaveBatch saves multiple events
	SaveBatch(events []models.Event) error

	// GetPending returns events pending sync
	GetPending(limit int) ([]models.Event, error)

	// MarkSynced marks events as synced
	MarkSynced(ids []string) error

	// MarkFailed marks events as failed
	MarkFailed(ids []string) error

	// GetStats returns storage statistics
	GetStats() (*Stats, error)
}

// Stats represents storage statistics
type Stats struct {
	TotalEvents   int64
	PendingEvents int64
	SyncedEvents  int64
	FailedEvents  int64
}

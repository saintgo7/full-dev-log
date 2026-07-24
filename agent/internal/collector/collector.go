package collector

import (
	"github.com/saintgo7/devlog-hub/agent/internal/models"
)

// Collector is the interface that all collectors must implement
type Collector interface {
	// Name returns the collector name
	Name() string

	// Collect gathers events and returns them
	Collect() ([]models.Event, error)

	// Start begins the collector's background process
	Start() error

	// Stop stops the collector
	Stop() error
}

// EventHandler is called when new events are collected
type EventHandler func(events []models.Event) error

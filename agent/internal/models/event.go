package models

import (
	"encoding/json"
	"time"
)

// EventType represents the type of development event
type EventType string

const (
	EventTypeGit      EventType = "git"
	EventTypeFile     EventType = "file"
	EventTypeTerminal EventType = "terminal"
	EventTypeManual   EventType = "manual"
)

// Event represents a development activity event
type Event struct {
	ID             string            `json:"id"`
	EventType      EventType         `json:"eventType"`
	EventAction    string            `json:"eventAction"`
	Title          string            `json:"title,omitempty"`
	Content        string            `json:"content,omitempty"`
	Metadata       map[string]any    `json:"metadata"`
	FilePath       string            `json:"filePath,omitempty"`
	GitBranch      string            `json:"gitBranch,omitempty"`
	GitCommitHash  string            `json:"gitCommitHash,omitempty"`
	LocalTimestamp time.Time         `json:"localTimestamp"`
	SyncStatus     SyncStatus        `json:"-"`
	RetryCount     int               `json:"-"`
	CreatedAt      time.Time         `json:"-"`
}

// SyncStatus represents the synchronization status of an event
type SyncStatus string

const (
	SyncStatusPending SyncStatus = "pending"
	SyncStatusSynced  SyncStatus = "synced"
	SyncStatusFailed  SyncStatus = "failed"
)

// ToJSON converts the event to JSON bytes
func (e *Event) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}

// MetadataJSON returns metadata as JSON string
func (e *Event) MetadataJSON() string {
	if e.Metadata == nil {
		return "{}"
	}
	data, err := json.Marshal(e.Metadata)
	if err != nil {
		return "{}"
	}
	return string(data)
}

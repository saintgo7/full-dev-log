package storage

import (
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/saintgo7/devlog-hub/agent/internal/models"
)

// SQLiteStorage implements Storage using SQLite
type SQLiteStorage struct {
	db     *sql.DB
	dbPath string
}

// NewSQLiteStorage creates a new SQLite storage
func NewSQLiteStorage(dbPath string) *SQLiteStorage {
	return &SQLiteStorage{
		dbPath: dbPath,
	}
}

func (s *SQLiteStorage) Init() error {
	// Ensure directory exists
	dir := filepath.Dir(s.dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	db, err := sql.Open("sqlite3", s.dbPath)
	if err != nil {
		return err
	}
	s.db = db

	// Create tables
	schema := `
	CREATE TABLE IF NOT EXISTS events (
		id TEXT PRIMARY KEY,
		event_type TEXT NOT NULL,
		event_action TEXT NOT NULL,
		title TEXT,
		content TEXT,
		metadata TEXT DEFAULT '{}',
		file_path TEXT,
		git_branch TEXT,
		git_commit_hash TEXT,
		local_timestamp DATETIME NOT NULL,
		sync_status TEXT DEFAULT 'pending',
		retry_count INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_events_sync_status ON events(sync_status);
	CREATE INDEX IF NOT EXISTS idx_events_local_timestamp ON events(local_timestamp);
	`

	_, err = s.db.Exec(schema)
	return err
}

func (s *SQLiteStorage) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

func (s *SQLiteStorage) Save(event models.Event) error {
	return s.SaveBatch([]models.Event{event})
}

func (s *SQLiteStorage) SaveBatch(events []models.Event) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT OR REPLACE INTO events
		(id, event_type, event_action, title, content, metadata, file_path, git_branch, git_commit_hash, local_timestamp, sync_status, retry_count, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, event := range events {
		metadata, _ := json.Marshal(event.Metadata)
		_, err = stmt.Exec(
			event.ID,
			event.EventType,
			event.EventAction,
			event.Title,
			event.Content,
			string(metadata),
			event.FilePath,
			event.GitBranch,
			event.GitCommitHash,
			event.LocalTimestamp,
			event.SyncStatus,
			event.RetryCount,
			event.CreatedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *SQLiteStorage) GetPending(limit int) ([]models.Event, error) {
	rows, err := s.db.Query(`
		SELECT id, event_type, event_action, title, content, metadata, file_path, git_branch, git_commit_hash, local_timestamp, sync_status, retry_count, created_at
		FROM events
		WHERE sync_status = 'pending'
		ORDER BY local_timestamp ASC
		LIMIT ?
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var event models.Event
		var metadata string
		var syncStatus string

		err := rows.Scan(
			&event.ID,
			&event.EventType,
			&event.EventAction,
			&event.Title,
			&event.Content,
			&metadata,
			&event.FilePath,
			&event.GitBranch,
			&event.GitCommitHash,
			&event.LocalTimestamp,
			&syncStatus,
			&event.RetryCount,
			&event.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		json.Unmarshal([]byte(metadata), &event.Metadata)
		event.SyncStatus = models.SyncStatus(syncStatus)
		events = append(events, event)
	}

	return events, nil
}

func (s *SQLiteStorage) MarkSynced(ids []string) error {
	if len(ids) == 0 {
		return nil
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`UPDATE events SET sync_status = 'synced' WHERE id = ?`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, id := range ids {
		if _, err := stmt.Exec(id); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *SQLiteStorage) MarkFailed(ids []string) error {
	if len(ids) == 0 {
		return nil
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		UPDATE events
		SET sync_status = CASE WHEN retry_count >= 2 THEN 'failed' ELSE 'pending' END,
		    retry_count = retry_count + 1
		WHERE id = ?
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, id := range ids {
		if _, err := stmt.Exec(id); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *SQLiteStorage) GetStats() (*Stats, error) {
	var stats Stats

	err := s.db.QueryRow(`SELECT COUNT(*) FROM events`).Scan(&stats.TotalEvents)
	if err != nil {
		return nil, err
	}

	err = s.db.QueryRow(`SELECT COUNT(*) FROM events WHERE sync_status = 'pending'`).Scan(&stats.PendingEvents)
	if err != nil {
		return nil, err
	}

	err = s.db.QueryRow(`SELECT COUNT(*) FROM events WHERE sync_status = 'synced'`).Scan(&stats.SyncedEvents)
	if err != nil {
		return nil, err
	}

	err = s.db.QueryRow(`SELECT COUNT(*) FROM events WHERE sync_status = 'failed'`).Scan(&stats.FailedEvents)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

// Cleanup removes old synced events
func (s *SQLiteStorage) Cleanup(olderThan time.Duration) error {
	threshold := time.Now().Add(-olderThan)
	_, err := s.db.Exec(`DELETE FROM events WHERE sync_status = 'synced' AND created_at < ?`, threshold)
	return err
}

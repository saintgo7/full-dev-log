package collector

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/saintgo7/devlog-hub/agent/internal/config"
	"github.com/saintgo7/devlog-hub/agent/internal/models"
)

func TestNewTerminalCollector(t *testing.T) {
	cfg := &config.TerminalCollectorConfig{
		Enabled:        true,
		HistoryFiles:   []string{"/tmp/.test_history"},
		FilterPatterns: []string{"password", "token"},
		PollInterval:   10 * time.Second,
	}

	collector := NewTerminalCollector(cfg, nil)

	if collector == nil {
		t.Fatal("Expected collector to be created")
	}

	if collector.Name() != "terminal" {
		t.Errorf("Expected name 'terminal', got '%s'", collector.Name())
	}

	if len(collector.filterPatterns) != 2 {
		t.Errorf("Expected 2 filter patterns, got %d", len(collector.filterPatterns))
	}
}

func TestTerminalCollector_ShouldFilter(t *testing.T) {
	cfg := &config.TerminalCollectorConfig{
		Enabled:        true,
		FilterPatterns: []string{"password", "token", "secret"},
	}

	collector := NewTerminalCollector(cfg, nil)

	tests := []struct {
		command  string
		expected bool
	}{
		{"ls -la", false},
		{"git status", false},
		{"export PASSWORD=test", true},
		{"export password=test", true},
		{"echo $TOKEN", true},
		{"SECRET_KEY=abc", true},
		{"cat file.txt", false},
		{"npm install", false},
		{"set api_token=xyz", true},
	}

	for _, tt := range tests {
		result := collector.shouldFilter(tt.command)
		if result != tt.expected {
			t.Errorf("shouldFilter(%q) = %v, expected %v", tt.command, result, tt.expected)
		}
	}
}

func TestTerminalCollector_ParseHistoryLine(t *testing.T) {
	cfg := &config.TerminalCollectorConfig{
		Enabled: true,
	}
	collector := NewTerminalCollector(cfg, nil)

	tests := []struct {
		line     string
		shell    string
		expected string
	}{
		// zsh extended history format
		{": 1704067200:0;ls -la", "zsh", "ls -la"},
		{": 1704067200:0;git status", "zsh", "git status"},
		// Plain commands
		{"ls -la", "zsh", "ls -la"},
		{"git commit -m 'test'", "bash", "git commit -m 'test'"},
		// Comments (bash)
		{"# comment", "bash", ""},
		// Empty lines
		{"", "bash", ""},
		{"   ", "bash", ""},
	}

	for _, tt := range tests {
		result := collector.parseHistoryLine(tt.line, tt.shell)
		if result != tt.expected {
			t.Errorf("parseHistoryLine(%q, %q) = %q, expected %q", tt.line, tt.shell, result, tt.expected)
		}
	}
}

func TestTerminalCollector_DetectShell(t *testing.T) {
	cfg := &config.TerminalCollectorConfig{
		Enabled: true,
	}
	collector := NewTerminalCollector(cfg, nil)

	tests := []struct {
		path     string
		expected string
	}{
		{"/home/user/.zsh_history", "zsh"},
		{"/home/user/.bash_history", "bash"},
		{"/home/user/.fish_history", "fish"},
		{"/home/user/.history", "unknown"},
	}

	for _, tt := range tests {
		result := collector.detectShell(tt.path)
		if result != tt.expected {
			t.Errorf("detectShell(%q) = %q, expected %q", tt.path, result, tt.expected)
		}
	}
}

func TestTerminalCollector_CreateEvent(t *testing.T) {
	cfg := &config.TerminalCollectorConfig{
		Enabled: true,
	}
	collector := NewTerminalCollector(cfg, nil)

	event := collector.createEvent("git status", "zsh")

	if event.EventType != models.EventTypeTerminal {
		t.Errorf("Expected event type 'terminal', got '%s'", event.EventType)
	}

	if event.EventAction != "execute" {
		t.Errorf("Expected event action 'execute', got '%s'", event.EventAction)
	}

	if event.Content != "git status" {
		t.Errorf("Expected content 'git status', got '%s'", event.Content)
	}

	if event.Metadata["shell"] != "zsh" {
		t.Errorf("Expected shell 'zsh' in metadata, got '%v'", event.Metadata["shell"])
	}

	if event.Metadata["command"] != "git status" {
		t.Errorf("Expected command 'git status' in metadata, got '%v'", event.Metadata["command"])
	}
}

func TestTerminalCollector_CollectFromHistory(t *testing.T) {
	// Create temp history file
	tmpDir := t.TempDir()
	historyFile := filepath.Join(tmpDir, ".test_history")

	// Write some history
	historyContent := `ls -la
git status
cd /home/user
export PASSWORD=secret
npm install
`
	if err := os.WriteFile(historyFile, []byte(historyContent), 0644); err != nil {
		t.Fatalf("Failed to create test history file: %v", err)
	}

	var collectedEvents []models.Event
	handler := func(events []models.Event) error {
		collectedEvents = append(collectedEvents, events...)
		return nil
	}

	cfg := &config.TerminalCollectorConfig{
		Enabled:        true,
		HistoryFiles:   []string{historyFile},
		FilterPatterns: []string{"password"},
		PollInterval:   100 * time.Millisecond,
	}

	collector := NewTerminalCollector(cfg, handler)

	// Reset last position to read from beginning
	collector.lastPositions[historyFile] = 0

	events, err := collector.collectFromHistory(historyFile)
	if err != nil {
		t.Fatalf("collectFromHistory failed: %v", err)
	}

	// Should collect 4 events (ls, git, cd, npm) and filter out PASSWORD
	if len(events) != 4 {
		t.Errorf("Expected 4 events, got %d", len(events))
		for i, e := range events {
			t.Logf("Event %d: %s", i, e.Content)
		}
	}

	// Verify PASSWORD command was filtered
	for _, e := range events {
		if e.Content == "export PASSWORD=secret" {
			t.Error("PASSWORD command should have been filtered")
		}
	}
}

func TestTerminalCollector_StartStop(t *testing.T) {
	tmpDir := t.TempDir()
	historyFile := filepath.Join(tmpDir, ".test_history")

	// Create empty history file
	if err := os.WriteFile(historyFile, []byte(""), 0644); err != nil {
		t.Fatalf("Failed to create test history file: %v", err)
	}

	cfg := &config.TerminalCollectorConfig{
		Enabled:        true,
		HistoryFiles:   []string{historyFile},
		FilterPatterns: []string{},
		PollInterval:   100 * time.Millisecond,
	}

	collector := NewTerminalCollector(cfg, nil)

	// Start
	if err := collector.Start(); err != nil {
		t.Fatalf("Start failed: %v", err)
	}

	if !collector.running {
		t.Error("Expected collector to be running")
	}

	// Double start should be idempotent
	if err := collector.Start(); err != nil {
		t.Fatalf("Second Start failed: %v", err)
	}

	// Stop
	if err := collector.Stop(); err != nil {
		t.Fatalf("Stop failed: %v", err)
	}

	if collector.running {
		t.Error("Expected collector to be stopped")
	}

	// Double stop should be idempotent
	if err := collector.Stop(); err != nil {
		t.Fatalf("Second Stop failed: %v", err)
	}
}

func TestTruncateForLog(t *testing.T) {
	tests := []struct {
		input    string
		maxLen   int
		expected string
	}{
		{"short", 10, "short"},
		{"this is a very long command", 10, "this is..."},
		{"with\nnewline", 20, "with newline"},
		{"with\r\nwindows", 20, "with  windows"},
	}

	for _, tt := range tests {
		result := truncateForLog(tt.input, tt.maxLen)
		if result != tt.expected {
			t.Errorf("truncateForLog(%q, %d) = %q, expected %q", tt.input, tt.maxLen, result, tt.expected)
		}
	}
}

package config

import (
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

// Config represents the agent configuration
type Config struct {
	Server       ServerConfig       `yaml:"server"`
	Agent        AgentConfig        `yaml:"agent"`
	Collectors   CollectorsConfig   `yaml:"collectors"`
	Storage      StorageConfig      `yaml:"storage"`
	Sync         SyncConfig         `yaml:"sync"`
	Logging      LoggingConfig      `yaml:"logging"`
}

type ServerConfig struct {
	URL      string `yaml:"url"`
	APIToken string `yaml:"api_token"`
}

type AgentConfig struct {
	Name      string   `yaml:"name"`
	MachineID string   `yaml:"machine_id"`
	WatchDirs []string `yaml:"watch_dirs"`
}

type CollectorsConfig struct {
	Git      GitCollectorConfig      `yaml:"git"`
	File     FileCollectorConfig     `yaml:"file"`
	Terminal TerminalCollectorConfig `yaml:"terminal"`
}

type GitCollectorConfig struct {
	Enabled      bool          `yaml:"enabled"`
	PollInterval time.Duration `yaml:"poll_interval"`
}

type FileCollectorConfig struct {
	Enabled    bool     `yaml:"enabled"`
	Extensions []string `yaml:"extensions"`
	IgnoreDirs []string `yaml:"ignore_dirs"`
}

type TerminalCollectorConfig struct {
	Enabled bool `yaml:"enabled"`
}

type StorageConfig struct {
	DBPath string `yaml:"db_path"`
}

type SyncConfig struct {
	Interval   time.Duration `yaml:"interval"`
	BatchSize  int           `yaml:"batch_size"`
	MaxRetries int           `yaml:"max_retries"`
}

type LoggingConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

// DefaultConfig returns the default configuration
func DefaultConfig() *Config {
	homeDir, _ := os.UserHomeDir()
	dataDir := filepath.Join(homeDir, ".devlog-agent")

	return &Config{
		Server: ServerConfig{
			URL:      "http://localhost:3001",
			APIToken: "",
		},
		Agent: AgentConfig{
			Name:      "",
			MachineID: "",
			WatchDirs: []string{},
		},
		Collectors: CollectorsConfig{
			Git: GitCollectorConfig{
				Enabled:      true,
				PollInterval: 30 * time.Second,
			},
			File: FileCollectorConfig{
				Enabled:    true,
				Extensions: []string{".go", ".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".java", ".md"},
				IgnoreDirs: []string{"node_modules", ".git", "vendor", "dist", "build", "__pycache__"},
			},
			Terminal: TerminalCollectorConfig{
				Enabled: false,
			},
		},
		Storage: StorageConfig{
			DBPath: filepath.Join(dataDir, "events.db"),
		},
		Sync: SyncConfig{
			Interval:   5 * time.Minute,
			BatchSize:  100,
			MaxRetries: 3,
		},
		Logging: LoggingConfig{
			Level:  "info",
			Format: "console",
		},
	}
}

// Load loads configuration from a YAML file
func Load(path string) (*Config, error) {
	cfg := DefaultConfig()

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, err
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

// Save saves the configuration to a YAML file
func (c *Config) Save(path string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := yaml.Marshal(c)
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

// GetConfigPath returns the default config path
func GetConfigPath() string {
	homeDir, _ := os.UserHomeDir()
	return filepath.Join(homeDir, ".devlog-agent", "config.yaml")
}

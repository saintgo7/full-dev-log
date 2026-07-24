.PHONY: build build-all run clean test

BINARY_NAME=devlog-agent
VERSION=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
LDFLAGS=-ldflags "-X github.com/saintgo7/devlog-hub/agent/pkg/version.Version=$(VERSION) -X github.com/saintgo7/devlog-hub/agent/pkg/version.BuildTime=$(BUILD_TIME)"

# Build for current platform
build:
	go build $(LDFLAGS) -o bin/$(BINARY_NAME) ./cmd/devlog-agent

# Build for all platforms
build-all:
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-darwin-amd64 ./cmd/devlog-agent
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-darwin-arm64 ./cmd/devlog-agent
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-linux-amd64 ./cmd/devlog-agent
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-windows-amd64.exe ./cmd/devlog-agent

# Run locally
run: build
	./bin/$(BINARY_NAME)

# Clean build artifacts
clean:
	rm -rf bin/

# Run tests
test:
	go test -v ./...

# Install dependencies
deps:
	go mod download
	go mod tidy

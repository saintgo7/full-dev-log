# ============================================
# DevLog Hub - Go Agent Dockerfile
# Multi-stage build for minimal production image
# ============================================

# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build static binary with optimizations
# CGO_ENABLED=1 is required for sqlite3
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -X github.com/saintgo7/devlog-hub/agent/pkg/version.Version=1.0.0 -X github.com/saintgo7/devlog-hub/agent/pkg/version.BuildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    -o devlog-agent \
    ./cmd/devlog-agent

# ============================================
# Production stage (using alpine for sqlite support)
# ============================================
FROM alpine:3.19 AS production

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S devlog && \
    adduser -S devlog -u 1001 -G devlog

# Create directories for data and config
RUN mkdir -p /app/data /app/config && \
    chown -R devlog:devlog /app

# Copy binary from builder
COPY --from=builder --chown=devlog:devlog /app/devlog-agent ./

# Switch to non-root user
USER devlog

# Data volume
VOLUME ["/app/data", "/app/config"]

# Health check - verify process is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD pgrep devlog-agent || exit 1

# Default command
ENTRYPOINT ["./devlog-agent"]
CMD ["-config", "/app/config/config.yaml"]

# DevLog Hub

[![CI](https://github.com/saintgo7/full-dev-log/actions/workflows/ci.yml/badge.svg)](https://github.com/saintgo7/full-dev-log/actions/workflows/ci.yml)
[![Deploy Staging](https://github.com/saintgo7/full-dev-log/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/saintgo7/full-dev-log/actions/workflows/deploy-staging.yml)
[![Deploy Production](https://github.com/saintgo7/full-dev-log/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/saintgo7/full-dev-log/actions/workflows/deploy-production.yml)

개발 활동을 자동으로 수집하고 중앙에서 관리하는 플랫폼입니다.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Local Agent   │────▶│   API Server    │◀────│  Web Dashboard  │
│      (Go)       │     │   (Node.js)     │     │   (Next.js)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
   ┌─────────┐            ┌──────────┐
   │ SQLite  │            │PostgreSQL│
   └─────────┘            └──────────┘
```

## Quick Start

### Prerequisites
- Node.js 20+
- Go 1.21+
- Docker & Docker Compose

### Installation

```bash
# Clone repository
git clone https://github.com/saintgo7/full-dev-log.git
cd full-dev-log

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Development

```bash
# Start all services
chmod +x scripts/dev.sh
./scripts/dev.sh

# Or run individually:

# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Server
cd server && npm run dev

# 3. Web (new terminal)
cd web && npm run dev

# 4. Agent (new terminal)
cd agent && go build -o devlog-agent ./cmd/devlog-agent
./devlog-agent
```

### Access URLs
- Web Dashboard: http://localhost:3020
- API Server: http://localhost:3001

## Project Structure

```
devlog-hub/
├── agent/          # Go local agent
│   ├── cmd/        # Entry point
│   └── internal/   # Collectors, storage, sync
├── server/         # Node.js API server
│   ├── prisma/     # Database schema
│   └── src/        # Routes, services, middleware
├── web/            # Next.js frontend
│   └── src/        # App router, components, hooks
├── docs/           # Documentation
├── docker/         # Docker configurations
└── scripts/        # Utility scripts
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Agent** | Go 1.21, fsnotify, go-git, SQLite |
| **Server** | Node.js 20, Express, Prisma, PostgreSQL |
| **Web** | Next.js 14, React Query, Zustand, Tailwind CSS |
| **Infra** | Docker, Docker Compose |

## Features

- **FEAT-1**: Auto log collection (Git, File, Terminal)
- **FEAT-2**: Full-text search
- **FEAT-3**: Timeline dashboard
- **FEAT-4**: Project grouping
- **FEAT-5**: Report generation
- **FEAT-6**: Manual notes

## API Documentation

### Authentication

```bash
# Register
POST /api/v1/auth/register
{ "email": "user@example.com", "password": "password", "name": "User" }

# Login
POST /api/v1/auth/login
{ "email": "user@example.com", "password": "password" }

# Refresh Token
POST /api/v1/auth/refresh
{ "refreshToken": "..." }
```

### Events

```bash
# List events
GET /api/v1/events?type=git&limit=20

# Batch create (Agent)
POST /api/v1/events/batch
Authorization: Bearer <agent_token>
```

## Environment Variables

### Server (.env)
```env
DATABASE_URL=postgresql://devlog:devlog_secret@localhost:5432/devlog
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Agent (config.yaml)
```yaml
server:
  url: "http://localhost:3001"
  api_token: "<token-from-dashboard>"
```

## Documentation

- [PRD](docs/DOC-1_DevLogHub_PRD_2026-01-11.md)
- [TRD](docs/DOC-2_DevLogHub_TRD_2026-01-11.md)
- [User Flow](docs/DOC-3_DevLogHub_UserFlow_2026-01-11.md)
- [Database Design](docs/DOC-4_DevLogHub_DatabaseDesign_2026-01-11.md)
- [Design System](docs/DOC-5_DevLogHub_DesignSystem_2026-01-11.md)
- [Tasks](docs/DOC-6_DevLogHub_TASKS_2026-01-11.md)
- [Coding Convention](docs/DOC-7_DevLogHub_CodingConvention_2026-01-11.md)

## License

MIT

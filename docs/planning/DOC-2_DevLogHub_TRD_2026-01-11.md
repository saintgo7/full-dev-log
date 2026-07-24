---
session_id: devlog-hub-planning-2026-01-11
date: 2026-01-11
version: v1.0
project_name: DevLog Hub
document_type: TRD (기술 요구사항 정의서)
author: Claude + Developer
---

# DOC-2: DevLog Hub TRD (기술 요구사항 정의서)

## 1. 개요

### 1.1 문서 목적
DevLog Hub의 시스템 아키텍처, 기술 스택, 비기능 요구사항을 정의합니다.

### 1.2 문서 참조
| Doc ID | 참조 내용 |
|--------|----------|
| DOC-1 | FEAT-x 기능 요구사항 |
| DOC-4 | 데이터베이스 설계 |
| DOC-6 | 개발 태스크 분해 |

---

## 2. 시스템 아키텍처

### 2.1 고수준 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                               │
├──────────────────┬───────────────────────────────────────────────┤
│   Web Dashboard  │              Local Agents                      │
│   (Next.js 14)   │              (Go 1.21)                        │
│   Port: 3020     │              Multiple Machines                 │
└────────┬─────────┴──────────────────────┬────────────────────────┘
         │                                 │
         │ REST API / WebSocket            │ REST API
         │                                 │
┌────────▼─────────────────────────────────▼────────────────────────┐
│                        API Gateway Layer                          │
├───────────────────────────────────────────────────────────────────┤
│   Express.js Server (Node.js 20)                                  │
│   Port: 3001                                                      │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │ Middleware: CORS, Helmet, Rate Limit, Morgan, Auth           │ │
│   └─────────────────────────────────────────────────────────────┘ │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │ Routes: /auth, /agents, /events, /projects, /notes          │ │
│   └─────────────────────────────────────────────────────────────┘ │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │ WebSocket Hub: Socket.io (실시간 이벤트 브로드캐스트)         │ │
│   └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                        Data Layer                                 │
├───────────────────────────────────────────────────────────────────┤
│   PostgreSQL 15 (Primary Database)                                │
│   Port: 5432                                                      │
│   ORM: Prisma 5.8                                                 │
├───────────────────────────────────────────────────────────────────┤
│   Redis (Optional - Caching/Sessions)                             │
│   Port: 6379                                                      │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 컴포넌트 상세

#### 2.2.1 Web Dashboard (Frontend)

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 인증 페이지 그룹
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/        # 대시보드 페이지 그룹
│   │   │   ├── dashboard/
│   │   │   ├── timeline/
│   │   │   ├── agents/
│   │   │   ├── projects/
│   │   │   ├── notes/
│   │   │   ├── search/
│   │   │   └── settings/
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── providers.tsx       # React Query, Zustand
│   ├── components/
│   │   ├── ui/                 # 공통 UI 컴포넌트
│   │   ├── providers/          # Context Providers
│   │   └── realtime/           # WebSocket 컴포넌트
│   ├── hooks/                  # 커스텀 훅
│   ├── lib/                    # 유틸리티
│   ├── services/               # API 클라이언트
│   └── stores/                 # Zustand 스토어
└── tailwind.config.ts
```

#### 2.2.2 API Server (Backend)

```
server/
├── src/
│   ├── index.ts                # 진입점, 서버 초기화
│   ├── routes/
│   │   ├── index.ts            # 라우트 집계
│   │   ├── auth.routes.ts      # /api/v1/auth
│   │   ├── agent.routes.ts     # /api/v1/agents
│   │   ├── event.routes.ts     # /api/v1/events
│   │   ├── project.routes.ts   # /api/v1/projects
│   │   └── note.routes.ts      # /api/v1/notes
│   ├── controllers/            # 요청 핸들러
│   ├── services/               # 비즈니스 로직
│   ├── middlewares/            # 인증, 검증
│   ├── websocket/              # Socket.io 핸들러
│   └── utils/                  # 헬퍼 함수
└── prisma/
    └── schema.prisma           # DB 스키마
```

#### 2.2.3 Local Agent

```
agent/
├── cmd/
│   └── devlog-agent/
│       └── main.go             # 진입점
├── internal/
│   ├── collector/
│   │   ├── git.go              # Git 커밋 수집기
│   │   └── file.go             # 파일 변경 수집기
│   ├── config/
│   │   └── config.go           # YAML 설정 파서
│   ├── storage/
│   │   └── sqlite.go           # 로컬 SQLite
│   └── sync/
│       └── syncer.go           # 서버 동기화
└── go.mod
```

---

## 3. 기술 스택

### 3.1 기술 스택 매트릭스

| 레이어 | 기술 | 버전 | 선택 근거 |
|--------|------|------|----------|
| **Frontend** ||||
| Framework | Next.js | 14.0.4 | App Router, RSC, 최신 React |
| UI Library | React | 18.2.0 | 생태계, 팀 친숙도 |
| State (Server) | React Query | 5.17 | 캐싱, 자동 재검증 |
| State (Client) | Zustand | 4.4.7 | 단순함, 보일러플레이트 적음 |
| Styling | Tailwind CSS | 3.4.0 | 유틸리티 우선, 빠른 개발 |
| UI Components | Radix UI | - | 접근성, Headless |
| Icons | Lucide React | 0.303 | 일관된 디자인, 트리셰이킹 |
| **Backend** ||||
| Runtime | Node.js | 20.x | LTS, 성능 개선 |
| Framework | Express | 4.18.2 | 유연성, 생태계 |
| ORM | Prisma | 5.8.0 | 타입 안전, 마이그레이션 |
| Validation | Zod | 3.22.4 | 런타임 타입 검증 |
| Auth | jsonwebtoken | 9.0.2 | JWT 표준 |
| Hash | bcryptjs | 2.4.3 | 비밀번호 해싱 |
| WebSocket | Socket.io | 4.8.3 | 폴백, 룸 기능 |
| Security | Helmet | 7.1.0 | HTTP 헤더 보안 |
| **Agent** ||||
| Language | Go | 1.21+ | 크로스플랫폼, 단일 바이너리 |
| Git Library | go-git | 5.11.0 | 순수 Go Git 구현 |
| File Watch | fsnotify | 1.7.0 | 크로스플랫폼 파일 감시 |
| Database | sqlite3 | 1.14.19 | 설치 불필요 |
| Config | gopkg.in/yaml.v3 | 3.0.1 | YAML 파싱 |
| Logging | zerolog | 1.31.0 | 구조화된 로깅 |
| **Database** ||||
| Primary | PostgreSQL | 15 | ACID, JSONB, 확장성 |
| Local Buffer | SQLite | 3.x | 경량, 파일 기반 |
| Cache (옵션) | Redis | 7.x | 세션 캐싱 |
| **Infrastructure** ||||
| Container | Docker | 24.x | 일관된 환경 |
| Orchestration | Docker Compose | 2.x | 로컬 개발, 단일 서버 |

### 3.2 버전 호환성

```json
// server/package.json (주요 의존성)
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.8.0",
    "socket.io": "^4.8.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "express-rate-limit": "^7.1.5"
  }
}

// web/package.json (주요 의존성)
{
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "@tanstack/react-query": "^5.17",
    "zustand": "^4.4.7",
    "socket.io-client": "^4.8.3",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.303.0"
  }
}

// agent/go.mod
module devlog-agent

go 1.21

require (
    github.com/go-git/go-git/v5 v5.11.0
    github.com/fsnotify/fsnotify v1.7.0
    github.com/mattn/go-sqlite3 v1.14.19
    github.com/rs/zerolog v1.31.0
    github.com/google/uuid v1.5.0
    gopkg.in/yaml.v3 v3.0.1
)
```

---

## 4. API 설계

### 4.1 API 명세 요약

| 엔드포인트 | 메서드 | 인증 | FEAT 연결 | 설명 |
|------------|--------|------|-----------|------|
| `/api/v1/auth/register` | POST | - | - | 회원가입 |
| `/api/v1/auth/login` | POST | - | - | 로그인 |
| `/api/v1/auth/refresh` | POST | - | - | 토큰 갱신 |
| `/api/v1/auth/logout` | POST | JWT | - | 로그아웃 |
| `/api/v1/auth/profile` | GET | JWT | - | 프로필 조회 |
| `/api/v1/agents` | GET/POST | JWT | FEAT-5 | 에이전트 목록/생성 |
| `/api/v1/agents/:id` | GET/PATCH/DELETE | JWT | FEAT-5 | 에이전트 상세 |
| `/api/v1/agents/:id/regenerate-token` | POST | JWT | FEAT-5 | 토큰 재생성 |
| `/api/v1/events/batch` | POST | API Token | FEAT-1,2,3 | 이벤트 배치 등록 |
| `/api/v1/events` | GET | JWT | FEAT-4,7 | 이벤트 조회 |
| `/api/v1/events/search` | GET | JWT | FEAT-7 | 이벤트 검색 |
| `/api/v1/events/stats` | GET | JWT | FEAT-4 | 이벤트 통계 |
| `/api/v1/projects` | GET/POST | JWT | FEAT-6 | 프로젝트 목록/생성 |
| `/api/v1/projects/:id/members` | POST/DELETE | JWT | FEAT-6 | 멤버 관리 |
| `/api/v1/notes` | GET/POST | JWT | - | 노트 CRUD |

### 4.2 요청/응답 스키마 (예시)

#### 이벤트 배치 등록

```typescript
// POST /api/v1/events/batch
// Authorization: Bearer <agent_api_token>

// Request Body
{
  "events": [
    {
      "event_type": "git",
      "event_action": "commit",
      "title": "feat: add login page",
      "content": "Implement user login functionality",
      "metadata": {
        "author_name": "John Doe",
        "author_email": "john@example.com",
        "repo_path": "/Users/john/projects/myapp",
        "repo_name": "myapp"
      },
      "git_branch": "feature/login",
      "git_commit_hash": "abc1234567890",
      "local_timestamp": "2026-01-11T10:30:00Z"
    }
  ]
}

// Response (200 OK)
{
  "processed": 1,
  "failed": 0
}
```

#### 이벤트 조회

```typescript
// GET /api/v1/events?limit=20&eventType=git&dateFrom=2026-01-01
// Authorization: Bearer <jwt_token>

// Response (200 OK)
{
  "events": [
    {
      "id": "uuid",
      "eventType": "git",
      "eventAction": "commit",
      "title": "feat: add login page",
      "content": "...",
      "metadata": {...},
      "localTimestamp": "2026-01-11T10:30:00Z",
      "serverTimestamp": "2026-01-11T10:30:05Z",
      "agent": {
        "id": "uuid",
        "name": "MacBook Pro"
      }
    }
  ],
  "nextCursor": "uuid-of-last-item"
}
```

---

## 5. 비기능 요구사항 (NFR)

### 5.1 성능 요구사항

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| API 응답 시간 (P95) | < 200ms | 모니터링 |
| 페이지 로딩 시간 | < 2초 | Lighthouse |
| WebSocket 지연 | < 100ms | 클라이언트 측정 |
| 이벤트 동기화 지연 | < 5분 | 타임스탬프 비교 |
| 동시 WebSocket 연결 | 1,000+ | 부하 테스트 |
| 일일 이벤트 처리량 | 100,000+ | 로그 분석 |

### 5.2 확장성

| 시나리오 | 현재 | 목표 | 전략 |
|----------|------|------|------|
| 사용자 수 | 10 | 1,000 | 수평 확장 |
| 일일 이벤트 | 5,000 | 500,000 | 파티셔닝 |
| 동시 접속 | 10 | 500 | 로드밸런서 |
| DB 크기 | 100MB | 100GB | 아카이빙 |

### 5.3 보안 요구사항

| 항목 | 구현 | 상태 |
|------|------|------|
| HTTPS | Nginx/Traefik 리버스 프록시 | 예정 |
| 비밀번호 해싱 | bcrypt (cost 10) | ✅ |
| JWT 토큰 | 15분 만료, HS256 | ✅ |
| 리프레시 토큰 | 24시간 만료, DB 저장 | ✅ |
| API 토큰 | UUID v4, 재생성 가능 | ✅ |
| 입력 검증 | Zod 스키마 검증 | ✅ |
| SQL 인젝션 | Prisma 파라미터화 쿼리 | ✅ |
| XSS | React 자동 이스케이프 | ✅ |
| CORS | 허용 Origin 제한 | ✅ |
| Rate Limiting | 100 req/15min/IP | ✅ |
| 보안 헤더 | Helmet 기본 설정 | ✅ |

### 5.4 가용성

| 목표 | SLA | 전략 |
|------|-----|------|
| 업타임 | 99.5% | 헬스체크, 자동 재시작 |
| 오프라인 지원 | 무제한 | SQLite 버퍼 |
| 데이터 유실 | 0% | 트랜잭션, 재시도 |

### 5.5 모니터링 & 로깅

| 구성요소 | 로깅 | 모니터링 |
|----------|------|----------|
| Server | Morgan (HTTP), console (App) | /api/v1/health |
| Agent | zerolog (파일 + 콘솔) | 상태 리포트 |
| Database | Prisma 쿼리 로그 (개발) | 커넥션 풀 |

---

## 6. 인프라 구성

### 6.1 Docker Compose 구성

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: devlog
      POSTGRES_PASSWORD: devlog_secret
      POSTGRES_DB: devlog
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  server:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://devlog:devlog_secret@postgres:5432/devlog
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: http://localhost:3020
    depends_on:
      - postgres
      - redis

  web:
    build: ./web
    ports:
      - "3020:3020"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
    depends_on:
      - server

volumes:
  postgres_data:
  redis_data:
```

### 6.2 환경 변수

#### Server (.env)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://devlog:devlog_secret@localhost:5432/devlog

JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=1d

CORS_ORIGIN=http://localhost:3020
```

#### Web (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

#### Agent (config.yaml)

```yaml
server:
  url: http://localhost:3001
  api_token: <your-agent-api-token>

agent:
  name: "My MacBook"
  machine_id: "unique-machine-uuid"
  watch_dirs:
    - /Users/username/projects

collectors:
  git:
    enabled: true
    poll_interval: 30s
  file:
    enabled: true
    extensions: [".go", ".ts", ".tsx", ".js", ".jsx", ".py", ".md"]
    ignore_dirs: ["node_modules", ".git", "vendor", "dist"]

storage:
  db_path: ~/.devlog-agent/events.db

sync:
  interval: 5m
  batch_size: 100
  max_retries: 3

logging:
  level: info
  format: console
```

---

## 7. 통합 다이어그램

### 7.1 시퀀스 다이어그램: 전체 흐름

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant IDE as IDE/Terminal
    participant Ag as Agent (Go)
    participant SQLite as SQLite
    participant API as API Server
    participant PG as PostgreSQL
    participant WS as WebSocket
    participant Web as Web Dashboard

    Dev->>IDE: 코드 작성 & 저장
    IDE-->>Ag: 파일 변경 이벤트 (fsnotify)
    Ag->>SQLite: 이벤트 저장 (pending)

    Dev->>IDE: git commit
    IDE-->>Ag: Git 폴링 감지
    Ag->>SQLite: 이벤트 저장 (pending)

    Note over Ag,SQLite: 5분 간격 동기화

    Ag->>SQLite: pending 이벤트 조회
    SQLite-->>Ag: 이벤트 배치
    Ag->>API: POST /events/batch (Bearer Token)
    API->>API: 토큰 검증
    API->>PG: INSERT 이벤트
    API->>SQLite: UPDATE synced
    API->>WS: broadcast(event:new)
    WS->>Web: 새 이벤트 알림
    Web->>Web: UI 업데이트

    Dev->>Web: 대시보드 확인
    Web->>API: GET /events (JWT)
    API->>PG: SELECT 이벤트
    PG-->>API: 이벤트 목록
    API-->>Web: JSON 응답
    Web->>Dev: 타임라인 표시
```

---

## 8. 기술 결정 로그

| ID | 결정 | 선택안 | 대안 | 근거 |
|----|------|--------|------|------|
| TD-1 | 에이전트 언어 | Go | Rust, Python | 크로스플랫폼, 단일 바이너리, 리소스 효율 |
| TD-2 | 로컬 저장소 | SQLite | LevelDB | 설치 불필요, SQL 쿼리 가능 |
| TD-3 | 서버 프레임워크 | Express | Fastify, Koa | 생태계 크기, 팀 친숙도 |
| TD-4 | ORM | Prisma | TypeORM, Sequelize | 타입 안전, 마이그레이션 DX |
| TD-5 | 실시간 통신 | Socket.io | WebSocket raw | 자동 재연결, 룸 기능 |
| TD-6 | 프론트엔드 | Next.js 14 | Remix, Vite | RSC, App Router, Vercel 친화 |
| TD-7 | 상태 관리 | Zustand + RQ | Redux | 보일러플레이트 최소화 |
| TD-8 | 인증 | JWT + Refresh | Session | Stateless, 확장성 |
| TD-9 | 파일 감시 | fsnotify | polling | 효율성, 이벤트 기반 |
| TD-10 | Git 감지 | polling (30s) | hook | 단순함, 저장소 비침투 |

---

## 부록: 체크리스트

### 개발 환경 요구사항

| 항목 | 최소 버전 | 확인 |
|------|----------|------|
| Node.js | 20.x | `node -v` |
| Go | 1.21 | `go version` |
| Docker | 24.x | `docker -v` |
| Docker Compose | 2.x | `docker-compose -v` |
| PostgreSQL (Docker) | 15 | Docker image |

### 배포 전 체크리스트

- [ ] 환경 변수 설정 완료
- [ ] JWT 시크릿 생성 (강력한 랜덤)
- [ ] DATABASE_URL 설정
- [ ] CORS_ORIGIN 프로덕션 도메인 설정
- [ ] Prisma 마이그레이션 적용
- [ ] 에이전트 바이너리 빌드
- [ ] Docker 이미지 빌드

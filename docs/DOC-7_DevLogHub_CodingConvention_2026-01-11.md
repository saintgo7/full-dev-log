# Coding Convention & AI Collaboration Guide

## Document Metadata

```yaml
doc_id: DOC-7
type: Coding Convention
project_name: DevLog Hub
version: 1.0
last_updated: 2026-01-11
languages:
  - Go (Agent)
  - TypeScript (Server, Web)
```

---

## 1. Core Principles

### 1.1 Trust, but Verify

```
[신뢰하되, 검증하라]

AI가 생성한 코드는 항상 검증합니다:
1. 로직이 의도와 일치하는지 확인
2. 보안 취약점 검토
3. 성능 영향 평가
4. 테스트 커버리지 확인
```

### 1.2 Single Source of Truth (SSOT)

```
[단일 정보 출처]

DevLog Hub에서의 SSOT:
- 타입 정의: server/src/types/, web/src/types/
- 상수: */constants/
- API 스키마: Prisma 스키마가 기준
- UI 토큰: DOC-5 Design System 참조
- 식별자: FEAT-x, USER-x, RISK-x (DOC-1 기준)
```

### 1.3 Explicit over Implicit

```
[명시적 > 암시적]

- 타입 추론보다 명시적 타입 선언
- 매직 넘버 대신 명명된 상수
- 축약어보다 전체 단어 (ex: evt → event)
- any 타입 사용 금지
```

---

## 2. Project Setup

### 2.1 Repository Structure

```
devlog-hub/
├── agent/                   # Go 로컬 에이전트
│   ├── cmd/devlog-agent/    # 엔트리포인트
│   ├── internal/            # 내부 패키지
│   ├── go.mod
│   └── Makefile
├── server/                  # Node.js API
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── web/                     # Next.js 프론트엔드
│   ├── src/
│   ├── package.json
│   └── next.config.js
├── docs/                    # 문서
├── docker/                  # Docker 설정
├── scripts/                 # 유틸리티 스크립트
├── .github/                 # GitHub Actions
├── .editorconfig
├── .gitignore
└── README.md
```

### 2.2 Git Workflow

```
[브랜치 네이밍]

main                         # 프로덕션
├── develop                  # 개발 통합
├── feature/FEAT-1-agent     # 기능 개발
├── feature/FEAT-2-search    # 기능 개발
├── bugfix/123-sync-error    # 버그 수정
├── hotfix/auth-critical     # 긴급 수정
└── release/v1.0.0           # 릴리즈 준비

[커밋 메시지]

형식: {type}({scope}): {subject}

type:
- feat: 새 기능
- fix: 버그 수정
- docs: 문서 변경
- style: 코드 포맷팅 (기능 변경 X)
- refactor: 리팩토링
- test: 테스트 추가/수정
- chore: 빌드, 설정 변경

scope: FEAT-x 또는 컴포넌트명 (agent, server, web)

예시:
feat(FEAT-1): add git event collector
fix(server): resolve JWT refresh token issue
docs(DOC-6): update M2 task descriptions
chore(agent): upgrade go-git to v5.12
```

### 2.3 Environment Variables

```bash
# server/.env.example

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/devloghub

# Authentication
JWT_SECRET=your-super-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

```bash
# web/.env.local.example

NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

```bash
# agent/.env.example (또는 config.yaml)

SERVER_URL=http://localhost:3001
API_TOKEN=agent-api-token-here
SYNC_INTERVAL=5m
LOG_LEVEL=info
```

---

## 3. TypeScript Conventions (Server & Web)

### 3.1 Naming Conventions

```typescript
// [변수/함수] camelCase
const userId = '123';
const isActive = true;
function getUserById(id: string) { }
async function fetchEvents() { }

// [상수] SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api/v1';
const EVENT_TYPES = ['git', 'file', 'terminal', 'manual'] as const;

// [타입/인터페이스] PascalCase
interface User {
  id: string;
  email: string;
}

type EventType = 'git' | 'file' | 'terminal' | 'manual';

enum UserRole {
  Admin = 'admin',
  Member = 'member',
  Viewer = 'viewer',
}

// [컴포넌트] PascalCase
function EventCard({ event }: EventCardProps) { }
function TimelineView() { }

// [파일명]
// 컴포넌트: PascalCase.tsx (EventCard.tsx)
// 유틸리티: camelCase.ts (formatDate.ts)
// 상수: camelCase.ts (eventTypes.ts)
// 타입: camelCase.types.ts (event.types.ts)
// 테스트: *.test.ts, *.spec.ts
```

### 3.2 Type Definitions

```typescript
// [타입 정의 위치]
// 공유 타입: server/src/types/, web/src/types/
// 로컬 타입: 컴포넌트와 같은 폴더

// [타입 정의 예시]

// server/src/types/event.types.ts
export interface Event {
  id: string;
  agentId: string;
  projectId: string | null;
  userId: string;
  eventType: EventType;
  eventAction: string;
  title: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
  filePath: string | null;
  gitBranch: string | null;
  gitCommitHash: string | null;
  localTimestamp: Date;
  serverTimestamp: Date;
  createdAt: Date;
}

export type EventType = 'git' | 'file' | 'terminal' | 'manual';

export interface CreateEventDto {
  eventType: EventType;
  eventAction: string;
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  localTimestamp: string; // ISO 8601
}

// [Props 타입]
// 컴포넌트 Props는 ComponentNameProps 형식

interface EventCardProps {
  event: Event;
  onSelect?: (event: Event) => void;
  isSelected?: boolean;
}

// [API 응답 타입]
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
  };
}
```

### 3.3 Function Patterns

```typescript
// [함수 시그니처]
// 명확한 파라미터와 반환 타입

async function getEventById(eventId: string): Promise<Event | null> {
  // ...
}

async function createEvents(
  agentId: string,
  events: CreateEventDto[]
): Promise<{ processed: number; failed: number }> {
  // ...
}

// [에러 핸들링]
// 커스텀 에러 클래스 사용

class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 사용
throw new AppError('Event not found', 'EVENT_NOT_FOUND', 404);

// [유효성 검사]
// Zod 스키마 사용

import { z } from 'zod';

const createEventSchema = z.object({
  eventType: z.enum(['git', 'file', 'terminal', 'manual']),
  eventAction: z.string().min(1).max(30),
  title: z.string().max(500).optional(),
  content: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  localTimestamp: z.string().datetime(),
});

type CreateEventInput = z.infer<typeof createEventSchema>;
```

### 3.4 Import Order

```typescript
// [Import 순서]
// 1. Node.js 내장 모듈
// 2. 외부 라이브러리
// 3. 내부 모듈 (절대 경로)
// 4. 상대 경로 모듈
// 5. 타입 import

import { readFile } from 'fs/promises';

import express from 'express';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth';

import { EventCard } from './EventCard';
import { formatDate } from './utils';

import type { Event, EventType } from '@/types/event.types';
```

---

## 4. Go Conventions (Agent)

### 4.1 Naming Conventions

```go
// [변수/함수] camelCase (비공개), PascalCase (공개)
var userID string          // 비공개
var MaxRetryCount = 3      // 공개

func getUserByID(id string) {}  // 비공개
func GetUserByID(id string) {}  // 공개

// [상수] PascalCase 또는 camelCase
const (
    EventTypeGit      = "git"
    EventTypeFile     = "file"
    EventTypeTerminal = "terminal"
    EventTypeManual   = "manual"
)

// [구조체] PascalCase
type Event struct {
    ID              string    `json:"id"`
    AgentID         string    `json:"agentId"`
    EventType       string    `json:"eventType"`
    EventAction     string    `json:"eventAction"`
    Title           string    `json:"title,omitempty"`
    Content         string    `json:"content,omitempty"`
    Metadata        Metadata  `json:"metadata"`
    LocalTimestamp  time.Time `json:"localTimestamp"`
}

// [인터페이스] 접미사 -er
type Collector interface {
    Collect() ([]Event, error)
}

type EventStore interface {
    Save(event Event) error
    GetPending() ([]Event, error)
    MarkSynced(ids []string) error
}
```

### 4.2 Package Structure

```go
// [패키지 구조]
agent/
├── cmd/
│   └── devlog-agent/
│       └── main.go           // 엔트리포인트
├── internal/                  // 내부 패키지 (외부 import 불가)
│   ├── config/
│   │   └── config.go
│   ├── collector/
│   │   ├── collector.go      // 인터페이스 정의
│   │   ├── git.go
│   │   ├── file.go
│   │   └── terminal.go
│   ├── storage/
│   │   ├── storage.go        // 인터페이스 정의
│   │   └── sqlite.go
│   ├── sync/
│   │   └── syncer.go
│   └── models/
│       └── event.go
├── pkg/                       // 공개 패키지 (외부 import 가능)
│   └── version/
│       └── version.go
└── go.mod
```

### 4.3 Error Handling

```go
// [에러 핸들링]
// 에러는 항상 반환하고 호출자가 처리

func (c *GitCollector) Collect() ([]Event, error) {
    repo, err := git.PlainOpen(c.path)
    if err != nil {
        return nil, fmt.Errorf("failed to open git repo: %w", err)
    }

    // ...
    return events, nil
}

// [커스텀 에러]
var (
    ErrNotGitRepo    = errors.New("not a git repository")
    ErrSyncFailed    = errors.New("sync failed")
    ErrConfigInvalid = errors.New("invalid configuration")
)

// [에러 래핑]
if err := store.Save(event); err != nil {
    return fmt.Errorf("save event %s: %w", event.ID, err)
}
```

### 4.4 Concurrency Patterns

```go
// [고루틴 관리]
// context를 사용하여 취소 처리

func (s *Syncer) Start(ctx context.Context) error {
    ticker := time.NewTicker(s.interval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-ticker.C:
            if err := s.sync(); err != nil {
                log.Error().Err(err).Msg("sync failed")
            }
        }
    }
}

// [채널 사용]
// 버퍼 크기를 명시적으로 지정

eventCh := make(chan Event, 100)

// [WaitGroup 사용]
var wg sync.WaitGroup
wg.Add(1)
go func() {
    defer wg.Done()
    // work
}()
wg.Wait()
```

---

## 5. React/Next.js Conventions (Web)

### 5.1 Component Structure

```typescript
// [컴포넌트 파일 구조]
// web/src/components/features/EventCard/
// ├── EventCard.tsx
// ├── EventCard.test.tsx
// └── index.ts

// EventCard.tsx
'use client'; // 클라이언트 컴포넌트인 경우

import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { Event } from '@/types/event.types';

// Props 타입 정의
interface EventCardProps {
  event: Event;
  onSelect?: (event: Event) => void;
  isSelected?: boolean;
  className?: string;
}

// 컴포넌트 정의
function EventCard({
  event,
  onSelect,
  isSelected = false,
  className
}: EventCardProps) {
  // 훅 호출 (최상단)

  // 이벤트 핸들러
  const handleClick = () => {
    onSelect?.(event);
  };

  // 렌더링
  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors',
        isSelected && 'ring-2 ring-primary',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <EventTypeBadge type={event.eventType} />
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(event.localTimestamp), {
            addSuffix: true
          })}
        </span>
      </div>
      <h3 className="font-medium">{event.title}</h3>
      {event.content && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {event.content}
        </p>
      )}
    </Card>
  );
}

// memo로 최적화 (필요한 경우)
export default memo(EventCard);
```

### 5.2 Custom Hooks

```typescript
// [커스텀 훅 패턴]
// web/src/hooks/useEvents.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { eventsApi } from '@/services/events';

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventsApi.getEvents(filters),
    staleTime: 1000 * 60, // 1분
  });
}

export function useEventSearch(query: string) {
  return useQuery({
    queryKey: ['events', 'search', query],
    queryFn: () => eventsApi.search(query),
    enabled: query.length > 0,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
```

### 5.3 State Management (Zustand)

```typescript
// [Zustand 스토어]
// web/src/stores/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        accessToken: token,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'devlog-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);
```

---

## 6. Security Guidelines

### 6.1 Authentication & Authorization

```typescript
// [JWT 처리]
// Access Token: 메모리 또는 Zustand (15분)
// Refresh Token: HttpOnly Cookie (7일)

// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = payload as JwtPayload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// [에이전트 인증]
// API 토큰 (64자 랜덤 문자열)

export function agentAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiToken = req.headers.authorization?.replace('Bearer ', '');

  if (!apiToken) {
    return res.status(401).json({ error: 'API token required' });
  }

  // DB에서 토큰 검증
  // ...
}
```

### 6.2 Input Validation

```typescript
// [입력 검증]
// 모든 API 입력은 Zod로 검증

// server/src/schemas/event.schema.ts
import { z } from 'zod';

export const createEventBatchSchema = z.object({
  events: z.array(z.object({
    eventType: z.enum(['git', 'file', 'terminal', 'manual']),
    eventAction: z.string().min(1).max(30),
    title: z.string().max(500).optional(),
    content: z.string().max(10000).optional(),
    metadata: z.record(z.unknown()).optional(),
    filePath: z.string().max(1000).optional(),
    gitBranch: z.string().max(200).optional(),
    gitCommitHash: z.string().length(40).optional(),
    localTimestamp: z.string().datetime(),
  })).max(100), // 배치 최대 100개
});

// 미들웨어로 적용
app.post(
  '/events/batch',
  validate(createEventBatchSchema),
  eventsController.createBatch
);
```

### 6.3 Security Checklist

```
[보안 체크리스트]

인증/인가:
- [ ] JWT 시크릿 충분히 길고 랜덤 (256bit+)
- [ ] Access Token 만료 시간 짧게 (15분)
- [ ] Refresh Token HttpOnly Cookie로 저장
- [ ] API 토큰 안전하게 생성 (crypto.randomBytes)
- [ ] 권한 검증 미들웨어 적용

입력 처리:
- [ ] 모든 입력 Zod로 검증
- [ ] SQL Injection 방지 (Prisma 사용)
- [ ] XSS 방지 (React 자동 이스케이프)
- [ ] 파일 업로드 제한 (해당시)

환경 설정:
- [ ] .env 파일 .gitignore에 포함
- [ ] 프로덕션 시크릿 분리 관리
- [ ] HTTPS 강제 적용
- [ ] CORS 적절히 설정
- [ ] Rate Limiting 적용
```

---

## 7. Testing Standards

### 7.1 Testing Strategy

```
[테스트 전략]

테스트 피라미드:
┌─────────────────┐
│   E2E (10%)     │  핵심 User Flow
├─────────────────┤
│ Integration(20%)│  API 엔드포인트
├─────────────────┤
│   Unit (70%)    │  함수, 훅, 유틸
└─────────────────┘

필수 테스트:
- 인증 API (register, login, refresh)
- 이벤트 CRUD API
- 에이전트 수집기 (Git, File)
- 동기화 로직
```

### 7.2 Test Examples

```typescript
// [유닛 테스트]
// server/src/utils/formatDate.test.ts

import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date('2026-01-11T14:30:00Z');
    expect(formatDate(date)).toBe('2026-01-11');
  });

  it('should handle invalid date', () => {
    expect(() => formatDate(null)).toThrow();
  });
});

// [API 통합 테스트]
// server/src/routes/events.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('POST /api/v1/events/batch', () => {
  let agentToken: string;

  beforeEach(async () => {
    // 테스트 에이전트 생성
    agentToken = await createTestAgent();
  });

  it('should create events in batch', async () => {
    const response = await request(app)
      .post('/api/v1/events/batch')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        events: [
          {
            eventType: 'git',
            eventAction: 'commit',
            title: 'test commit',
            localTimestamp: new Date().toISOString(),
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.processed).toBe(1);
  });

  it('should reject without auth', async () => {
    const response = await request(app)
      .post('/api/v1/events/batch')
      .send({ events: [] });

    expect(response.status).toBe(401);
  });
});
```

```go
// [Go 테스트]
// agent/internal/collector/git_test.go

package collector

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestGitCollector_Collect(t *testing.T) {
    t.Run("valid git repo", func(t *testing.T) {
        // Arrange
        collector := NewGitCollector("./testdata/repo")

        // Act
        events, err := collector.Collect()

        // Assert
        require.NoError(t, err)
        assert.NotEmpty(t, events)
        assert.Equal(t, EventTypeGit, events[0].EventType)
    })

    t.Run("not a git repo", func(t *testing.T) {
        collector := NewGitCollector("/tmp")

        _, err := collector.Collect()

        assert.ErrorIs(t, err, ErrNotGitRepo)
    })
}
```

---

## 8. AI Collaboration Guide

### 8.1 Effective Prompting

```
[효과적인 AI 지시 방법]

1. 컨텍스트 제공
   "DOC-4 Database 문서를 참조해서, events 테이블에 대한
    Prisma 스키마를 작성해줘. 기존 users, agents 모델과
    관계 설정도 포함해줘."

2. 명확한 요구사항
   "TASK-M2-2 인수 조건에 맞게 GitCollector를 구현해줘:
    - git 저장소 감지
    - 새 커밋 감지 (마지막 수집 이후)
    - 커밋 메타데이터 추출
    - 이벤트 객체 생성"

3. 제약 조건 명시
   "API 응답은 DOC-2 TRD의 표준 형식을 따라야 해:
    { success: boolean, data: T, error?: {...} }"

4. 검증 요청
   "방금 작성한 코드가 인수 조건을 충족하는지 체크해줘.
    특히 에러 핸들링과 타입 안전성을 확인해줘."
```

### 8.2 Code Review for AI-Generated Code

```
[AI 생성 코드 리뷰 체크리스트]

필수 확인:
- [ ] 타입 에러 없음 (tsc --noEmit)
- [ ] 린트 통과 (npm run lint)
- [ ] 의도한 로직과 일치
- [ ] 보안 취약점 없음

코드 품질:
- [ ] 명명 규칙 준수
- [ ] 중복 코드 없음
- [ ] 적절한 에러 핸들링
- [ ] 불필요한 주석 없음

성능:
- [ ] N+1 쿼리 없음 (include 사용)
- [ ] 불필요한 리렌더링 없음 (memo, useMemo)
- [ ] 메모리 누수 없음 (cleanup)
```

### 8.3 Iterative Development Pattern

```
[AI 협업 개발 패턴]

1. 계획 (Plan)
   └─ DOC-6 TASKS에서 현재 태스크 확인
   └─ 관련 문서 참조 (PRD, TRD, DB, etc.)

2. 구현 (Implement)
   └─ AI에게 명확한 컨텍스트 제공
   └─ 작은 단위로 나누어 요청
   └─ 각 단계마다 검증

3. 검증 (Verify)
   └─ 인수 조건 체크
   └─ 테스트 실행
   └─ 수동 테스트

4. 개선 (Refine)
   └─ 피드백 반영
   └─ 코드 정리
   └─ 문서 업데이트

예시:
"TASK-M2-2가 완료됐어. 인수 조건을 다시 확인해볼게:
 - [x] Git 저장소 감지
 - [x] 새 커밋 감지
 - [x] 메타데이터 추출
 - [ ] 이벤트 저장 (다음 단계)

 TASK-M2-4로 넘어가서 SQLite 저장소를 구현해줘."
```

---

## 9. Documentation Standards

### 9.1 Code Comments

```typescript
// [주석 규칙]

// 1. JSDoc for functions/methods
/**
 * 이벤트를 배치로 생성합니다.
 *
 * @param agentId - 에이전트 고유 ID
 * @param events - 생성할 이벤트 목록
 * @returns 처리 결과 (성공/실패 수)
 * @throws {AppError} 유효하지 않은 이벤트가 있는 경우
 *
 * @example
 * const result = await createEventBatch('agent-123', [
 *   { eventType: 'git', eventAction: 'commit', ... }
 * ]);
 */
async function createEventBatch(
  agentId: string,
  events: CreateEventDto[]
): Promise<BatchResult> {
  // ...
}

// 2. 복잡한 로직 설명
// 오프라인 큐에 있는 이벤트들을 서버와 동기화합니다.
// 실패한 이벤트는 재시도 카운터를 증가시키고,
// 3회 이상 실패하면 영구 실패로 마킹합니다.
async function syncPendingEvents() {
  // ...
}

// 3. TODO/FIXME 형식
// TODO(FEAT-4): 프로젝트 필터 추가
// FIXME: 대용량 데이터에서 성능 저하 발생
```

### 9.2 README Template

```markdown
# DevLog Hub

개발 활동을 자동으로 수집하고 중앙에서 관리하는 플랫폼입니다.

## Quick Start

### Prerequisites
- Node.js 20+
- Go 1.21+
- PostgreSQL 15+
- Docker (optional)

### Installation

```bash
# 저장소 클론
git clone https://github.com/your-org/devlog-hub.git
cd devlog-hub

# 설정 스크립트 실행
./scripts/setup.sh
```

### Development

```bash
# 서버 실행
cd server && npm run dev

# 웹 실행
cd web && npm run dev

# 에이전트 빌드
cd agent && make build
```

## Project Structure
```
devlog-hub/
├── agent/    # Go 로컬 에이전트
├── server/   # Node.js API
├── web/      # Next.js 프론트엔드
└── docs/     # 문서
```

## Documentation
- [PRD](docs/DOC-1_*.md)
- [TRD](docs/DOC-2_*.md)
- [TASKS](docs/DOC-6_*.md)

## License
MIT
```

---

## 10. Validation Checklist

```
[컨벤션 준수 최종 체크]

코드 품질:
- [ ] ESLint/golint 에러 없음
- [ ] Prettier 포맷팅 적용
- [ ] TypeScript/Go 타입 에러 없음
- [ ] 테스트 통과

보안:
- [ ] 보안 체크리스트 확인
- [ ] 민감 정보 하드코딩 없음
- [ ] 입력 검증 적용

문서:
- [ ] JSDoc/GoDoc 작성
- [ ] README 최신화
- [ ] 변경사항 CHANGELOG 기록

AI 협업:
- [ ] 인수 조건 충족 확인
- [ ] 코드 리뷰 체크리스트 완료
```

---

## Document References

| 참조 문서 | 관련 섹션 |
|-----------|-----------|
| DOC-2 (TRD) | Tech Stack, API Design |
| DOC-4 (Database) | Schema Conventions |
| DOC-5 (Design System) | Component Patterns |
| DOC-6 (TASKS) | Implementation Details |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | Claude + User | Initial draft |

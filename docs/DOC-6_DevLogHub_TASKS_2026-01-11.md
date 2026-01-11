# TASKS (AI 개발 파트너용 프롬프트 설계서)

## Document Metadata

```yaml
doc_id: DOC-6
type: TASKS
project_name: DevLog Hub
version: 1.0
last_updated: 2026-01-11
ai_partner: Claude Code
development_model: 1인 개발 + AI 협업
timeline: 4주 MVP
```

---

## Overview

이 문서는 AI 코딩 파트너가 즉시 협업을 시작할 수 있도록 구체화되고 실행 가능한 단계별 개발 경로를 제공합니다.

**Document References:**
- DOC-1 (PRD): FEAT-1 ~ FEAT-6 사용자 스토리
- DOC-2 (TRD): Go + Node.js + Next.js 기술 스택
- DOC-3 (User Flow): 에이전트 수집 → 대시보드 흐름
- DOC-4 (Database): PostgreSQL + SQLite 스키마
- DOC-5 (Design System): UI 컴포넌트 스펙

---

## Milestone Overview

```
Week 1: M0 + M1 (프로젝트 설정 + 기본 인프라)
Week 2: M2 (로컬 에이전트 개발)
Week 3: M3 (서버 API + 웹 대시보드)
Week 4: M4 + M5 (통합 테스트 + 배포)
```

| Milestone | Description | Duration | Key Deliverable |
|-----------|-------------|----------|-----------------|
| M0 | 프로젝트 초기화 | 2일 | 모노레포 구조, 개발 환경 |
| M1 | 백엔드 기반 구축 | 3일 | DB 스키마, API 골격 |
| M2 | 로컬 에이전트 개발 | 5일 | Go 에이전트 MVP |
| M3 | 웹 대시보드 개발 | 7일 | Next.js 대시보드 |
| M4 | 통합 및 연동 | 4일 | 에이전트-서버 동기화 |
| M5 | 테스트 및 배포 | 3일 | 프로덕션 배포 |

---

## M0: 프로젝트 초기화 (Day 1-2)

### [ ] TASK-M0-1: 모노레포 구조 생성

**컨텍스트 및 목표:**
세 개의 서브 프로젝트(agent, server, web)를 하나의 저장소에서 관리합니다.

**기술 명세:**
```
참조: DOC-2 (TRD) > Development Environment

구조:
devlog-hub/
├── agent/           # Go 로컬 에이전트
│   ├── cmd/
│   ├── internal/
│   ├── go.mod
│   └── Makefile
├── server/          # Node.js API
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── web/             # Next.js 프론트엔드
│   ├── src/
│   ├── package.json
│   └── next.config.js
├── docs/            # 문서 (현재 디렉토리)
├── docker/          # Docker 설정
├── scripts/         # 유틸리티 스크립트
├── .github/         # GitHub Actions
└── README.md
```

**인수 조건:**
```
- [ ] 디렉토리 구조 생성
- [ ] 각 서브 프로젝트 초기화 (go mod init, npm init)
- [ ] 루트 README.md 작성
- [ ] .gitignore 설정 (node_modules, dist, .env, bin/)
- [ ] 라이선스 파일 (MIT 권장)
```

---

### [ ] TASK-M0-2: 개발 환경 설정

**컨텍스트 및 목표:**
일관된 개발 환경을 위한 설정 파일을 생성합니다.

**기술 명세:**
```
Node.js: 20.x LTS
Go: 1.21+
PostgreSQL: 15+
```

**인수 조건:**
```
- [ ] .nvmrc 파일 (Node 버전)
- [ ] .editorconfig 파일
- [ ] server/.eslintrc.js, server/.prettierrc
- [ ] web/.eslintrc.js, web/.prettierrc
- [ ] agent/Makefile (build, test, lint 타겟)
- [ ] docker-compose.yml (PostgreSQL, Redis)
- [ ] scripts/setup.sh (원클릭 설정 스크립트)
```

**자가 수정 지침:**
```
검증:
1. cd server && npm install && npm run lint
2. cd web && npm install && npm run lint
3. cd agent && make build
모든 명령이 에러 없이 완료되어야 함
```

---

## M1: 백엔드 기반 구축 (Day 3-5)

### [ ] TASK-M1-1: 데이터베이스 스키마 생성

**컨텍스트 및 목표:**
PostgreSQL 스키마와 Prisma 모델을 생성합니다.

**기술 명세:**
```
참조: DOC-4 (Database Design) > Section 3: Schema Design

핵심 테이블:
- users
- agents
- projects
- project_members
- events
- notes
- reports
- sessions
```

**인수 조건:**
```
- [ ] server/prisma/schema.prisma 작성
- [ ] 모든 테이블 모델 정의
- [ ] 관계(relation) 설정
- [ ] 인덱스 정의
- [ ] npx prisma migrate dev 성공
- [ ] npx prisma generate 성공
```

**Prisma 스키마 예시:**
```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String
  name            String
  role            String    @default("member")
  avatarUrl       String?
  emailVerifiedAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  agents          Agent[]
  events          Event[]
  notes           Note[]
  reports         Report[]
  sessions        Session[]
  projectMembers  ProjectMember[]
}

model Agent {
  id          String    @id @default(uuid())
  userId      String
  name        String
  osType      String
  hostname    String?
  apiToken    String    @unique
  isActive    Boolean   @default(true)
  lastSeenAt  DateTime?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  events      Event[]

  @@unique([userId, hostname])
}

model Event {
  id              String    @id @default(uuid())
  agentId         String
  projectId       String?
  userId          String
  eventType       String
  eventAction     String
  title           String?
  content         String?
  metadata        Json      @default("{}")
  filePath        String?
  gitBranch       String?
  gitCommitHash   String?
  localTimestamp  DateTime
  serverTimestamp DateTime  @default(now())
  createdAt       DateTime  @default(now())

  agent           Agent     @relation(fields: [agentId], references: [id])
  project         Project?  @relation(fields: [projectId], references: [id])
  user            User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([agentId])
  @@index([projectId])
  @@index([eventType])
  @@index([localTimestamp(sort: Desc)])
}

// ... 나머지 모델 (Project, Note, Report, Session)
```

---

### [ ] TASK-M1-2: API 서버 골격 구현

**컨텍스트 및 목표:**
Express.js 기반 REST API 서버의 기본 구조를 구현합니다.

**기술 명세:**
```
참조: DOC-2 (TRD) > Section 4: API Design

서버 구조:
server/src/
├── index.ts          # 엔트리포인트
├── app.ts            # Express 앱 설정
├── routes/           # 라우터
│   ├── index.ts
│   ├── auth.ts
│   ├── agents.ts
│   ├── events.ts
│   ├── projects.ts
│   └── search.ts
├── controllers/      # 컨트롤러
├── services/         # 비즈니스 로직
├── middleware/       # 미들웨어
│   ├── auth.ts
│   ├── error.ts
│   └── validation.ts
├── utils/            # 유틸리티
├── types/            # 타입 정의
└── config/           # 설정
```

**인수 조건:**
```
- [ ] Express 앱 설정 (CORS, JSON, 로깅)
- [ ] 라우트 구조 설정
- [ ] 에러 핸들링 미들웨어
- [ ] Health check 엔드포인트 (/health)
- [ ] 환경 변수 설정 (.env.example)
- [ ] npm run dev 로 서버 실행 확인
```

---

### [ ] TASK-M1-3: 인증 API 구현

**컨텍스트 및 목표:**
회원가입, 로그인, 토큰 갱신 API를 구현합니다.

**기술 명세:**
```
참조: DOC-2 (TRD) > Section 5: Access Control

엔드포인트:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
```

**인수 조건:**
```
- [ ] 회원가입: 이메일 중복 체크, 비밀번호 해싱
- [ ] 로그인: JWT 발급 (access + refresh)
- [ ] 토큰 갱신: refresh token으로 access token 재발급
- [ ] Zod 스키마로 입력 검증
- [ ] 에러 응답 표준화
- [ ] 테스트 API 호출로 동작 확인
```

---

## M2: 로컬 에이전트 개발 (Day 6-10)

### [ ] TASK-M2-1: Go 에이전트 기본 구조

**컨텍스트 및 목표:**
크로스 플랫폼 로컬 에이전트의 기본 구조를 구현합니다.

**기술 명세:**
```
참조: DOC-2 (TRD) > Section 2.2: Local Agent

구조:
agent/
├── cmd/
│   └── devlog-agent/
│       └── main.go      # 엔트리포인트
├── internal/
│   ├── config/          # 설정 관리
│   ├── collector/       # 이벤트 수집기
│   │   ├── git.go
│   │   ├── file.go
│   │   └── terminal.go
│   ├── storage/         # SQLite 저장소
│   ├── sync/            # 서버 동기화
│   └── ui/              # 시스템 트레이 (선택)
├── go.mod
├── go.sum
└── Makefile
```

**인수 조건:**
```
- [ ] 프로젝트 구조 생성
- [ ] 설정 파일 로드 (YAML/JSON)
- [ ] CLI 플래그 파싱 (cobra)
- [ ] 로깅 설정 (zerolog 또는 slog)
- [ ] make build로 바이너리 생성
- [ ] 크로스 컴파일 설정 (goreleaser)
```

---

### [ ] TASK-M2-2: Git 이벤트 수집기

**컨텍스트 및 목표:**
Git 커밋, 푸시, 브랜치 변경 등을 감지하고 기록합니다.

**기술 명세:**
```
참조: DOC-1 (PRD) > FEAT-1: 자동 로그 수집

수집 대상:
- commit: 커밋 생성
- push: 원격 푸시
- pull: 원격 풀
- checkout: 브랜치 전환
- merge: 머지

라이브러리: go-git/go-git
```

**인수 조건:**
```
- [ ] Git 저장소 감지 (.git 디렉토리)
- [ ] 커밋 히스토리 파싱
- [ ] 새 커밋 감지 (마지막 수집 이후)
- [ ] 커밋 메타데이터 추출 (hash, message, author, date, diff stats)
- [ ] 이벤트 객체 생성
- [ ] 로컬 DB에 저장
```

**Go 코드 스니펫:**
```go
// internal/collector/git.go

type GitEvent struct {
    EventType   string    `json:"eventType"`   // "git"
    EventAction string    `json:"eventAction"` // "commit", "push"
    Title       string    `json:"title"`
    Content     string    `json:"content"`
    Metadata    GitMeta   `json:"metadata"`
    LocalTime   time.Time `json:"localTimestamp"`
}

type GitMeta struct {
    CommitHash   string `json:"commitHash"`
    Branch       string `json:"branch"`
    Message      string `json:"message"`
    Author       string `json:"author"`
    FilesChanged int    `json:"filesChanged"`
    Insertions   int    `json:"insertions"`
    Deletions    int    `json:"deletions"`
}
```

---

### [ ] TASK-M2-3: 파일 변경 수집기

**컨텍스트 및 목표:**
파일 저장, 생성, 삭제 이벤트를 감지합니다.

**기술 명세:**
```
라이브러리: fsnotify/fsnotify

감시 대상:
- 사용자 지정 프로젝트 디렉토리
- 특정 확장자만 (.go, .ts, .py, .js, .tsx, .jsx 등)

제외:
- node_modules, .git, dist, build
- 임시 파일 (.swp, .tmp)
```

**인수 조건:**
```
- [ ] fsnotify 워처 설정
- [ ] 디렉토리 재귀 감시
- [ ] 이벤트 디바운싱 (같은 파일 1초 내 중복 무시)
- [ ] 제외 패턴 필터링
- [ ] 파일 이벤트 객체 생성
```

---

### [ ] TASK-M2-4: 로컬 SQLite 저장소

**컨텍스트 및 목표:**
오프라인 지원을 위한 로컬 데이터베이스를 구현합니다.

**기술 명세:**
```
참조: DOC-4 (Database) > Section 3.2: Local SQLite Schema

테이블:
- sync_queue: 동기화 대기열
- local_config: 설정 저장
- project_mappings: 로컬 경로 ↔ 서버 프로젝트 매핑
```

**인수 조건:**
```
- [ ] SQLite 연결 설정
- [ ] 테이블 자동 생성 (마이그레이션)
- [ ] 이벤트 저장 함수
- [ ] 동기화 대기열 관리 (추가, 조회, 상태 업데이트)
- [ ] 데이터 조회 함수
```

---

### [ ] TASK-M2-5: 서버 동기화 모듈

**컨텍스트 및 목표:**
로컬 이벤트를 서버에 배치로 동기화합니다.

**기술 명세:**
```
참조: DOC-2 (TRD) > Section 6: Agent-Server Sync Protocol

동기화 전략:
- 기본: 5분마다 배치 전송
- 중요 이벤트 (커밋): 즉시 전송
- 오프라인: 큐에 저장, 재연결 시 전송

API: POST /api/v1/events/batch
```

**인수 조건:**
```
- [ ] HTTP 클라이언트 설정 (API 토큰 인증)
- [ ] 배치 전송 함수
- [ ] 스케줄러 (5분 간격)
- [ ] 오프라인 감지 및 큐잉
- [ ] 재시도 로직 (지수 백오프)
- [ ] 동기화 성공 시 로컬 마킹
```

---

## M3: 웹 대시보드 개발 (Day 11-17)

### [ ] TASK-M3-1: Next.js 프로젝트 설정

**컨텍스트 및 목표:**
Next.js 14 App Router 기반 프론트엔드를 설정합니다.

**기술 명세:**
```
참조: DOC-2 (TRD) > Section 2.4: Frontend

구조:
web/src/
├── app/
│   ├── (auth)/        # 인증 관련 페이지
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/   # 대시보드 (인증 필요)
│   │   ├── page.tsx
│   │   ├── timeline/
│   │   ├── projects/
│   │   ├── reports/
│   │   └── settings/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/            # shadcn/ui 컴포넌트
│   └── features/      # 기능별 컴포넌트
├── lib/
│   ├── api.ts         # API 클라이언트
│   └── utils.ts
├── hooks/
├── stores/            # Zustand 스토어
└── types/
```

**인수 조건:**
```
- [ ] Next.js 14 설치 (App Router)
- [ ] TypeScript 설정
- [ ] Tailwind CSS 설정
- [ ] shadcn/ui 초기화
- [ ] 폴더 구조 생성
- [ ] 경로 별칭 (@/) 설정
- [ ] npm run dev로 실행 확인
```

---

### [ ] TASK-M3-2: 디자인 시스템 구현

**컨텍스트 및 목표:**
Design System의 토큰과 기본 컴포넌트를 구현합니다.

**기술 명세:**
```
참조: DOC-5 (Design System) > Section 1-2

구현 항목:
- CSS 변수 (Tailwind extend)
- shadcn/ui 컴포넌트 커스터마이징
- 이벤트 타입별 색상/아이콘
```

**인수 조건:**
```
- [ ] tailwind.config.js에 커스텀 색상 추가
- [ ] 다크 모드 토글 구현
- [ ] Button, Input, Card 컴포넌트 설치
- [ ] EventBadge 컴포넌트 (이벤트 타입별)
- [ ] 컴포넌트 스토리 또는 샘플 페이지
```

---

### [ ] TASK-M3-3: 인증 UI 구현

**컨텍스트 및 목표:**
로그인, 회원가입 페이지와 인증 상태 관리를 구현합니다.

**기술 명세:**
```
참조: DOC-3 (User Flow) > Phase 1: Onboarding

페이지:
- /login
- /register
- /forgot-password (선택)

상태 관리: Zustand
```

**인수 조건:**
```
- [ ] 로그인 폼 (이메일, 비밀번호)
- [ ] 회원가입 폼 (이메일, 비밀번호, 이름)
- [ ] 폼 유효성 검사 (react-hook-form + zod)
- [ ] API 연동
- [ ] 토큰 저장 (localStorage 또는 cookie)
- [ ] 인증 상태 전역 관리
- [ ] Protected Route 래퍼
```

---

### [ ] TASK-M3-4: 대시보드 레이아웃

**컨텍스트 및 목표:**
사이드바, 헤더를 포함한 대시보드 레이아웃을 구현합니다.

**기술 명세:**
```
참조: DOC-5 (Design System) > Section 3: Layout System

레이아웃:
- Header: 로고, 검색바, 사용자 메뉴
- Sidebar: 네비게이션 (Dashboard, Timeline, Projects, Reports, Settings)
- Main: 컨텐츠 영역
```

**인수 조건:**
```
- [ ] 레이아웃 컴포넌트 생성
- [ ] 사이드바 네비게이션
- [ ] 반응형 (모바일에서 사이드바 접기)
- [ ] 활성 메뉴 표시
- [ ] 사용자 드롭다운 (프로필, 로그아웃)
```

---

### [ ] TASK-M3-5: 타임라인 뷰 구현

**컨텍스트 및 목표:**
이벤트를 시간순으로 표시하는 타임라인을 구현합니다.

**기술 명세:**
```
참조: DOC-1 (PRD) > FEAT-2, FEAT-3
참조: DOC-3 (User Flow) > FEAT-2, FEAT-3 Flow

API: GET /api/v1/events/timeline
```

**인수 조건:**
```
- [ ] 날짜별 그룹 헤더
- [ ] 이벤트 아이템 컴포넌트 (타입별 스타일)
- [ ] 무한 스크롤 (또는 페이지네이션)
- [ ] 필터: 이벤트 유형, 프로젝트
- [ ] 검색 기능
- [ ] 빈 상태 UI
- [ ] 로딩 상태 (스켈레톤)
```

---

### [ ] TASK-M3-6: 검색 기능 구현

**컨텍스트 및 목표:**
전문 검색 및 필터 기능을 구현합니다.

**기술 명세:**
```
참조: DOC-1 (PRD) > FEAT-2

API: GET /api/v1/search?q=keyword&type=git&from=date

기능:
- 키워드 검색
- 이벤트 유형 필터
- 날짜 범위 필터
- 프로젝트 필터
```

**인수 조건:**
```
- [ ] 검색 입력 컴포넌트
- [ ] 필터 드롭다운/팝오버
- [ ] 검색 결과 목록
- [ ] 결과 하이라이팅
- [ ] 키보드 단축키 (Cmd/Ctrl + K)
- [ ] 검색 히스토리 (선택)
```

---

### [ ] TASK-M3-7: 에이전트 관리 페이지

**컨텍스트 및 목표:**
등록된 에이전트 목록과 상태를 표시합니다.

**기술 명세:**
```
API:
- GET /api/v1/agents
- POST /api/v1/agents
- DELETE /api/v1/agents/:id
```

**인수 조건:**
```
- [ ] 에이전트 목록 테이블
- [ ] 상태 표시 (Connected, Offline, Error)
- [ ] 새 에이전트 등록 모달
- [ ] API 토큰 발급 및 복사
- [ ] 에이전트 삭제
- [ ] 마지막 동기화 시간 표시
```

---

## M4: 통합 및 연동 (Day 18-21)

### [ ] TASK-M4-1: 이벤트 배치 API 구현

**컨텍스트 및 목표:**
에이전트에서 전송하는 배치 이벤트를 처리하는 API를 구현합니다.

**기술 명세:**
```
참조: DOC-2 (TRD) > Section 4.3: Request/Response

API: POST /api/v1/events/batch
Auth: Bearer <agent_api_token>
```

**인수 조건:**
```
- [ ] 에이전트 토큰 인증 미들웨어
- [ ] 배치 이벤트 유효성 검사
- [ ] 트랜잭션으로 배치 저장
- [ ] 중복 이벤트 처리 (idempotency)
- [ ] 응답: 처리된 수, 실패 수
```

---

### [ ] TASK-M4-2: 실시간 업데이트 (선택)

**컨텍스트 및 목표:**
새 이벤트가 추가되면 대시보드에 실시간 반영합니다.

**기술 명세:**
```
옵션:
A. Server-Sent Events (SSE) - 간단
B. WebSocket - 양방향
C. Polling (5초) - 가장 간단
```

**인수 조건:**
```
- [ ] 실시간 연결 설정
- [ ] 새 이벤트 알림
- [ ] 타임라인 자동 업데이트
- [ ] 연결 상태 표시
```

---

### [ ] TASK-M4-3: 프로젝트 관리 기능

**컨텍스트 및 목표:**
프로젝트 CRUD 및 멤버 관리를 구현합니다.

**기술 명세:**
```
참조: DOC-1 (PRD) > FEAT-4

API:
- CRUD /api/v1/projects
- GET /api/v1/projects/:id/members
```

**인수 조건:**
```
- [ ] 프로젝트 목록 페이지
- [ ] 프로젝트 생성 모달
- [ ] 프로젝트 상세/편집
- [ ] Git 저장소 연결
- [ ] 멤버 초대 (MVP에서는 생략 가능)
```

---

### [ ] TASK-M4-4: 통계 대시보드

**컨텍스트 및 목표:**
활동 통계와 차트를 표시합니다.

**기술 명세:**
```
참조: DOC-1 (PRD) > FEAT-3

API: GET /api/v1/events/stats

차트 라이브러리: Recharts
```

**인수 조건:**
```
- [ ] 오늘/이번 주 커밋 수
- [ ] 활성 프로젝트 수
- [ ] 에이전트 연결 상태
- [ ] 이벤트 유형별 분포 (파이 차트)
- [ ] 일별 활동 추이 (라인 차트)
```

---

## M5: 테스트 및 배포 (Day 22-24)

### [ ] TASK-M5-1: API 테스트 작성

**컨텍스트 및 목표:**
핵심 API 엔드포인트의 통합 테스트를 작성합니다.

**기술 명세:**
```
테스트 도구: Vitest + Supertest
```

**인수 조건:**
```
- [ ] 인증 API 테스트 (register, login, refresh)
- [ ] 에이전트 API 테스트 (CRUD)
- [ ] 이벤트 API 테스트 (batch, list, search)
- [ ] 프로젝트 API 테스트
- [ ] 테스트 커버리지 > 70%
```

---

### [ ] TASK-M5-2: 에이전트 테스트

**컨텍스트 및 목표:**
Go 에이전트의 단위 테스트를 작성합니다.

**기술 명세:**
```
테스트 도구: Go testing + testify
```

**인수 조건:**
```
- [ ] Git 수집기 테스트
- [ ] 파일 수집기 테스트
- [ ] 동기화 모듈 테스트
- [ ] make test 성공
```

---

### [ ] TASK-M5-3: Docker 설정

**컨텍스트 및 목표:**
각 서비스의 Docker 이미지를 생성합니다.

**기술 명세:**
```
docker/
├── server.Dockerfile
├── web.Dockerfile
└── docker-compose.prod.yml
```

**인수 조건:**
```
- [ ] 서버 Dockerfile (Node.js)
- [ ] 웹 Dockerfile (Next.js)
- [ ] 프로덕션 docker-compose
- [ ] 로컬에서 docker-compose up 성공
```

---

### [ ] TASK-M5-4: CI/CD 파이프라인

**컨텍스트 및 목표:**
GitHub Actions로 자동 빌드/테스트/배포를 설정합니다.

**기술 명세:**
```
.github/workflows/
├── ci.yml          # PR 테스트
├── deploy.yml      # 프로덕션 배포
└── agent.yml       # 에이전트 릴리즈
```

**인수 조건:**
```
- [ ] PR에서 린트 + 테스트 실행
- [ ] main 브랜치 푸시 시 자동 배포
- [ ] 에이전트 태그 시 릴리즈 생성
- [ ] 환경 변수 시크릿 설정
```

---

### [ ] TASK-M5-5: 프로덕션 배포

**컨텍스트 및 목표:**
Railway 또는 Render에 프로덕션 배포합니다.

**기술 명세:**
```
참조: DOC-2 (TRD) > Section 2.6: Deployment

서비스:
- 서버: Railway/Render
- 웹: Vercel
- DB: Railway PostgreSQL
- 에이전트: GitHub Releases
```

**인수 조건:**
```
- [ ] 서버 배포 완료
- [ ] 웹 배포 완료
- [ ] DB 마이그레이션 완료
- [ ] HTTPS 설정
- [ ] 도메인 연결 (선택)
- [ ] 에이전트 다운로드 페이지
- [ ] 헬스 체크 통과
```

---

## Self-Correction Loop

각 태스크 완료 후 다음 체크리스트를 실행합니다:

```
[인수 기준 체크]
- [ ] 모든 인수 조건 충족?
- [ ] 타입 에러 없음?
- [ ] 콘솔 에러 없음?
- [ ] API 응답 정상?

[수정 지시]
충족되지 않은 항목이 있다면:
1. 해당 항목 식별
2. 에러 로그/메시지 분석
3. 관련 문서 참조 (DOC-1 ~ DOC-7)
4. 수정 후 재검증
```

---

## AI 협업 팁

```
[효과적인 프롬프트 작성]

1. 컨텍스트 제공
   "DOC-4를 참조해서 events 테이블의 Prisma 모델을 작성해줘"

2. 명확한 결과물 요청
   "POST /api/v1/events/batch 엔드포인트를 구현해줘.
    인수 조건에 맞게 에러 처리 포함"

3. 연속 작업 요청
   "TASK-M2-2가 완료됐어. TASK-M2-3으로 진행해줘"

4. 검증 요청
   "방금 작성한 코드의 인수 조건을 체크해줘"
```

---

## Document References

| 문서 | 참조 섹션 |
|------|-----------|
| DOC-1 (PRD) | FEAT-1 ~ FEAT-6 User Stories |
| DOC-2 (TRD) | Tech Stack, API Design |
| DOC-3 (User Flow) | FEAT-x Flows |
| DOC-4 (Database) | Schema, Tables |
| DOC-5 (Design System) | Components, Layout |
| DOC-7 (Convention) | Code Standards |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | Claude + User | Initial draft |

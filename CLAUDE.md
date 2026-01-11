# DevLog Hub - Claude Code 프로젝트 컨텍스트

## 🚨 세션 시작 시 필수 확인

**이 프로젝트에서 새 세션을 시작할 때 반드시 아래 명령을 먼저 실행하세요:**

```bash
./scripts/dev-resume.sh
```

또는 아래 내용을 직접 확인하세요.

---

## 📋 프로젝트 정보

| 항목 | 값 |
|------|-----|
| **프로젝트명** | DevLog Hub |
| **설명** | 개발 활동 자동 수집 및 관리 플랫폼 |
| **저장소** | https://github.com/saintgo7/full-dev-log |
| **브랜치** | develop |

## 🏗️ 아키텍처

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

## 📁 프로젝트 구조

```
devlog-hub/
├── agent/          # Go 에이전트 (로컬 수집기)
│   ├── cmd/        # 진입점
│   └── internal/   # 수집기, 저장소, 동기화
├── server/         # Node.js API 서버
│   ├── prisma/     # DB 스키마
│   └── src/        # 라우트, 서비스, 미들웨어
├── web/            # Next.js 대시보드
│   └── src/        # App Router, 컴포넌트, 훅
├── docs/           # 문서
│   └── dev-log/    # 개발 로그 (KO/EN, md/docx)
└── scripts/        # 유틸리티 스크립트
```

## 🔧 기술 스택

| 구성요소 | 기술 |
|---------|------|
| **Agent** | Go 1.21, fsnotify, go-git, SQLite |
| **Server** | Node.js 20, Express, Prisma, PostgreSQL |
| **Web** | Next.js 14, React Query, Zustand, Tailwind CSS |
| **Infra** | Docker, Docker Compose |

## 🚀 실행 방법

### 초기 설정
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 개발 서버 시작
```bash
./scripts/dev.sh
```

### 접속 URL
- **Web**: http://localhost:3020
- **API**: http://localhost:3001

## 📝 개발 로그 위치

개발 진행 상황은 `docs/dev-log/` 폴더에서 확인:

- `2026-01-11_1400_DevLogHub_전체개발완료_KO.md` - 한국어 마크다운
- `2026-01-11_1400_DevLogHub_전체개발완료_KO.docx` - 한국어 Word
- `2026-01-11_1400_DevLogHub_FullDevelopment_EN.md` - English Markdown
- `2026-01-11_1400_DevLogHub_FullDevelopment_EN.docx` - English Word

## ✅ 완료된 마일스톤

- [x] M0: 프로젝트 초기화 - 모노레포 구조
- [x] M1: 백엔드 기반 - Server, 인증 API
- [x] M2: Go 에이전트 - 수집기, 동기화
- [x] M3: 웹 대시보드 - Next.js UI
- [x] M4: 통합 - Docker, 스크립트
- [x] M5: Git 커밋 및 푸시

## 📊 코드 통계

- **총 파일**: 97개
- **총 라인**: 6,580줄
- **TypeScript**: 55개 (57%)
- **Go**: 10개 (10%)

## ⚠️ 주의사항

1. **Docker Desktop** 필요 (PostgreSQL 실행)
2. **Node.js 20+**, **Go 1.21+** 필요
3. 웹 포트: **3020** (기본 3000에서 변경됨)

## 🔄 개발 재개 시 체크리스트

1. [ ] Git 상태 확인: `git status`
2. [ ] 최근 커밋 확인: `git log --oneline -5`
3. [ ] 개발 로그 확인: `docs/dev-log/`
4. [ ] Docker 상태 확인: `docker-compose ps`
5. [ ] 의존성 설치 여부 확인

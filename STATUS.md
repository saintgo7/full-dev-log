# STATUS — DevLog Hub

> 자동 포트폴리오 스윕(claude/sweep-2026-06-13)에서 생성·갱신한 상태 문서다. 본문은 한국어, 마지막에 English Summary를 둔다. 여기 적힌 수치·결과는 모두 이 스윕에서 실제로 실행해 확인한 것이며, 미검증 항목은 "미검증"으로 표시한다.

## 1. 목적

개발 활동(Git 커밋, 파일 변경, 터미널 명령)을 로컬 에이전트가 자동 수집해 중앙 API 서버로 동기화하고, 웹 대시보드에서 타임라인·검색·리포트로 보여주는 개발 활동 추적 플랫폼이다. 모노레포로 세 컴포넌트로 구성된다.

- `agent/` — Go 로컬 수집기 (fsnotify, go-git, SQLite)
- `server/` — Node.js/Express API 서버 (Prisma, PostgreSQL, JWT 인증, Socket.IO)
- `web/` — Next.js 14 대시보드 (React Query, Zustand, Tailwind)
- 부가: `ide-plugins/`(VSCode/JetBrains 플러그인 스캐폴드), `scripts/`(dev-resume·HTML 리포트 생성 등), `docs/`(PRD/TRD/DB 설계 등 기획 문서 다수)

## 2. 현재 상태 (스윕 시점 검증 결과)

빌드/테스트 가능한 환경(go 1.26.3, node v22.16.0, npm 11.6.2)에서 실제 실행해 확인했다.

### 2.1 Agent (Go) — 정상

- `go build ./...` 성공 (exit 0).
- `go test ./...` 성공. `internal/collector` 패키지 테스트 8개 전부 PASS (`ok ... 0.49s`). 다른 패키지엔 테스트 파일이 없다.
- 결론. 에이전트는 빌드·테스트가 모두 통과하는 정상 상태다.

### 2.2 Server (Node/Express/Prisma) — 프로덕션 정상, 빌드 설정 1건 수정함

- `npm install` 정상(약 3초, 568 패키지). `prisma generate` 성공.
- **수정 전**: `npm run build`(=`tsc`)가 168개 오류로 실패했다. 단, 168개 **전부가 `src/__tests__/**` 테스트 파일** 안의 타입 오류(Prisma mock의 `never` 타입 추론)였고, **프로덕션 코드(`src/` 테스트 제외)의 타입 오류는 0개**였다. 원인은 `tsconfig.json`의 `include: ["src/**/*"]`가 테스트 파일까지 프로덕션 빌드에 포함시킨 것.
- **수정 내용(이 스윕)**: `server/tsconfig.json`의 `exclude`에 `"src/__tests__/**"`를 추가했다. jest는 이미 자체 inline tsconfig로 테스트를 돌리므로(`jest.config.js`) 영향 없음. 코드 변경 아님, 빌드 스코프 설정만 조정.
- **수정 후**: `npm run build` 성공. `dist/`가 생성되고 그 안에 `__tests__`는 들어가지 않음(의도대로). `npm test`(jest) 재실행 시 **6개 스위트 126개 테스트 전부 PASS** (변동 없음).
- 결론. 서버는 프로덕션 빌드·런타임 테스트 모두 정상. 테스트 파일 자체의 정적 타입 오류(168건)는 런타임(jest)에는 영향 없으나 `tsc`로는 잡히는 상태로 남아 있다(아래 §3).

### 2.3 Web (Next.js) — 프로덕션 타입 정상, 유닛 테스트 일부 실패, vitest 스코프 1건 수정함

- `npm install` 정상(약 10초, 709 패키지).
- 프로덕션 타입체크: `npx tsc --noEmit` 결과 오류 5개인데 **전부 `src/__tests__/hooks/useNotifications.test.ts` 한 파일**의 오류다(JSX를 쓰는데 확장자가 `.tsx`가 아닌 `.ts`라 발생). **프로덕션 코드(`src/` 테스트 제외) 타입 오류 0개**.
- **수정 전**: `vitest run`이 14개 파일 중 12개 실패(테스트 17 실패/104 통과)였다. 이 중 **7개는 `e2e/*.spec.ts`(Playwright 스펙)** 인데, vitest가 스코프 제한 없이 이들까지 실행하다 `Playwright Test did not expect test.describe()` 오류로 실패한 것이었다(원래 Playwright `test:e2e`로 돌려야 하는 파일).
- **수정 내용(이 스윕)**: 미추적(WIP) 파일 `web/vitest.config.ts`의 `test.exclude`에 `'e2e/**'`(+vitest 기본값 node_modules/dist 유지)를 추가했다.
- **수정 후**: `vitest run`이 e2e 스펙을 더는 건드리지 않음. 남은 유닛 테스트는 **7개 파일 중 2개 통과, 5개 실패(테스트 17 실패/104 통과)**. 실패는 아래 5개 파일에 한정된다.
  - `src/__tests__/components/VirtualList.test.tsx` — jsdom이 요소 높이를 0으로 보고해 가상 리스트가 항목을 렌더하지 않음(레이아웃 측정 한계). `act()` 경고 동반.
  - `src/__tests__/components/NotificationBell.test.tsx` — 드롭다운/배지 렌더 단언 실패.
  - `src/__tests__/hooks/useDebounce.test.ts` — fake timer/`act` 래핑 문제로 상태가 갱신 안 됨("initial" 그대로).
  - `src/__tests__/hooks/useNotifications.test.ts` — `.ts` 확장자에 JSX 사용(파싱/타입 오류).
  - `src/__tests__/utils/dateHelpers.test.ts` — `toLocaleDateString('ko-KR')`이 "2100년 1월 1일"을 반환하는데 테스트는 "2099" 포함을 기대(타임존/연말 경계로 브리틀).
- 참고. 참조하는 소스 파일(`src/components/common/VirtualList.tsx`, `src/components/notifications/NotificationBell.tsx`, `src/hooks/useDebounce.ts`, `src/hooks/useNotifications.ts`)은 모두 존재한다. 즉 import 누락이 아니라 테스트 환경/단언 품질 문제다.
- 결론. 웹은 프로덕션 코드 타입은 깨끗하고, 실패는 유닛 테스트의 환경/브리틀 이슈 5개 파일에 한정된다. `next build` 자체는 이번 스윕에서 시간 제약상 끝까지 돌리지 않음(미검증).

### 2.4 동작/미동작 요약

| 항목 | 결과 | 증거 |
|------|------|------|
| Agent 빌드 | 통과 | `go build ./...` exit 0 |
| Agent 테스트 | 통과 | collector 8개 PASS |
| Server 빌드(`tsc`) | 통과 (수정 후) | `dist/` 생성, 오류 0 |
| Server 테스트(jest) | 통과 | 6 스위트 126 테스트 PASS |
| Web 프로덕션 타입체크 | 통과 | 비테스트 코드 tsc 오류 0 |
| Web vitest 유닛 | 부분 실패 | 104 통과 / 17 실패(5개 파일) |
| Web `next build` | 미검증 | 시간 제약상 미실행 |
| Web Playwright e2e | 미검증 | 브라우저 필요, 미실행 |
| Docker Compose 전체 기동 | 미검증 | 외부 서비스(PostgreSQL) 필요, 스윕 안전규칙상 미실행 |

## 3. 마무리까지 남은 구체적 작업

1. **Web 유닛 테스트 17건 수리** (다중 파일, 본 스윕 범위 밖이라 문서화만 함).
   - `useNotifications.test.ts` → `useNotifications.test.tsx`로 확장자 변경(JSX 사용). tsc 오류 5건과 vitest 파싱 실패가 함께 해결될 전망. (가장 작고 안전한 후보지만, 추적 파일 rename이라 안전을 위해 미적용.)
   - `VirtualList.test.tsx` — jsdom에서 `getBoundingClientRect`/`clientHeight`를 mock하거나 `ResizeObserver` polyfill을 setup에 추가해 항목 높이가 0이 되지 않도록.
   - `useDebounce.test.ts` — `vi.useFakeTimers()` + `act()`/`advanceTimersByTime` 래핑 점검.
   - `dateHelpers.test.ts` — 연말 경계/타임존 단언을 고정 로캘·UTC 기준으로 견고화.
   - `NotificationBell.test.tsx` — 드롭다운 열림 상태/배지 렌더 단언을 실제 컴포넌트 구조에 맞춰 갱신.
2. **Server 테스트 파일 정적 타입 정리(168건)** — Prisma mock의 `never` 추론을 `jest.mocked()`/`DeepMockProxy`(예: `jest-mock-extended`) 패턴으로 교체. 런타임에는 영향 없으나 IDE/`tsc` 노이즈 제거 목적.
3. **`next build` 정식 검증** 및 필요 시 Next.js 14.0.4 보안 패치 업그레이드(아래 §5).
4. **통합(E2E) 검증** — `docker-compose up`으로 PostgreSQL+서버+웹 기동 후 Playwright e2e 7개 스펙 실행(외부 서비스 기동 필요, 스윕에서는 안전규칙상 미수행).
5. **IDE 플러그인(`ide-plugins/`) 완성도 점검** — 스캐폴드만 존재하는지 동작하는지 미검증.

## 4. 책/논문 개요 (Book/Paper Outline)

이 저장소는 "개발 활동 자동 수집·시각화 플랫폼" 사례를 다루는 **기술서/사례연구**로 쓸 만한 기획 자료가 이미 풍부하다. `docs/`에 PRD/TRD/User Flow/DB 설계/디자인 시스템/태스크/코딩 컨벤션 7종과, `docs/dev-log/`에 한/영 개발 완료 보고서(.md/.docx)가 존재한다(§11.10 양국어 산출 요건과도 부합). 아래는 집필 가능한 목차 초안이며, 각 절에 이미 존재하는 1차 자료를 매핑했다.

1. 서론 — 개발 활동 추적의 동기와 문제정의. (자료: `docs/DOC-1_...PRD.md`)
2. 요구사항·범위 — 기능(FEAT-1~6)과 비기능 요구. (자료: PRD, `docs/DOC-6_...TASKS.md`)
3. 아키텍처 — Agent/Server/Web 3계층, SQLite↔PostgreSQL 동기화 모델. (자료: `docs/DOC-2_...TRD.md`, README 아키텍처 다이어그램)
4. 데이터 모델 — 이벤트·프로젝트·리포트·에이전트 스키마. (자료: `docs/DOC-4_...DatabaseDesign.md`, `server/prisma/schema.prisma`)
5. 로컬 수집기 설계(Go) — Git/File/Terminal 수집기, 민감정보 필터링, fsnotify 폴링. (자료: `agent/internal/collector/*.go` + 테스트)
6. API 서버 설계 — 인증(JWT), 이벤트 배치 수집, 실시간(Socket.IO), 캐시. (자료: `server/src/**`, 테스트 126건)
7. 웹 대시보드 — 타임라인·검색·리포트 UI, React Query/Zustand 상태관리. (자료: `web/src/**`)
8. 테스트 전략 — 단위(go test/jest/vitest)·E2E(Playwright). (자료: `docs/M15-T1_Jest_Unit_Tests_Summary.md`, `docs/dev-log/2026-01-12_0320_M15-T3_E2E_Tests_Complete.md`)
9. 운영·배포 — Docker Compose, CI/CD(GitHub Actions 워크플로 3종), 리포트 자동 생성 스크립트. (자료: `docker-compose*.yml`, `.github/`, `scripts/generate-*.py`)
10. 사례 회고·한계·향후과제 — 본 STATUS의 §2~§3 실측 결과를 그대로 근거로 활용. (자료: `docs/dev-log/` 한/영 보고서)

집필 시 주의: §11(논문 정직성)에 따라 "테스트 전부 통과" 같은 표현은 컴포넌트별로 한정해야 한다(에이전트·서버는 통과, 웹 유닛은 17건 실패가 사실). 시뮬레이션·미수행 항목(next build, e2e, docker 통합)은 실측처럼 적지 말 것.

## 5. 위험·주의 (Risk Notes)

- `web/package.json`의 `next@14.0.4`는 `npm install` 시 보안 취약점 경고가 떴다(2025-12-11 공지). 업그레이드는 동작 영향이 있어 본 스윕에서 변경하지 않음. 별도 검토 필요.
- 본 스윕에서는 외부 서비스(PostgreSQL/Docker)를 기동하지 않았다. 통합 동작은 미검증.
- 이번 커밋에는 스윕 진입 전부터 존재하던 대량의 WIP(추적 176건: server/web/agent 광범위 수정 + 신규 docs/CI/Docker 파일)가 함께 체크포인트된다. 이 WIP는 본 스윕이 만든 것이 아니라 기존 작업분이며, 되돌리기 단위 확보를 위해 함께 커밋했다.
- 변경은 모두 빌드 설정 2건뿐이며 코드 로직은 건드리지 않았다(되돌리기 쉬움).

---

## English Summary

DevLog Hub is a monorepo dev-activity tracking platform: a Go local agent (collects Git/file/terminal events into SQLite), a Node/Express/Prisma API server (PostgreSQL, JWT, Socket.IO), and a Next.js 14 dashboard.

Verified this sweep (go 1.26.3 / node 22.16.0):
- **Agent (Go)**: `go build ./...` and `go test ./...` both pass (8 collector tests PASS).
- **Server**: All 168 `tsc` build errors were inside `src/__tests__/**` only — production code had 0 type errors. Fixed by adding `"src/__tests__/**"` to `tsconfig.json` `exclude` (jest runs tests via its own config, unaffected). After fix: `npm run build` succeeds, and `npm test` still passes all **126 tests / 6 suites**.
- **Web**: Production code type-checks clean (the only 5 `tsc` errors are in one mis-extensioned test file `useNotifications.test.ts`). Fixed `vitest.config.ts` to exclude `e2e/**` so vitest no longer tries to run Playwright specs (was causing 7 false failures). Remaining: **17 unit-test failures across 5 files** (jsdom layout limits in VirtualList, fake-timer/act issues in useDebounce, brittle locale assertion in dateHelpers, JSX-in-.ts file, NotificationBell render assertions). These are pre-existing test-quality issues; fixing them is multi-file work, documented not attempted.

Not verified (out of safe scope / time-box): `next build`, Playwright e2e, full Docker Compose integration. `next@14.0.4` has a flagged security advisory — upgrade needs separate review.

Changes made by this sweep: 2 build-config edits only (`server/tsconfig.json`, `web/vitest.config.ts`); no logic changes, easily reversible. A large pre-existing WIP (176 tracked files) is checkpointed in the same commit.

The `docs/` folder holds substantial planning material (PRD/TRD/DB design/design system/tasks/coding convention + bilingual KO/EN dev-log reports), so this repo is well-positioned as a technical book / case-study; see the outline in §4.

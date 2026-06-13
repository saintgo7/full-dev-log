---
session_id: devlog-hub-planning-2026-01-11
date: 2026-01-11
version: v1.0
project_name: DevLog Hub
document_type: Coding Convention (코딩 컨벤션)
author: Claude + Developer
---

# DOC-7: DevLog Hub Coding Convention (코딩 컨벤션)

## 1. 개요

### 1.1 문서 목적
DevLog Hub 프로젝트의 코드 품질, 일관성, AI 협업 가이드라인을 정의합니다.

### 1.2 적용 범위

| 컴포넌트 | 언어 | 린터/포맷터 |
|----------|------|-------------|
| Server | TypeScript | ESLint, Prettier |
| Web | TypeScript (JSX) | ESLint, Prettier |
| Agent | Go | gofmt, golint |

### 1.3 문서 참조
| Doc ID | 참조 내용 |
|--------|----------|
| DOC-2 | 기술 스택 버전 |
| DOC-5 | UI 컴포넌트 스타일 가이드 |
| DOC-6 | 태스크별 코딩 컨텍스트 |

---

## 2. TypeScript 컨벤션 (Server & Web)

### 2.1 파일 구조

```
// 파일명: kebab-case
user-service.ts
auth.routes.ts
use-socket.ts

// 컴포넌트 파일: PascalCase
DashboardPage.tsx
EventCard.tsx
SocketProvider.tsx
```

### 2.2 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수/함수 | camelCase | `getUserById`, `eventCount` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 클래스/타입/인터페이스 | PascalCase | `UserService`, `EventType` |
| 컴포넌트 | PascalCase | `EventCard`, `DashboardLayout` |
| 훅 | use + PascalCase | `useSocket`, `useAuth` |
| 이벤트 핸들러 | handle + Action | `handleClick`, `handleSubmit` |
| 불리언 | is/has/should + Noun | `isLoading`, `hasError` |

### 2.3 타입 정의

```typescript
// ✅ 인터페이스: 객체 형태 정의
interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// ✅ 타입 별칭: 유니온, 유틸리티 타입
type EventType = 'git' | 'file' | 'terminal' | 'manual';
type UserWithEvents = User & { events: Event[] };

// ✅ Enum: 유한한 값 집합 (Prisma 스키마와 동기화)
enum Role {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

// ❌ any 사용 금지
function processData(data: any) {} // Bad

// ✅ unknown + 타입 가드 사용
function processData(data: unknown) {
  if (isValidEvent(data)) {
    // data는 Event 타입
  }
}
```

### 2.4 함수 작성

```typescript
// ✅ 화살표 함수 선호 (일관성)
const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

// ✅ 명시적 반환 타입
const calculateStats = (events: Event[]): Stats => {
  // ...
};

// ✅ 조기 반환으로 중첩 줄이기
const validateToken = (token: string): boolean => {
  if (!token) return false;
  if (token.length < 10) return false;
  return true;
};

// ❌ 중첩된 조건문
const validateToken = (token: string): boolean => {
  if (token) {
    if (token.length >= 10) {
      return true;
    }
  }
  return false;
};
```

### 2.5 에러 처리

```typescript
// ✅ 커스텀 에러 클래스
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ✅ 명확한 에러 던지기
const getUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  }
  return user;
};

// ✅ try-catch에서 에러 타입 명시
try {
  await someOperation();
} catch (error) {
  if (error instanceof AppError) {
    // AppError 처리
  } else if (error instanceof Error) {
    // 일반 에러 처리
  }
}
```

### 2.6 비동기 패턴

```typescript
// ✅ async/await 사용
const fetchEvents = async () => {
  const response = await fetch('/api/events');
  const data = await response.json();
  return data;
};

// ✅ Promise.all로 병렬 처리
const [user, events] = await Promise.all([
  getUser(userId),
  getEvents(userId),
]);

// ❌ 순차적 await (불필요한 경우)
const user = await getUser(userId);
const events = await getEvents(userId); // 의존성 없으면 병렬로
```

---

## 3. React/Next.js 컨벤션 (Web)

### 3.1 컴포넌트 구조

```typescript
// 1. 임포트 순서
import { useState, useEffect } from 'react'; // React
import { useQuery } from '@tanstack/react-query'; // 외부 라이브러리
import { Button } from '@/components/ui/Button'; // 내부 컴포넌트
import { formatDate } from '@/lib/utils'; // 유틸리티
import type { Event } from '@/types'; // 타입 (맨 마지막)

// 2. 타입 정의
interface EventCardProps {
  event: Event;
  onDelete?: (id: string) => void;
}

// 3. 컴포넌트
export const EventCard = ({ event, onDelete }: EventCardProps) => {
  // 3-1. 훅
  const [isExpanded, setIsExpanded] = useState(false);

  // 3-2. 핸들러
  const handleToggle = () => setIsExpanded(!isExpanded);

  // 3-3. 렌더링
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};
```

### 3.2 훅 사용 규칙

```typescript
// ✅ 커스텀 훅으로 로직 분리
const useEvents = (filters: EventFilters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventService.getEvents(filters),
  });
};

// ✅ 훅 호출 순서 일관성
const MyComponent = () => {
  // 1. 상태 훅
  const [state, setState] = useState();

  // 2. 컨텍스트 훅
  const { user } = useAuth();

  // 3. 쿼리 훅
  const { data, isLoading } = useEvents();

  // 4. 이펙트 훅
  useEffect(() => {}, []);

  // 5. 메모이제이션 훅
  const memoizedValue = useMemo(() => {}, []);
};
```

### 3.3 조건부 렌더링

```typescript
// ✅ 조기 반환
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <DataView data={data} />;

// ✅ && 연산자 (단순 조건)
{isVisible && <Modal />}

// ✅ 삼항 연산자 (양쪽 케이스)
{isLoggedIn ? <Dashboard /> : <LoginPrompt />}

// ❌ 중첩된 삼항 연산자
{isA ? <A /> : isB ? <B /> : <C />} // Bad
```

### 3.4 스타일링 (Tailwind)

```typescript
// ✅ 클래스 순서: 레이아웃 → 박스 모델 → 타이포그래피 → 시각 → 기타
<div className="flex items-center gap-4 p-4 text-sm text-gray-700 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">

// ✅ 조건부 클래스 (clsx 또는 cn 사용)
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-lg font-medium',
    variant === 'primary' && 'bg-blue-500 text-white',
    variant === 'secondary' && 'bg-gray-100 text-gray-900',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>

// ❌ 인라인 스타일
<div style={{ marginTop: 20 }}> // Bad
```

---

## 4. Go 컨벤션 (Agent)

### 4.1 파일 구조

```
agent/
├── cmd/
│   └── devlog-agent/
│       └── main.go         # 진입점
├── internal/               # 내부 패키지 (외부 임포트 불가)
│   ├── collector/
│   │   ├── collector.go    # 인터페이스
│   │   ├── git.go
│   │   └── file.go
│   ├── config/
│   │   └── config.go
│   └── storage/
│       └── sqlite.go
└── pkg/                    # 외부 공개 패키지 (필요시)
```

### 4.2 네이밍 규칙

```go
// 패키지명: 소문자, 단일 단어
package collector

// 공개 함수/타입: PascalCase (대문자 시작)
func NewGitCollector() *GitCollector {}
type GitCollector struct {}

// 비공개 함수/타입: camelCase (소문자 시작)
func (g *GitCollector) scanRepositories() {}
type repositoryInfo struct {}

// 상수: 공개면 PascalCase, 비공개면 camelCase
const MaxRetryCount = 3
const defaultTimeout = 30 * time.Second

// 인터페이스: 동사 + er
type Collector interface {
    Collect() ([]Event, error)
}

type Storage interface {
    Store(event Event) error
}
```

### 4.3 에러 처리

```go
// ✅ 에러를 반환값으로
func GetConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("failed to read config: %w", err)
    }
    // ...
}

// ✅ 에러 래핑 (%w)
if err != nil {
    return fmt.Errorf("collecting git events: %w", err)
}

// ✅ 에러 검사
config, err := GetConfig(path)
if err != nil {
    log.Error().Err(err).Msg("failed to load config")
    return
}

// ❌ 에러 무시
config, _ := GetConfig(path) // Bad
```

### 4.4 구조체 및 메서드

```go
// ✅ 생성자 함수
func NewGitCollector(config CollectorConfig, storage Storage) *GitCollector {
    return &GitCollector{
        config:   config,
        storage:  storage,
        lastScan: make(map[string]time.Time),
    }
}

// ✅ 메서드 리시버: 일관된 이름 (타입 첫 글자 소문자)
func (g *GitCollector) Collect() ([]Event, error) {}
func (g *GitCollector) scanRepo(path string) {}

// ✅ 값 리시버 vs 포인터 리시버
// - 수정이 필요하면 포인터 (*T)
// - 읽기만 하면 값 (T), 단 큰 구조체는 포인터
```

### 4.5 고루틴 및 채널

```go
// ✅ 컨텍스트로 취소 처리
func (s *Syncer) Start(ctx context.Context) {
    ticker := time.NewTicker(s.config.Interval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            log.Info().Msg("syncer stopped")
            return
        case <-ticker.C:
            s.sync()
        }
    }
}

// ✅ 채널 닫기 책임 명확히
func produce(ch chan<- Event) {
    defer close(ch) // 생산자가 닫음
    // ...
}
```

---

## 5. API 컨벤션

### 5.1 RESTful 설계

```
# 리소스 네이밍: 복수형 명사
GET    /api/v1/events          # 목록
POST   /api/v1/events          # 생성
GET    /api/v1/events/:id      # 조회
PATCH  /api/v1/events/:id      # 부분 수정
DELETE /api/v1/events/:id      # 삭제

# 중첩 리소스
GET    /api/v1/projects/:id/members
POST   /api/v1/agents/:id/regenerate-token  # 액션은 동사 허용

# 쿼리 파라미터: camelCase
GET    /api/v1/events?eventType=git&dateFrom=2026-01-01&limit=20
```

### 5.2 응답 형식

```typescript
// 성공 응답
{
  "data": { ... },           // 또는 배열
  "meta": {                  // 선택적 메타데이터
    "total": 100,
    "nextCursor": "..."
  }
}

// 에러 응답
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID xxx not found",
    "details": { ... }       // 선택적 상세 정보
  }
}

// HTTP 상태 코드
200 OK           - 성공
201 Created      - 생성 성공
204 No Content   - 삭제 성공
400 Bad Request  - 입력 오류
401 Unauthorized - 인증 필요
403 Forbidden    - 권한 없음
404 Not Found    - 리소스 없음
500 Internal     - 서버 오류
```

---

## 6. Git 컨벤션

### 6.1 브랜치 전략

```
main              # 프로덕션
├── develop       # 개발 통합
│   ├── feature/login-page
│   ├── feature/agent-sync
│   └── fix/event-filter-bug
└── hotfix/security-patch
```

### 6.2 커밋 메시지

```
# 형식
<type>(<scope>): <subject>

<body>

<footer>

# 타입
feat:     새 기능
fix:      버그 수정
docs:     문서 변경
style:    포맷팅 (코드 변경 없음)
refactor: 리팩토링
test:     테스트 추가/수정
chore:    빌드, 설정 변경

# 예시
feat(agent): add file change debouncing

Implement 500ms debounce window for file events
to prevent excessive event generation during saves.

Closes #123
```

### 6.3 PR 가이드

```markdown
## 요약
[1-2문장 설명]

## 변경 사항
- [변경 1]
- [변경 2]

## 테스트
- [ ] 유닛 테스트 통과
- [ ] E2E 테스트 통과
- [ ] 수동 테스트 완료

## 스크린샷 (UI 변경 시)
[이미지]

## 관련 이슈
Closes #123
```

---

## 7. AI 협업 가이드

### 7.1 프롬프트 작성 시 포함할 정보

1. **컨텍스트**: 현재 파일, 관련 파일 경로
2. **요구사항**: 구체적 기능 목록
3. **제약사항**: 기술 스택, 버전, 스타일 가이드
4. **참조**: DOC-x 문서, 기존 코드 패턴
5. **인수 조건**: 완료 체크리스트

### 7.2 코드 생성 요청 예시

```
[좋은 예시]
"server/src/services/event.service.ts에 getEventStats 함수를 추가해주세요.

요구사항:
1. 최근 N일간 이벤트 통계 반환
2. 이벤트 타입별 카운트
3. 일별 카운트

입력: days (number, 기본값 7)
출력: { byType: Record<EventType, number>, byDay: { date: string, count: number }[] }

참조:
- 기존 getEvents 함수 패턴 따르기
- Prisma groupBy 사용
- DOC-7 에러 처리 규칙 준수"

[나쁜 예시]
"이벤트 통계 기능 만들어줘"
```

### 7.3 리뷰 요청 시

```
"다음 코드를 리뷰해주세요:

1. DOC-7 컨벤션 준수 여부
2. 에러 처리 누락 확인
3. 타입 안전성
4. 성능 이슈

[코드 블록]"
```

---

## 8. 보안 가이드라인

### 8.1 인증/인가

```typescript
// ✅ 비밀번호 해싱
const hash = await bcrypt.hash(password, 10);

// ✅ JWT 시크릿 환경 변수
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET required');

// ✅ 토큰 검증
const decoded = jwt.verify(token, secret);

// ✅ 권한 체크
if (user.role !== 'admin') {
  throw new AppError(403, 'Admin access required');
}
```

### 8.2 입력 검증

```typescript
// ✅ Zod 스키마 검증
const createEventSchema = z.object({
  eventType: z.enum(['git', 'file', 'terminal', 'manual']),
  title: z.string().min(1).max(255),
  content: z.string().optional(),
});

// ✅ 컨트롤러에서 검증
const result = createEventSchema.safeParse(req.body);
if (!result.success) {
  throw new AppError(400, 'Invalid input', result.error);
}
```

### 8.3 SQL 인젝션 방지

```typescript
// ✅ Prisma 파라미터화 쿼리 (자동)
const user = await prisma.user.findUnique({
  where: { email }, // 자동으로 이스케이프
});

// ❌ Raw 쿼리에 변수 직접 삽입
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}` // Bad if not parameterized
```

### 8.4 민감 정보 처리

```typescript
// ✅ 응답에서 비밀번호 제외
const { passwordHash, ...userWithoutPassword } = user;

// ✅ 로그에서 민감 정보 마스킹
log.info('User login', { email, password: '***' });

// ✅ 환경 변수로 시크릿 관리
// .env.example에는 플레이스홀더만
JWT_SECRET=your-secret-here
```

---

## 부록: 체크리스트

### 코드 리뷰 체크리스트

- [ ] 네이밍 규칙 준수
- [ ] 타입 안전성 (any 없음)
- [ ] 에러 처리 완전성
- [ ] 입력 검증 존재
- [ ] 불필요한 console.log 제거
- [ ] 주석 최신화
- [ ] 테스트 커버리지

### PR 머지 전 체크리스트

- [ ] CI 파이프라인 통과
- [ ] 충돌 해결
- [ ] 리뷰어 승인
- [ ] 문서 업데이트 (필요시)

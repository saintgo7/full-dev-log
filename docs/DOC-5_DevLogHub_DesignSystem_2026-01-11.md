# Design System (디자인 시스템)

## Document Metadata

```yaml
doc_id: DOC-5
type: Design System
project_name: DevLog Hub
version: 1.0
last_updated: 2026-01-11
design_tool: Figma (권장)
css_framework: Tailwind CSS
component_library: shadcn/ui (권장)
```

---

## 1. Design Tokens

### 1.1 Color Palette

**브랜드 컬러 (Brand Colors)**

DevLog Hub은 개발자 도구 느낌의 차분하면서도 전문적인 컬러를 사용합니다.

| Role | Token | Light Mode | Dark Mode | Usage |
|------|-------|------------|-----------|-------|
| Primary | --color-primary | #2563EB | #3B82F6 | 주요 액션, 로고 |
| Primary Hover | --color-primary-hover | #1D4ED8 | #60A5FA | 호버 상태 |
| Secondary | --color-secondary | #7C3AED | #8B5CF6 | 보조 액션, 강조 |
| Accent | --color-accent | #10B981 | #34D399 | 성공, 활성 상태 |

**역할 기반 색상 (Semantic Colors)**

| Role | Token | Light Mode | Dark Mode | Usage |
|------|-------|------------|-----------|-------|
| Background | --color-bg | #F8FAFC | #0F172A | 페이지 배경 |
| Surface | --color-surface | #FFFFFF | #1E293B | 카드, 패널 |
| Surface Raised | --color-surface-raised | #F1F5F9 | #334155 | 호버 배경 |
| Text Primary | --color-text-1 | #0F172A | #F8FAFC | 제목, 본문 |
| Text Secondary | --color-text-2 | #64748B | #94A3B8 | 보조 텍스트 |
| Text Muted | --color-text-3 | #94A3B8 | #64748B | 비활성 텍스트 |
| Border | --color-border | #E2E8F0 | #334155 | 구분선 |
| Border Focus | --color-border-focus | #2563EB | #3B82F6 | 포커스 상태 |

**이벤트 유형 색상 (Event Type Colors)**

| Event Type | Token | Color | Background | Usage |
|------------|-------|-------|------------|-------|
| Git | --color-git | #F97316 | #FFF7ED | 커밋, 푸시, PR |
| File | --color-file | #3B82F6 | #EFF6FF | 파일 저장, 생성 |
| Terminal | --color-terminal | #10B981 | #ECFDF5 | 명령어 실행 |
| Manual | --color-manual | #8B5CF6 | #F5F3FF | 메모, 노트 |

**피드백 색상 (Feedback Colors)**

| Role | Token | Color | Usage |
|------|-------|-------|-------|
| Success | --color-success | #10B981 | 성공 메시지, 동기화 완료 |
| Warning | --color-warning | #F59E0B | 주의, 오프라인 상태 |
| Error | --color-error | #EF4444 | 오류, 동기화 실패 |
| Info | --color-info | #3B82F6 | 정보 알림 |

### 1.2 Typography Scale

**Font Family**

```css
/* 본문용 - 가독성 우선 */
--font-sans: 'Inter', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;

/* 코드/로그용 - 개발자 친화적 */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

**Type Scale**

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| --text-xs | 11px | 1.5 | 400 | 타임스탬프, 메타 |
| --text-sm | 13px | 1.5 | 400 | 보조 텍스트, 라벨 |
| --text-base | 14px | 1.6 | 400 | 본문 (기본) |
| --text-md | 15px | 1.5 | 500 | 강조 본문 |
| --text-lg | 16px | 1.4 | 600 | 카드 제목 |
| --text-xl | 18px | 1.4 | 600 | 섹션 제목 |
| --text-2xl | 22px | 1.3 | 700 | 페이지 제목 |
| --text-3xl | 28px | 1.2 | 700 | 대시보드 헤더 |

### 1.3 Spacing Scale

**Base Unit: 4px**

| Token | Value | Usage |
|-------|-------|-------|
| --space-0 | 0 | None |
| --space-1 | 4px | 인라인 요소 간격 |
| --space-2 | 8px | 아이콘-텍스트 간격 |
| --space-3 | 12px | 폼 요소 내부 |
| --space-4 | 16px | 카드 내부 패딩 |
| --space-5 | 20px | 섹션 간격 |
| --space-6 | 24px | 컴포넌트 간격 |
| --space-8 | 32px | 섹션 패딩 |
| --space-10 | 40px | 페이지 섹션 |
| --space-12 | 48px | 대형 섹션 |

### 1.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 4px | 인풋, 버튼 |
| --radius-md | 6px | 카드, 드롭다운 |
| --radius-lg | 8px | 모달, 패널 |
| --radius-xl | 12px | 대형 카드 |
| --radius-full | 9999px | 아바타, 태그 |

### 1.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| --shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | 호버 상태 |
| --shadow-md | 0 4px 6px -1px rgba(0,0,0,0.1) | 카드 기본 |
| --shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.1) | 드롭다운, 팝오버 |
| --shadow-xl | 0 20px 25px -5px rgba(0,0,0,0.1) | 모달 |

---

## 2. UI Components

### 2.1 Event Log Item

DevLog Hub의 핵심 컴포넌트 - 개별 로그 이벤트 표시

**Structure**

```
+------------------------------------------------------------------+
| [Icon] [Event Type Badge]                    [Timestamp]         |
| [Title / Summary]                                                |
| [Content Preview...]                                             |
| [Tags] [Project Badge]                       [Actions: ...]      |
+------------------------------------------------------------------+
```

**Variants by Event Type**

| Type | Icon | Badge Color | Example Title |
|------|------|-------------|---------------|
| git:commit | GitCommit | Orange | "feat: Add user authentication" |
| git:push | Upload | Orange | "Pushed 3 commits to main" |
| file:save | FileText | Blue | "Modified: src/auth/login.ts" |
| terminal:exec | Terminal | Green | "npm run build (exit: 0)" |
| manual:memo | StickyNote | Purple | "API 설계 노트" |

### 2.2 Button Component

**Variants**

| Variant | Style | Usage |
|---------|-------|-------|
| Primary | Solid blue background | 주요 액션 (저장, 검색) |
| Secondary | Border + text only | 보조 액션 (취소, 필터) |
| Ghost | Text only, no border | 링크 스타일 버튼 |
| Destructive | Red background | 삭제 액션 |
| Icon | 아이콘만, 사각/원형 | 툴바 버튼 |

**Sizes**

| Size | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| sm | 28px | 8px 12px | 12px | 14px |
| md | 36px | 10px 16px | 14px | 16px |
| lg | 44px | 12px 24px | 16px | 20px |

**States**

| State | Visual Change |
|-------|---------------|
| Default | Base styling |
| Hover | brightness(0.95) |
| Active | brightness(0.9) |
| Focus | 2px ring, offset 2px |
| Disabled | opacity 0.5, cursor not-allowed |
| Loading | Spinner 표시, 비활성화 |

### 2.3 Search Input

대시보드 상단 검색바

**Structure**

```
+------------------------------------------------------------------+
| [Search Icon] [Input: "Search logs..."]  [Filters] [Search Btn] |
+------------------------------------------------------------------+
```

**Features**

| Feature | Description |
|---------|-------------|
| Autocomplete | 최근 검색어, 인기 키워드 |
| Filters | 날짜, 이벤트 유형, 프로젝트, 작성자 |
| Keyboard | Enter로 검색, Esc로 초기화 |
| Loading | 검색 중 스피너 표시 |

### 2.4 Timeline View

시간순 이벤트 스트림

**Structure**

```
+--- Today, Jan 11 ---+
|                     |
| [Time] [Event Item] |
| 14:32  [Git commit] |
|                     |
| 13:45  [File save]  |
|                     |
+--- Yesterday -------+
|                     |
| 18:20  [Terminal]   |
|                     |
```

**Features**

| Feature | Description |
|---------|-------------|
| Date Headers | 날짜별 그룹 헤더 |
| Time Display | 상대 시간 (방금, 5분 전) + 절대 시간 |
| Infinite Scroll | 스크롤 시 이전 로그 로딩 |
| Real-time Update | 새 로그 상단에 애니메이션 추가 |

### 2.5 Stats Card

통계 대시보드 카드

**Structure**

```
+------------------------+
| [Icon]                 |
| [Title]                |
| [Value]      [Trend]   |
| [Subtitle/Period]      |
+------------------------+
```

**Examples**

| Card | Title | Value | Trend |
|------|-------|-------|-------|
| Today's Commits | 오늘 커밋 | 24 | +12% |
| Active Projects | 활성 프로젝트 | 5 | - |
| Sync Status | 동기화 상태 | Connected | Green dot |

### 2.6 Project Selector

프로젝트 필터/선택

**Structure**

```
+----------------------------------+
| [All Projects ▼]                 |
+----------------------------------+
| [Search projects...]             |
| -------------------------------- |
| [Color] Project Alpha     [12]  |
| [Color] Project Beta       [8]  |
| [Color] Personal           [3]  |
+----------------------------------+
```

### 2.7 Agent Status Indicator

로컬 에이전트 상태 표시

| Status | Icon | Color | Text |
|--------|------|-------|------|
| Connected | CheckCircle | Green | 연결됨 |
| Syncing | RefreshCw (spin) | Blue | 동기화 중... |
| Offline | WifiOff | Yellow | 오프라인 |
| Error | AlertCircle | Red | 연결 실패 |

---

## 3. Layout System

### 3.1 Page Layout

**Main Dashboard Layout**

```
+----------------------------------------------------------+
| [Logo] [Search Bar                   ] [User] [Settings] |  <- Header (56px)
+----------------------------------------------------------+
| [Side   | [Main Content Area                           ] |
|  Nav    |                                                |
|  220px] | [Stats Cards Row]                             |
|         |                                                |
|         | [Timeline / Search Results]                   |
|         |                                                |
|         |                                                |
+----------------------------------------------------------+
```

**Sidebar Navigation**

```
+-----------------------+
| [User Avatar]         |
| [Username]            |
+-----------------------+
| Dashboard             |  <- Active
| Timeline              |
| Projects              |
| Reports               |
+-----------------------+
| Settings              |
| Agent Status          |
+-----------------------+
```

### 3.2 Breakpoints

| Token | Width | Layout Change |
|-------|-------|---------------|
| --bp-sm | 640px | Mobile - 사이드바 숨김 |
| --bp-md | 768px | Tablet - 축소 사이드바 |
| --bp-lg | 1024px | Desktop - 전체 레이아웃 |
| --bp-xl | 1280px | Wide - 여유 공간 활용 |

### 3.3 Content Width

| Context | Max Width | Usage |
|---------|-----------|-------|
| Dashboard | 100% | 전체 너비 활용 |
| Search Results | 960px | 가독성 최적화 |
| Settings | 720px | 폼 레이아웃 |
| Modal Content | 560px | 집중 뷰 |

---

## 4. Icon System

### 4.1 Icon Library

**Primary:** Lucide Icons (lucide.dev)

### 4.2 Icon Usage by Feature

| Feature | Icon Name | Size |
|---------|-----------|------|
| Git Events | GitCommit, GitBranch, GitPullRequest | 16-20px |
| File Events | FileText, FilePlus, FileX | 16-20px |
| Terminal | Terminal, TerminalSquare | 16-20px |
| Notes | StickyNote, PenLine | 16-20px |
| Search | Search, Filter | 16-20px |
| Settings | Settings, Cog | 20px |
| User | User, UserCircle | 24px |
| Status | CheckCircle, AlertCircle, XCircle | 16px |
| Navigation | ChevronRight, ChevronDown | 16px |
| Actions | MoreHorizontal, Edit, Trash | 16px |

### 4.3 Icon Colors

| Context | Color Token |
|---------|-------------|
| Default | --color-text-2 |
| Active | --color-primary |
| Destructive | --color-error |
| Success | --color-success |

---

## 5. Accessibility

### 5.1 Color Contrast

| Pair | Ratio | Pass (AA) |
|------|-------|-----------|
| Text Primary on Surface | 15.8:1 | Yes |
| Text Secondary on Surface | 4.6:1 | Yes |
| Primary Button Text | 4.5:1 | Yes |
| Error on Error BG | 4.7:1 | Yes |

### 5.2 Focus Indicators

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### 5.3 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Global Search | Cmd/Ctrl + K |
| New Note | Cmd/Ctrl + N |
| Refresh | Cmd/Ctrl + R |
| Settings | Cmd/Ctrl + , |
| Close Modal | Escape |

### 5.4 ARIA Labels

| Component | aria-label |
|-----------|------------|
| Search Input | "Search development logs" |
| Filter Button | "Filter search results" |
| Sync Status | "Agent sync status: {status}" |
| Event Item | "{type} event: {title}" |

---

## 6. Animation & Motion

### 6.1 Transitions

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| --transition-fast | 100ms | ease-out | 호버, 토글 |
| --transition-normal | 200ms | ease-in-out | 패널, 드롭다운 |
| --transition-slow | 300ms | ease-in-out | 모달, 사이드바 |

### 6.2 Animations

| Animation | Duration | Description |
|-----------|----------|-------------|
| fadeIn | 200ms | 새 요소 등장 |
| slideUp | 200ms | 새 로그 추가 |
| pulse | 2000ms | 동기화 상태 |
| spin | 1000ms | 로딩 스피너 |

### 6.3 Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Dark Mode

### 7.1 Implementation

```css
/* System preference detection */
@media (prefers-color-scheme: dark) {
  :root { /* dark tokens */ }
}

/* Manual toggle */
[data-theme="dark"] { /* dark tokens */ }
```

### 7.2 Dark Mode Adjustments

| Element | Light | Dark | Notes |
|---------|-------|------|-------|
| Shadows | rgba(0,0,0,0.1) | rgba(0,0,0,0.3) | 더 진하게 |
| Borders | #E2E8F0 | #334155 | 더 밝게 |
| Code Blocks | #F1F5F9 | #0D1117 | GitHub Dark 스타일 |

---

## 8. Code/Log Display

### 8.1 Code Block Styling

```css
.code-block {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  background: var(--color-surface-raised);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
```

### 8.2 Syntax Highlighting

DevLog Hub은 GitHub 스타일 하이라이팅 사용

| Token Type | Light Mode | Dark Mode |
|------------|------------|-----------|
| Keyword | #CF222E | #FF7B72 |
| String | #0A3069 | #A5D6FF |
| Comment | #6E7781 | #8B949E |
| Function | #8250DF | #D2A8FF |
| Variable | #953800 | #FFA657 |

---

## 9. Component State Matrix

| Component | Default | Hover | Active | Focus | Disabled | Error |
|-----------|---------|-------|--------|-------|----------|-------|
| Button | Yes | Yes | Yes | Yes | Yes | - |
| Input | Yes | - | - | Yes | Yes | Yes |
| Event Item | Yes | Yes | Yes | - | - | - |
| Sidebar Item | Yes | Yes | Yes | Yes | - | - |
| Card | Yes | Optional | - | - | - | - |
| Badge | Yes | - | - | - | - | - |

---

## 10. Validation Checklist

```
[Design System 검증]
- [x] 브랜드 컬러 정의 완료
- [x] 이벤트 유형별 색상 정의
- [x] 타이포그래피 스케일 정의
- [x] 스페이싱 시스템 정의
- [x] 핵심 컴포넌트 정의 (Event Item, Timeline, Stats Card)
- [x] 레이아웃 구조 정의
- [x] 접근성 기준 충족 (WCAG AA)
- [x] 다크 모드 색상 정의
- [x] 아이콘 시스템 정의
- [x] 애니메이션/모션 가이드
```

---

## Document References

| 참조 문서 | 관련 섹션 |
|-----------|-----------|
| DOC-3 (User Flow) | UI 흐름 참조 |
| DOC-6 (TASKS) | M2 프론트엔드 컴포넌트 구축 |
| DOC-7 (Convention) | CSS/Tailwind 컨벤션 |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | Claude + User | Initial draft |

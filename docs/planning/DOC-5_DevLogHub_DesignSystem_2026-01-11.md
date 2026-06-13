---
session_id: devlog-hub-planning-2026-01-11
date: 2026-01-11
version: v1.0
project_name: DevLog Hub
document_type: Design System (디자인 시스템)
author: Claude + Developer
---

# DOC-5: DevLog Hub Design System (디자인 시스템)

## 1. 개요

### 1.1 문서 목적
DevLog Hub의 시각적 일관성을 위한 색상, 타이포그래피, 컴포넌트 가이드를 정의합니다.

### 1.2 기술 스택
- **CSS Framework**: Tailwind CSS 3.4
- **UI Components**: Radix UI (Headless)
- **Icons**: Lucide React
- **Styling Approach**: Utility-first with custom components

### 1.3 문서 참조
| Doc ID | 참조 내용 |
|--------|----------|
| DOC-1 | USER-x 페르소나별 UI 요구사항 |
| DOC-3 | 화면별 컴포넌트 배치 |

---

## 2. 색상 시스템

### 2.1 컬러 팔레트

#### Primary Colors

| 이름 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| Primary | `#3B82F6` | `blue-500` | 주요 액션, 링크 |
| Primary Dark | `#2563EB` | `blue-600` | 호버 상태 |
| Primary Light | `#60A5FA` | `blue-400` | 비활성 상태 |

#### Neutral Colors

| 이름 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| Background | `#FFFFFF` | `white` | 페이지 배경 |
| Surface | `#F9FAFB` | `gray-50` | 카드 배경 |
| Border | `#E5E7EB` | `gray-200` | 테두리 |
| Text Primary | `#111827` | `gray-900` | 본문 텍스트 |
| Text Secondary | `#6B7280` | `gray-500` | 보조 텍스트 |
| Text Muted | `#9CA3AF` | `gray-400` | 비활성 텍스트 |

#### Semantic Colors

| 이름 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| Success | `#10B981` | `emerald-500` | 성공, 활성 상태 |
| Warning | `#F59E0B` | `amber-500` | 경고 |
| Error | `#EF4444` | `red-500` | 오류, 삭제 |
| Info | `#3B82F6` | `blue-500` | 정보 |

#### Event Type Colors

| 이벤트 타입 | Hex | Tailwind | 아이콘 |
|------------|-----|----------|--------|
| Git | `#F97316` | `orange-500` | GitCommit |
| File | `#8B5CF6` | `violet-500` | FileText |
| Terminal | `#10B981` | `emerald-500` | Terminal |
| Manual | `#3B82F6` | `blue-500` | PenLine |

### 2.2 다크 모드 (향후)

| Light Mode | Dark Mode | 용도 |
|------------|-----------|------|
| `white` | `gray-900` | 배경 |
| `gray-50` | `gray-800` | Surface |
| `gray-900` | `gray-100` | 텍스트 |
| `gray-200` | `gray-700` | 테두리 |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
/* Tailwind Config */
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
}
```

### 3.2 폰트 스케일

| 이름 | 클래스 | 크기 | 행간 | 용도 |
|------|--------|------|------|------|
| Display | `text-4xl` | 36px | 40px | 페이지 타이틀 |
| Heading 1 | `text-2xl` | 24px | 32px | 섹션 타이틀 |
| Heading 2 | `text-xl` | 20px | 28px | 카드 타이틀 |
| Heading 3 | `text-lg` | 18px | 28px | 서브 타이틀 |
| Body | `text-base` | 16px | 24px | 본문 |
| Body Small | `text-sm` | 14px | 20px | 보조 텍스트 |
| Caption | `text-xs` | 12px | 16px | 레이블, 타임스탬프 |
| Code | `font-mono text-sm` | 14px | 20px | 코드, 경로 |

### 3.3 폰트 웨이트

| 이름 | 클래스 | 용도 |
|------|--------|------|
| Normal | `font-normal` (400) | 본문 |
| Medium | `font-medium` (500) | 강조 |
| Semibold | `font-semibold` (600) | 타이틀 |
| Bold | `font-bold` (700) | 중요 헤딩 |

---

## 4. 스페이싱 시스템

### 4.1 기본 단위

Tailwind 4px 베이스 시스템 사용:

| 단위 | 클래스 | 픽셀 | 용도 |
|------|--------|------|------|
| 1 | `p-1`, `m-1` | 4px | 아이콘 간격 |
| 2 | `p-2`, `m-2` | 8px | 인라인 요소 |
| 3 | `p-3`, `m-3` | 12px | 버튼 패딩 |
| 4 | `p-4`, `m-4` | 16px | 카드 패딩 |
| 6 | `p-6`, `m-6` | 24px | 섹션 간격 |
| 8 | `p-8`, `m-8` | 32px | 큰 섹션 |

### 4.2 레이아웃 간격

| 요소 | 간격 | 클래스 |
|------|------|--------|
| 카드 내부 패딩 | 16-24px | `p-4` ~ `p-6` |
| 카드 간 간격 | 16-24px | `gap-4` ~ `gap-6` |
| 섹션 간 마진 | 24-32px | `mb-6` ~ `mb-8` |
| 사이드바 너비 | 256px | `w-64` |
| 최대 콘텐츠 너비 | 1280px | `max-w-7xl` |

---

## 5. 그리드 시스템

### 5.1 대시보드 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ Header (h-16)                                        │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │  Main Content Area                        │
│ (w-64)   │  (flex-1)                                 │
│          │                                           │
│          │  ┌──────┬──────┬──────┬──────┐           │
│          │  │ Stat │ Stat │ Stat │ Stat │           │
│          │  └──────┴──────┴──────┴──────┘           │
│          │                                           │
│          │  ┌────────────────────────────┐           │
│          │  │ Main Card / Chart          │           │
│          │  └────────────────────────────┘           │
│          │                                           │
└──────────┴──────────────────────────────────────────┘
```

### 5.2 그리드 클래스

```css
/* 통계 카드 그리드 */
.stats-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
}

/* 2컬럼 레이아웃 */
.two-column {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

/* 리스트 아이템 */
.list-item {
  @apply flex items-center gap-3 p-3;
}
```

---

## 6. 컴포넌트 라이브러리

### 6.1 Radix UI 컴포넌트 목록

| 컴포넌트 | 패키지 | 용도 |
|----------|--------|------|
| Dialog | `@radix-ui/react-dialog` | 모달 |
| Select | `@radix-ui/react-select` | 드롭다운 |
| Tabs | `@radix-ui/react-tabs` | 탭 네비게이션 |
| Avatar | `@radix-ui/react-avatar` | 프로필 이미지 |
| Toast | `@radix-ui/react-toast` | 알림 |
| Dropdown Menu | `@radix-ui/react-dropdown-menu` | 컨텍스트 메뉴 |
| Popover | `@radix-ui/react-popover` | 팝오버 |
| Tooltip | `@radix-ui/react-tooltip` | 툴팁 |

### 6.2 버튼 (Button)

#### 변형 (Variants)

```tsx
// Primary Button
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Primary Action
</button>

// Secondary Button
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors">
  Secondary
</button>

// Outline Button
<button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
  Outline
</button>

// Ghost Button
<button className="hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
  Ghost
</button>

// Danger Button
<button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Delete
</button>
```

#### 크기 (Sizes)

| 크기 | 클래스 | 높이 | 용도 |
|------|--------|------|------|
| Small | `px-3 py-1.5 text-sm` | 32px | 테이블 액션 |
| Medium | `px-4 py-2 text-base` | 40px | 기본 |
| Large | `px-6 py-3 text-lg` | 48px | CTA |

### 6.3 카드 (Card)

```tsx
// 기본 카드
<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900">Card Title</h3>
  <p className="text-gray-500 mt-2">Card content goes here.</p>
</div>

// 통계 카드
<div className="bg-white rounded-xl border border-gray-200 p-4">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-blue-100 rounded-lg">
      <Icon className="h-5 w-5 text-blue-500" />
    </div>
    <div>
      <p className="text-sm text-gray-500">Label</p>
      <p className="text-2xl font-bold text-gray-900">1,234</p>
    </div>
  </div>
</div>
```

### 6.4 입력 필드 (Input)

```tsx
// 텍스트 입력
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
  placeholder="Enter text..."
/>

// 검색 입력
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <input
    type="text"
    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    placeholder="Search..."
  />
</div>

// 오류 상태
<input
  type="text"
  className="w-full px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
/>
<p className="text-sm text-red-500 mt-1">Error message</p>
```

### 6.5 배지 (Badge)

```tsx
// 상태 배지
<span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
  Active
</span>

<span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
  Inactive
</span>

<span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
  Revoked
</span>

// 이벤트 타입 배지
<span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
  Git
</span>

<span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-800">
  File
</span>
```

### 6.6 아바타 (Avatar)

```tsx
// Radix UI Avatar
<Avatar.Root className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
  <Avatar.Image src={user.avatar} alt={user.name} />
  <Avatar.Fallback className="flex items-center justify-center w-full h-full bg-blue-500 text-white font-medium">
    {user.name.slice(0, 2).toUpperCase()}
  </Avatar.Fallback>
</Avatar.Root>
```

### 6.7 테이블 (Table)

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-4 text-sm text-gray-900">Item Name</td>
        <td className="px-4 py-4"><Badge>Active</Badge></td>
        <td className="px-4 py-4 text-right">
          <button className="text-blue-500 hover:text-blue-700">Edit</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 7. 아이콘 시스템

### 7.1 Lucide React 아이콘

```tsx
import {
  // 네비게이션
  Home, LayoutDashboard, Clock, Search, Settings,
  // 액션
  Plus, Trash2, Edit, Copy, RefreshCw, Download,
  // 상태
  Check, X, AlertTriangle, Info,
  // 이벤트 타입
  GitCommit, FileText, Terminal, PenLine,
  // 기타
  User, Users, Folder, ChevronDown, ChevronRight,
} from 'lucide-react';
```

### 7.2 아이콘 크기

| 용도 | 클래스 | 크기 |
|------|--------|------|
| 인라인 텍스트 | `h-4 w-4` | 16px |
| 버튼 아이콘 | `h-5 w-5` | 20px |
| 카드 아이콘 | `h-6 w-6` | 24px |
| 큰 아이콘 | `h-8 w-8` | 32px |

### 7.3 아이콘 + 텍스트 정렬

```tsx
// 아이콘 왼쪽
<button className="flex items-center gap-2">
  <Plus className="h-4 w-4" />
  <span>Add New</span>
</button>

// 아이콘 오른쪽
<button className="flex items-center gap-2">
  <span>Next</span>
  <ChevronRight className="h-4 w-4" />
</button>
```

---

## 8. 애니메이션 & 트랜지션

### 8.1 트랜지션 클래스

| 용도 | 클래스 | 속성 |
|------|--------|------|
| 색상 변경 | `transition-colors` | 150ms |
| 크기 변경 | `transition-transform` | 150ms |
| 전체 | `transition-all` | 150ms |
| 느린 | `transition-all duration-300` | 300ms |

### 8.2 호버 & 포커스

```css
/* 버튼 호버 */
.btn:hover {
  @apply bg-blue-600 scale-[1.02];
}

/* 카드 호버 */
.card:hover {
  @apply shadow-md border-gray-300;
}

/* 입력 포커스 */
.input:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}
```

### 8.3 로딩 상태

```tsx
// 스피너
<div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />

// 펄스 (스켈레톤)
<div className="animate-pulse bg-gray-200 h-4 w-24 rounded" />
```

---

## 9. 반응형 브레이크포인트

### 9.1 Tailwind 기본값

| 브레이크포인트 | 최소 너비 | 용도 |
|--------------|----------|------|
| `sm` | 640px | 모바일 가로 |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 데스크톱 |
| `xl` | 1280px | 대형 모니터 |
| `2xl` | 1536px | 울트라와이드 |

### 9.2 레이아웃 적용

```tsx
// 사이드바: 모바일에서 숨김
<aside className="hidden lg:block w-64">

// 그리드: 반응형 컬럼
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// 패딩: 화면 크기별 조정
<main className="p-4 md:p-6 lg:p-8">
```

---

## 10. 접근성 (Accessibility)

### 10.1 색상 대비

| 조합 | 대비 비율 | WCAG |
|------|----------|------|
| gray-900 on white | 16:1 | AAA |
| gray-500 on white | 4.6:1 | AA |
| blue-500 on white | 4.5:1 | AA |
| white on blue-500 | 4.5:1 | AA |

### 10.2 포커스 표시

```css
/* 모든 인터랙티브 요소에 포커스 링 */
.focusable:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}
```

### 10.3 스크린 리더

```tsx
// 시각적으로 숨김, 스크린 리더에는 노출
<span className="sr-only">Loading...</span>

// aria 레이블
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

---

## 부록: 컴포넌트 체크리스트

| 컴포넌트 | 구현 | 문서화 | 접근성 |
|----------|------|--------|--------|
| Button | ✅ | ✅ | ✅ |
| Input | ✅ | ✅ | ✅ |
| Card | ✅ | ✅ | N/A |
| Badge | ✅ | ✅ | N/A |
| Table | ✅ | ✅ | ✅ |
| Dialog (Modal) | ✅ | ✅ | ✅ |
| Select | ✅ | ✅ | ✅ |
| Toast | ✅ | ✅ | ✅ |
| Avatar | ✅ | ✅ | ✅ |
| Tabs | ✅ | ✅ | ✅ |

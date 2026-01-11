# User Flow (사용자 흐름도)

## Document Metadata

```yaml
doc_id: DOC-3
type: User Flow
project_name: DevLog Hub
version: 1.0
last_updated: 2026-01-11
related_features: FEAT-1, FEAT-2, FEAT-3, FEAT-4, FEAT-5, FEAT-6
```

---

## 1. System Overview Flow

### 1.1 전체 시스템 흐름

```mermaid
graph TB
    subgraph "개발자 PC (Local)"
        DEV[개발자 활동]
        AGENT[로컬 에이전트]
        LOCAL_DB[(로컬 SQLite)]
    end

    subgraph "중앙 서버 (Cloud)"
        API[API Server]
        DB[(PostgreSQL)]
        WEB[Web Dashboard]
    end

    subgraph "사용자 접근"
        BROWSER[웹 브라우저]
    end

    DEV -->|자동 감지| AGENT
    AGENT -->|로컬 저장| LOCAL_DB
    AGENT -->|동기화| API
    API -->|저장| DB
    BROWSER -->|접속| WEB
    WEB -->|조회| API
    API -->|검색| DB
```

---

## 2. User Journey Flows

### 2.1 Phase 1: Onboarding (첫 경험)

```mermaid
graph TD
    classDef start fill:#10b981,stroke:#047857,color:white
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white
    classDef end_success fill:#10b981,stroke:#047857,color:white

    START((신규 사용자)):::start

    A[웹사이트 방문]:::action
    B{계정 있음?}:::decision
    C[회원가입]:::action
    D[이메일 인증]:::action
    E{인증 완료?}:::decision
    F[로그인]:::action
    G[대시보드 진입]:::action
    H[에이전트 다운로드 안내]:::action
    I[에이전트 설치]:::action
    J[API 토큰 입력]:::action
    K{연결 성공?}:::decision
    L[초기 설정 완료]:::action
    M((Core Task)):::end_success

    START --> A
    A --> B
    B -->|No| C
    B -->|Yes| F
    C --> D
    D --> E
    E -->|Yes| F
    E -->|No| D
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K -->|Yes| L
    K -->|No| J
    L --> M
```

### 2.2 Phase 2: Core Task (핵심 작업)

#### FEAT-1: 자동 로그 수집 흐름

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white
    classDef data fill:#8b5cf6,stroke:#7c3aed,color:white

    subgraph "FEAT-1: 로컬 에이전트 자동 수집"
        A[개발자 코딩 시작]:::action
        B[에이전트 이벤트 감지]:::action
        C{이벤트 유형?}:::decision

        D1[Git 커밋/푸시]:::data
        D2[파일 저장]:::data
        D3[터미널 명령]:::data
        D4[수동 메모]:::data

        E[이벤트 파싱]:::action
        F[로컬 DB 저장]:::action
        G{온라인?}:::decision
        H[서버 동기화]:::action
        I[오프라인 큐 저장]:::action
        J[동기화 대기]:::action

        A --> B
        B --> C
        C -->|Git| D1
        C -->|File| D2
        C -->|Terminal| D3
        C -->|Manual| D4
        D1 --> E
        D2 --> E
        D3 --> E
        D4 --> E
        E --> F
        F --> G
        G -->|Yes| H
        G -->|No| I
        I --> J
        J -.->|재연결| H
        H --> B
    end
```

#### FEAT-2: 검색 시스템 흐름

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white
    classDef end_success fill:#10b981,stroke:#047857,color:white

    subgraph "FEAT-2: 중앙 검색 시스템"
        A[검색창 접근]:::action
        B[키워드 입력]:::action
        C{필터 추가?}:::decision
        D[날짜 범위 설정]:::action
        E[프로젝트 선택]:::action
        F[작성자 선택]:::action
        G[검색 실행]:::action
        H[결과 로딩]:::action
        I{결과 있음?}:::decision
        J[결과 목록 표시]:::action
        K[빈 상태 표시]:::action
        L[로그 상세 보기]:::action
        M[관련 로그 추천]:::action
        N((검색 완료)):::end_success

        A --> B
        B --> C
        C -->|Yes| D
        C -->|No| G
        D --> E
        E --> F
        F --> G
        G --> H
        H --> I
        I -->|Yes| J
        I -->|No| K
        J --> L
        L --> M
        M -.-> B
        K --> B
        L --> N
    end
```

#### FEAT-3: 대시보드 흐름

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white

    subgraph "FEAT-3: 웹 대시보드"
        A[대시보드 접속]:::action
        B[실시간 데이터 로드]:::action
        C{뷰 선택?}:::decision

        D1[타임라인 뷰]:::action
        D2[프로젝트 뷰]:::action
        D3[통계 뷰]:::action
        D4[팀원 뷰]:::action

        E1[시간순 로그 스트림]:::action
        E2[프로젝트별 그룹핑]:::action
        E3[차트/그래프 표시]:::action
        E4[팀원별 활동 현황]:::action

        F[상세 드릴다운]:::action
        G[필터/정렬 적용]:::action

        A --> B
        B --> C
        C -->|Timeline| D1
        C -->|Project| D2
        C -->|Stats| D3
        C -->|Team| D4
        D1 --> E1
        D2 --> E2
        D3 --> E3
        D4 --> E4
        E1 --> F
        E2 --> F
        E3 --> F
        E4 --> F
        F --> G
        G -.-> C
    end
```

#### FEAT-4: 프로젝트 그룹핑 흐름

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white

    subgraph "FEAT-4: 프로젝트별 그룹핑"
        A[프로젝트 목록]:::action
        B{액션?}:::decision

        C[새 프로젝트 생성]:::action
        D[프로젝트명 입력]:::action
        E[Git 저장소 연결]:::action
        F[프로젝트 저장]:::action

        G[프로젝트 선택]:::action
        H[해당 프로젝트 로그 필터]:::action
        I[프로젝트 통계 표시]:::action

        J[프로젝트 설정]:::action
        K[팀원 추가/제거]:::action
        L[알림 설정]:::action

        A --> B
        B -->|Create| C
        B -->|View| G
        B -->|Settings| J
        C --> D
        D --> E
        E --> F
        F --> A
        G --> H
        H --> I
        J --> K
        K --> L
        L --> A
    end
```

#### FEAT-5: 리포트 생성 흐름

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white
    classDef end_success fill:#10b981,stroke:#047857,color:white

    subgraph "FEAT-5: 리포트 자동 생성"
        A[리포트 메뉴]:::action
        B{리포트 유형?}:::decision

        C1[일간 리포트]:::action
        C2[주간 리포트]:::action
        C3[커스텀 리포트]:::action

        D[기간 선택]:::action
        E[프로젝트 선택]:::action
        F[포함 항목 선택]:::action
        G[리포트 생성]:::action
        H[미리보기]:::action
        I{수정 필요?}:::decision
        J[리포트 편집]:::action
        K{내보내기?}:::decision
        L[PDF 다운로드]:::action
        M[이메일 발송]:::action
        N[링크 공유]:::action
        O((완료)):::end_success

        A --> B
        B -->|Daily| C1
        B -->|Weekly| C2
        B -->|Custom| C3
        C1 --> D
        C2 --> D
        C3 --> D
        D --> E
        E --> F
        F --> G
        G --> H
        H --> I
        I -->|Yes| J
        J --> H
        I -->|No| K
        K -->|PDF| L
        K -->|Email| M
        K -->|Link| N
        L --> O
        M --> O
        N --> O
    end
```

#### FEAT-6: 수동 메모 흐름

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white

    subgraph "FEAT-6: 수동 메모 추가"
        A{입력 경로?}:::decision

        B1[CLI 명령어]:::action
        B2[시스템 트레이]:::action
        B3[웹 대시보드]:::action
        B4[단축키]:::action

        C[메모 입력창]:::action
        D[내용 작성]:::action
        E{태그 추가?}:::decision
        F[태그 입력]:::action
        G{프로젝트 연결?}:::decision
        H[프로젝트 선택]:::action
        I[메모 저장]:::action
        J[타임라인에 표시]:::action

        A -->|CLI| B1
        A -->|Tray| B2
        A -->|Web| B3
        A -->|Hotkey| B4
        B1 --> C
        B2 --> C
        B3 --> C
        B4 --> C
        C --> D
        D --> E
        E -->|Yes| F
        E -->|No| G
        F --> G
        G -->|Yes| H
        G -->|No| I
        H --> I
        I --> J
    end
```

### 2.3 Phase 3: Retention (리텐션)

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white
    classDef loop fill:#ec4899,stroke:#db2777,color:white

    subgraph "Phase 3: Retention Loop"
        A[작업 완료]:::action
        B{더 볼 내용?}:::decision
        C[관련 로그 추천]:::action
        D[프로젝트 통계 업데이트]:::action

        E[주간 리포트 알림]:::action
        F[팀 활동 요약]:::action
        G[마일스톤 알림]:::action

        H[이메일 다이제스트]:::loop
        I[대시보드 재방문]:::loop
        J((Exit))

        A --> B
        B -->|Yes| C
        B -->|No| D
        C --> D
        D --> E
        E --> F
        F --> G
        G -.->|주간| H
        H -.->|클릭| I
        I -.->|재진입| A
        G --> J
    end
```

---

## 3. Error Handling Flows

### 3.1 동기화 실패 처리

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white
    classDef error fill:#ef4444,stroke:#dc2626,color:white
    classDef success fill:#10b981,stroke:#047857,color:white

    A[동기화 시도]:::action
    B{성공?}:::decision
    C[완료]:::success
    D[에러 로깅]:::error
    E{재시도 횟수?}:::decision
    F[지수 백오프 대기]:::action
    G[재시도]:::action
    H[오프라인 모드 전환]:::action
    I[사용자 알림]:::error
    J[수동 재시도 버튼]:::action

    A --> B
    B -->|Yes| C
    B -->|No| D
    D --> E
    E -->|< 3회| F
    F --> G
    G --> A
    E -->|>= 3회| H
    H --> I
    I --> J
    J --> A
```

### 3.2 인증 만료 처리

```mermaid
graph TD
    classDef action fill:#3b82f6,stroke:#1d4ed8,color:white
    classDef decision fill:#f59e0b,stroke:#d97706,color:white
    classDef error fill:#ef4444,stroke:#dc2626,color:white

    A[API 요청]:::action
    B{토큰 유효?}:::decision
    C[요청 처리]:::action
    D[토큰 갱신 시도]:::action
    E{갱신 성공?}:::decision
    F[새 토큰 저장]:::action
    G[로그인 화면 이동]:::error
    H[세션 만료 안내]:::error

    A --> B
    B -->|Yes| C
    B -->|No| D
    D --> E
    E -->|Yes| F
    F --> A
    E -->|No| G
    G --> H
```

---

## 4. Role-Based Flows

### 4.1 개발자 (USER-1) 주요 경로

```mermaid
graph LR
    classDef primary fill:#3b82f6,stroke:#1d4ed8,color:white

    A[코딩]:::primary --> B[자동 수집]:::primary
    B --> C[동기화]:::primary
    C --> D[검색]:::primary
    D --> E[메모 추가]:::primary
    E --> A
```

### 4.2 팀 리드 (USER-2) 주요 경로

```mermaid
graph LR
    classDef primary fill:#8b5cf6,stroke:#7c3aed,color:white

    A[대시보드]:::primary --> B[팀 통계]:::primary
    B --> C[리포트 생성]:::primary
    C --> D[공유]:::primary
    D --> A
```

### 4.3 신규 합류자 (USER-3) 주요 경로

```mermaid
graph LR
    classDef primary fill:#10b981,stroke:#047857,color:white

    A[온보딩]:::primary --> B[히스토리 검색]:::primary
    B --> C[프로젝트 탐색]:::primary
    C --> D[선배 코드 학습]:::primary
    D --> B
```

---

## 5. Validation Checklist

```
[User Flow 검증]
- [x] FEAT-1 (자동 수집) 흐름도 완성
- [x] FEAT-2 (검색) 흐름도 완성
- [x] FEAT-3 (대시보드) 흐름도 완성
- [x] FEAT-4 (그룹핑) 흐름도 완성
- [x] FEAT-5 (리포트) 흐름도 완성
- [x] FEAT-6 (메모) 흐름도 완성
- [x] 모든 결정 노드에 Yes/No 분기 존재
- [x] Onboarding -> Core -> Retention 구조 준수
- [x] 실패 경로에서 복구/재시도 가능
- [x] Retention Loop 표현됨
- [x] Mermaid 문법 검증
```

---

## Document References

| 참조 문서 | 관련 섹션 |
|-----------|-----------|
| DOC-1 (PRD) | FEAT-1 ~ FEAT-6 User Stories |
| DOC-4 (Database) | 이벤트 테이블 스키마 |
| DOC-6 (TASKS) | M2, M3, M4 마일스톤 |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | Claude + User | Initial draft |

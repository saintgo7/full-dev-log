---
session_id: devlog-hub-planning-2026-01-11
date: 2026-01-11
version: v1.0
project_name: DevLog Hub
document_type: User Flow (사용자 흐름도)
author: Claude + Developer
---

# DOC-3: DevLog Hub User Flow (사용자 흐름도)

## 1. 개요

### 1.1 문서 목적
Mermaid 다이어그램을 활용하여 주요 사용자 여정을 시각화합니다.

### 1.2 문서 참조
| Doc ID | 참조 내용 |
|--------|----------|
| DOC-1 | USER-1,2,3 페르소나, FEAT-x 기능 정의 |
| DOC-4 | 데이터 흐름의 DB 연결점 |

---

## 2. 시스템 전체 아키텍처 흐름

```mermaid
flowchart TB
    subgraph Local["🖥️ 개발 머신"]
        IDE[IDE/Editor]
        Git[Git Repository]
        Terminal[Terminal]
        Agent[DevLog Agent]
        SQLite[(SQLite)]
    end

    subgraph Server["☁️ 중앙 서버"]
        API[Express API]
        WS[WebSocket Hub]
        PG[(PostgreSQL)]
    end

    subgraph Web["🌐 웹 브라우저"]
        Dashboard[Dashboard]
        Timeline[Timeline]
        Search[Search]
    end

    IDE --> |파일 변경| Agent
    Git --> |커밋 감지| Agent
    Terminal --> |명령어| Agent
    Agent --> SQLite
    Agent --> |HTTP POST /events/batch| API
    API --> PG
    API --> WS
    WS --> |실시간 이벤트| Dashboard
    Dashboard --> |REST API| API
    Timeline --> |REST API| API
    Search --> |REST API| API
```

---

## 3. 사용자 여정별 흐름

### 3.1 신규 사용자 온보딩 (USER-1, USER-2, USER-3)

```mermaid
flowchart TD
    Start([시작]) --> Landing[랜딩 페이지 방문]
    Landing --> Register[회원가입 페이지]
    Register --> |이메일/비밀번호 입력| Validate{유효성 검사}
    Validate --> |실패| Register
    Validate --> |성공| CreateUser[계정 생성]
    CreateUser --> Login[로그인]
    Login --> Dashboard[대시보드]
    Dashboard --> CreateAgent[에이전트 생성]
    CreateAgent --> |이름, OS 선택| GetToken[API 토큰 발급]
    GetToken --> CopyToken[토큰 복사]
    CopyToken --> InstallAgent[에이전트 설치 가이드]
    InstallAgent --> ConfigAgent[config.yaml 설정]
    ConfigAgent --> RunAgent[에이전트 실행]
    RunAgent --> FirstSync[첫 동기화 완료]
    FirstSync --> End([온보딩 완료])

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
    style Dashboard fill:#fff3e0
```

**FEAT 연결**: FEAT-5 (에이전트 관리)

---

### 3.2 일상적 사용 흐름 (USER-1)

```mermaid
flowchart TD
    Start([개발 시작]) --> Code[코드 작성]
    Code --> |파일 저장| FileEvent[파일 이벤트 발생]
    FileEvent --> Agent[Agent 감지]
    Agent --> |fsnotify| Debounce[500ms 디바운싱]
    Debounce --> LocalStore[SQLite 저장]

    Code --> |git commit| GitEvent[Git 커밋 발생]
    GitEvent --> GitPoll[Agent 폴링 감지]
    GitPoll --> LocalStore

    LocalStore --> |5분 간격| SyncCheck{네트워크 연결?}
    SyncCheck --> |Yes| BatchSync[배치 동기화]
    SyncCheck --> |No| Queue[큐에 대기]
    Queue --> |네트워크 복구| BatchSync

    BatchSync --> |POST /events/batch| Server[서버 수신]
    Server --> Broadcast[WebSocket 브로드캐스트]
    Broadcast --> Dashboard[대시보드 업데이트]

    Dashboard --> End([실시간 확인])

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
    style Debounce fill:#fff9c4
    style BatchSync fill:#e8f5e9
```

**FEAT 연결**: FEAT-1 (Git), FEAT-2 (파일), FEAT-3 (동기화), FEAT-4 (대시보드)

---

### 3.3 팀 협업 흐름 (USER-2, USER-3)

```mermaid
flowchart TD
    Start([팀 리더 로그인]) --> Projects[프로젝트 목록]
    Projects --> CreateProject[새 프로젝트 생성]
    CreateProject --> |이름, 설명, repo URL| ProjectCreated[프로젝트 생성됨]

    ProjectCreated --> InviteMember[멤버 초대]
    InviteMember --> |이메일로 검색| SelectRole{역할 선택}
    SelectRole --> |Owner| AddOwner[관리자 권한 부여]
    SelectRole --> |Member| AddMember[편집 권한 부여]
    SelectRole --> |Viewer| AddViewer[읽기 권한 부여]

    AddOwner --> MemberAdded[멤버 추가됨]
    AddMember --> MemberAdded
    AddViewer --> MemberAdded

    MemberAdded --> MemberView([팀원 대시보드])

    subgraph TeamView["팀원 시점 (USER-3)"]
        MemberView --> SelectProject[프로젝트 선택]
        SelectProject --> FilteredTimeline[프로젝트 타임라인]
        FilteredTimeline --> |실시간| TeamEvents[팀 이벤트 피드]
    end

    style Start fill:#e1f5fe
    style MemberView fill:#fff3e0
    style TeamEvents fill:#c8e6c9
```

**FEAT 연결**: FEAT-6 (프로젝트 협업)

---

### 3.4 검색 및 필터링 흐름 (USER-1, USER-2, USER-3)

```mermaid
flowchart TD
    Start([검색 페이지]) --> SearchInput[검색어 입력]
    SearchInput --> |"키워드"| Query[검색 쿼리 생성]

    Query --> Filters{필터 적용?}
    Filters --> |Yes| ApplyFilters[필터 설정]
    Filters --> |No| Execute

    ApplyFilters --> TypeFilter[이벤트 타입]
    ApplyFilters --> DateFilter[날짜 범위]
    ApplyFilters --> ProjectFilter[프로젝트]

    TypeFilter --> Execute[검색 실행]
    DateFilter --> Execute
    ProjectFilter --> Execute

    Execute --> |GET /events/search| Results[검색 결과]
    Results --> |결과 있음| Display[결과 목록 표시]
    Results --> |결과 없음| NoResults[결과 없음 메시지]

    Display --> Pagination[페이지네이션]
    Pagination --> |다음 페이지| Execute

    Display --> EventDetail[이벤트 상세 보기]
    EventDetail --> End([완료])

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
    style ApplyFilters fill:#fff9c4
```

**FEAT 연결**: FEAT-7 (전체 검색)

---

### 3.5 에이전트 관리 흐름 (USER-1, USER-2)

```mermaid
flowchart TD
    Start([에이전트 페이지]) --> AgentList[에이전트 목록]

    AgentList --> Actions{작업 선택}

    Actions --> |생성| Create[새 에이전트 생성]
    Create --> |이름, OS| NewAgent[에이전트 생성됨]
    NewAgent --> ShowToken[API 토큰 표시]
    ShowToken --> AgentList

    Actions --> |토큰 재생성| Regenerate[토큰 재생성]
    Regenerate --> Confirm{확인?}
    Confirm --> |Yes| NewToken[새 토큰 발급]
    Confirm --> |No| AgentList
    NewToken --> ShowToken

    Actions --> |상태 변경| StatusChange[상태 변경]
    StatusChange --> SelectStatus{상태 선택}
    SelectStatus --> |Active| SetActive[활성화]
    SelectStatus --> |Inactive| SetInactive[비활성화]
    SelectStatus --> |Revoked| SetRevoked[폐기]
    SetActive --> AgentList
    SetInactive --> AgentList
    SetRevoked --> AgentList

    Actions --> |삭제| Delete[에이전트 삭제]
    Delete --> ConfirmDelete{확인?}
    ConfirmDelete --> |Yes| Deleted[삭제됨]
    ConfirmDelete --> |No| AgentList
    Deleted --> AgentList

    AgentList --> Monitor[실시간 상태 모니터링]
    Monitor --> |WebSocket| StatusUpdate[상태 업데이트]
    StatusUpdate --> AgentList

    style Start fill:#e1f5fe
    style ShowToken fill:#e8f5e9
    style SetRevoked fill:#ffcdd2
```

**FEAT 연결**: FEAT-5 (에이전트 관리)

---

## 4. 인증 흐름

### 4.1 사용자 인증 (JWT)

```mermaid
sequenceDiagram
    participant U as 사용자
    participant W as Web (Next.js)
    participant A as API Server
    participant DB as PostgreSQL

    U->>W: 로그인 페이지 접근
    W->>U: 로그인 폼 표시
    U->>W: 이메일/비밀번호 입력
    W->>A: POST /auth/login
    A->>DB: 사용자 조회
    DB-->>A: 사용자 정보
    A->>A: 비밀번호 검증
    A->>DB: 세션 생성
    A-->>W: accessToken, refreshToken
    W->>W: Zustand 저장 (localStorage)
    W-->>U: 대시보드 리다이렉트

    Note over W,A: 이후 모든 요청에 Bearer Token 포함

    W->>A: GET /events (+ Bearer Token)
    A->>A: JWT 검증
    A->>DB: 이벤트 조회
    A-->>W: 이벤트 목록
```

### 4.2 에이전트 인증 (API Token)

```mermaid
sequenceDiagram
    participant Ag as Agent (Go)
    participant A as API Server
    participant DB as PostgreSQL

    Ag->>Ag: config.yaml에서 api_token 로드
    Ag->>A: POST /events/batch (+ Bearer api_token)
    A->>DB: 에이전트 토큰 조회
    DB-->>A: 에이전트 정보
    A->>A: 토큰 유효성 검증
    A->>A: 에이전트 상태 확인 (active?)
    A->>DB: 이벤트 저장
    A->>DB: lastSyncAt 업데이트
    A-->>Ag: { processed: n, failed: m }
```

---

## 5. 실시간 통신 흐름

### 5.1 WebSocket 연결 및 이벤트 브로드캐스트

```mermaid
sequenceDiagram
    participant W as Web Client
    participant WS as WebSocket Server
    participant A as API Server
    participant Ag as Agent

    W->>WS: 연결 요청 (+ JWT in handshake)
    WS->>WS: JWT 검증
    WS->>WS: user:${userId} 룸 조인
    WS-->>W: 연결 성공

    Note over W,WS: 프로젝트 룸 자동 조인
    WS->>WS: project:${projectId} 룸 조인 (각 프로젝트)

    Ag->>A: POST /events/batch
    A->>A: 이벤트 저장
    A->>WS: 브로드캐스트 요청
    WS->>W: event:new (user 룸)
    WS->>W: event:new (project 룸)

    Note over Ag,WS: 에이전트 상태 변경
    Ag->>A: 마지막 동기화 업데이트
    A->>WS: agent:status:update
    WS->>W: 에이전트 상태 갱신
```

---

## 6. 에러 및 엣지 케이스 흐름

### 6.1 오프라인 동기화 복구

```mermaid
flowchart TD
    Start([이벤트 발생]) --> Store[SQLite 저장]
    Store --> SyncAttempt[동기화 시도]
    SyncAttempt --> NetworkCheck{네트워크?}

    NetworkCheck --> |연결됨| Send[서버 전송]
    NetworkCheck --> |끊김| MarkPending[pending 상태 유지]

    Send --> Response{응답?}
    Response --> |성공| MarkSynced[synced로 변경]
    Response --> |실패| Retry{재시도 횟수?}

    Retry --> |< 3회| IncrementRetry[retry_count++]
    IncrementRetry --> Wait[5분 대기]
    Wait --> SyncAttempt

    Retry --> |>= 3회| MarkFailed[failed로 변경]
    MarkFailed --> ManualRetry[수동 재시도 필요]

    MarkPending --> NetworkRestore[네트워크 복구 감지]
    NetworkRestore --> SyncAttempt

    MarkSynced --> End([완료])

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
    style MarkFailed fill:#ffcdd2
    style MarkPending fill:#fff9c4
```

### 6.2 토큰 만료 처리

```mermaid
flowchart TD
    Start([API 요청]) --> Request[요청 전송]
    Request --> Response{응답 코드?}

    Response --> |200| Success[성공 처리]
    Response --> |401| CheckRefresh{refreshToken 있음?}

    CheckRefresh --> |Yes| RefreshAttempt[토큰 갱신 시도]
    CheckRefresh --> |No| Logout[로그아웃]

    RefreshAttempt --> RefreshResult{갱신 성공?}
    RefreshResult --> |Yes| UpdateToken[새 토큰 저장]
    UpdateToken --> Retry[원래 요청 재시도]
    Retry --> Success

    RefreshResult --> |No| Logout
    Logout --> LoginPage[로그인 페이지로 이동]

    Success --> End([완료])
    LoginPage --> End

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
    style Logout fill:#ffcdd2
```

---

## 7. 화면별 상태 다이어그램

### 7.1 대시보드 상태

```mermaid
stateDiagram-v2
    [*] --> Loading: 페이지 진입
    Loading --> Connected: WebSocket 연결
    Loading --> Error: 연결 실패

    Connected --> Streaming: 이벤트 수신 시작
    Streaming --> Streaming: 새 이벤트 추가
    Streaming --> Paused: 사용자 스크롤
    Paused --> Streaming: 최신으로 이동

    Error --> Retry: 재연결 시도
    Retry --> Connected: 연결 성공
    Retry --> Error: 재연결 실패

    Connected --> Disconnected: 연결 끊김
    Disconnected --> Retry
```

### 7.2 에이전트 상태

```mermaid
stateDiagram-v2
    [*] --> Created: 에이전트 생성
    Created --> Active: 토큰 발급

    Active --> Syncing: 동기화 중
    Syncing --> Active: 동기화 완료

    Active --> Inactive: 관리자 비활성화
    Inactive --> Active: 재활성화

    Active --> Revoked: 토큰 폐기
    Inactive --> Revoked: 토큰 폐기
    Revoked --> [*]: 삭제

    Active --> Offline: 24시간+ 미연결
    Offline --> Active: 재연결
```

---

## 부록: 화면-기능 매핑

| 화면 | URL | 연결 FEAT | 주요 액션 |
|------|-----|-----------|----------|
| 로그인 | /login | - | 이메일/비밀번호 인증 |
| 회원가입 | /register | - | 계정 생성 |
| 대시보드 | /dashboard | FEAT-4 | 통계, 실시간 피드 |
| 타임라인 | /timeline | FEAT-4 | 전체 이벤트 목록 |
| 에이전트 | /agents | FEAT-5 | 에이전트 CRUD |
| 프로젝트 | /projects | FEAT-6 | 프로젝트/멤버 관리 |
| 검색 | /search | FEAT-7 | 전문 검색, 필터 |
| 노트 | /notes | - | 수동 노트 CRUD |
| 설정 | /settings | - | 프로필, 계정 |

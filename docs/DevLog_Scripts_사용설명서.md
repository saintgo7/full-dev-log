# DevLog Hub Scripts 사용 설명서

## 목차
1. [개요](#개요)
2. [설치 가이드](#설치-가이드)
3. [명령어 사용법](#명령어-사용법)
4. [고급 사용법](#고급-사용법)
5. [문제 해결](#문제-해결)
6. [부록](#부록)

---

## 개요

### DevLog Hub Scripts란?
DevLog Hub Scripts는 개발 프로젝트의 상태를 빠르게 파악하고 AI 개발 도구(Claude, Gemini)와 효율적으로 연동할 수 있도록 도와주는 스크립트 모음입니다.

### 주요 기능
- **프로젝트 상태 요약**: Git 상태, 프로젝트 구조, 개발 로그를 한눈에 확인
- **AI 도구 통합**: Claude/Gemini 실행 시 자동으로 프로젝트 컨텍스트 제공
- **글로벌 명령어**: 어떤 디렉토리에서든 사용 가능한 전역 명령어
- **프로젝트별 관리**: 여러 프로젝트를 효율적으로 전환하며 작업

### 시스템 요구사항
- **운영체제**: macOS, Linux (bash/zsh shell)
- **필수 도구**: Git, Claude CLI 또는 Gemini CLI
- **권장 사항**: Node.js 20+, Go 1.21+ (프로젝트에 따라)

---

## 설치 가이드

### 1단계: 스크립트 다운로드
```bash
# DevLog Hub 프로젝트가 있는 경우
cd /path/to/devlog-hub
./scripts/install-aliases.sh
```

### 2단계: 글로벌 설치
스크립트는 자동으로 다음 위치에 설치됩니다:
- **설치 경로**: `~/03_TOOLS/dev-log-scripts/`
- **설정 파일**: `~/.zshrc` 또는 `~/.bashrc`

### 3단계: 설정 활성화
```bash
# 새 터미널을 열거나
source ~/.zshrc  # 또는 ~/.bashrc
```

### 설치 확인
```bash
# 설치된 명령어 확인
alias | grep devlog
```

---

## 명령어 사용법

### 기본 명령어

#### 1. devlog-resume
현재 프로젝트의 상태를 요약하여 표시합니다.

```bash
# 현재 디렉토리에서 실행
devlog-resume

# 특정 프로젝트 경로 지정
devlog-resume-at /path/to/project
```

**표시 정보:**
- Git 브랜치 및 커밋 상태
- 프로젝트 구조 (주요 디렉토리)
- 개발 로그 파일 목록
- 최근 커밋 히스토리

#### 2. devlog-claude
프로젝트 상태를 표시한 후 Claude를 실행합니다.

```bash
# 현재 디렉토리에서 Claude 시작
devlog-claude

# 특정 프로젝트에서 Claude 시작
devlog-claude-at /path/to/project
```

**특징:**
- 자동으로 `--dangerously-skip-permissions` 옵션 적용
- 프로젝트 컨텍스트를 Claude에 제공
- 개발 재개 시 유용한 정보 표시

#### 3. devlog-gemini
프로젝트 상태를 표시한 후 Gemini를 실행합니다.

```bash
# 현재 디렉토리에서 Gemini 시작
devlog-gemini

# 특정 프로젝트에서 Gemini 시작
devlog-gemini-at /path/to/project
```

### 프로젝트별 명령어 (DevLog Hub 전용)

#### devlog
DevLog Hub 프로젝트 디렉토리로 빠르게 이동합니다.

```bash
devlog
```

#### devlog-dev
DevLog Hub 개발 서버를 시작합니다.

```bash
devlog-dev
```

---

## 고급 사용법

### 여러 프로젝트 관리

#### 프로젝트 A에서 작업
```bash
cd ~/projects/project-a
devlog-resume  # 프로젝트 A 상태 확인
devlog-claude  # Claude로 개발 시작
```

#### 프로젝트 B로 전환
```bash
cd ~/projects/project-b
devlog-resume  # 프로젝트 B 상태 확인
devlog-gemini  # Gemini로 개발 시작
```

### 원격 작업
다른 위치에서 특정 프로젝트 작업:

```bash
# 홈 디렉토리에서 작업 중이지만 다른 프로젝트 확인
devlog-resume-at ~/projects/my-app

# 바로 해당 프로젝트에서 Claude 시작
devlog-claude-at ~/projects/my-app
```

### 커스텀 알리아스 추가
자주 사용하는 프로젝트용 단축키 생성:

```bash
# ~/.zshrc에 추가
alias myapp-claude='devlog-claude-at ~/projects/my-app'
alias myapp-status='devlog-resume-at ~/projects/my-app'
```

---

## 문제 해결

### 문제: 명령어를 찾을 수 없음
**증상**: `command not found: devlog-claude`

**해결책**:
1. 설치 스크립트 재실행
```bash
./scripts/install-aliases.sh
```

2. Shell 설정 새로고침
```bash
source ~/.zshrc
```

3. 수동 확인
```bash
ls -la ~/03_TOOLS/dev-log-scripts/
```

### 문제: Claude/Gemini가 실행되지 않음
**증상**: `claude 명령을 찾을 수 없습니다`

**해결책**:
1. Claude/Gemini CLI 설치 확인
```bash
which claude
which gemini
```

2. PATH 설정 확인
```bash
echo $PATH
```

### 문제: Git 정보가 표시되지 않음
**증상**: Git 상태 섹션이 비어있음

**해결책**:
1. Git 저장소 초기화
```bash
git init
```

2. Git 설치 확인
```bash
git --version
```

### 문제: 권한 오류
**증상**: `Permission denied`

**해결책**:
```bash
chmod +x ~/03_TOOLS/dev-log-scripts/*.sh
```

---

## 부록

### A. 스크립트 구조

#### 파일 목록
```
~/03_TOOLS/dev-log-scripts/
├── global-claude-start.sh    # Claude 글로벌 실행
├── global-dev-resume.sh      # 프로젝트 상태 요약
├── claude-start.sh           # 원본 Claude 스크립트
├── dev-resume.sh             # 원본 상태 스크립트
├── dev.sh                    # 개발 서버 스크립트
├── setup.sh                  # 초기 설정 스크립트
└── install-aliases.sh        # 알리아스 설치 스크립트
```

### B. 환경 변수

스크립트에서 사용하는 주요 환경 변수:

| 변수명 | 설명 | 기본값 |
|-------|------|--------|
| PROJECT_PATH | 프로젝트 경로 | 현재 디렉토리 |
| AI_TOOL | AI 도구 선택 | claude |
| SHELL_RC | Shell 설정 파일 | ~/.zshrc 또는 ~/.bashrc |

### C. 커스터마이징

#### 색상 변경
`global-dev-resume.sh` 파일에서 색상 정의 수정:
```bash
BLUE='\033[1;34m'    # 파란색
CYAN='\033[0;36m'    # 청록색
GREEN='\033[0;32m'   # 초록색
YELLOW='\033[1;33m'  # 노란색
```

#### 표시 정보 커스터마이징
필요에 따라 스크립트를 수정하여 추가 정보 표시:
- Docker 상태
- 데이터베이스 연결 정보
- 환경 변수 확인
- 의존성 버전 체크

### D. 업데이트 및 제거

#### 업데이트
```bash
# 최신 버전으로 업데이트
cd /path/to/devlog-hub
git pull
./scripts/install-aliases.sh
```

#### 제거
```bash
# 스크립트 파일 제거
rm -rf ~/03_TOOLS/dev-log-scripts

# ~/.zshrc에서 관련 알리아스 제거
# "DevLog Hub" 섹션 수동 삭제
```

---

## 지원 및 문의

### 문제 보고
- GitHub Issues: https://github.com/saintgo7/full-dev-log/issues

### 추가 문서
- DevLog Hub 프로젝트: `/docs/dev-log/`
- CLAUDE.md: 프로젝트별 AI 컨텍스트 설정

### 버전 정보
- 현재 버전: 1.0.0
- 작성일: 2026년 1월 11일
- 작성자: DevLog Hub Team

---

*이 문서는 DevLog Hub Scripts의 공식 사용 설명서입니다.*
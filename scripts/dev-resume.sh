#!/bin/bash

# DevLog Hub - 개발 재시작 스크립트
# 기존 개발 내용 확인 및 로그 표시

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_LOG_DIR="${PROJECT_ROOT}/docs/dev-log"

echo ""
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║              DevLog Hub - 개발 세션 시작                    ║${NC}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Git 상태 확인
echo -e "${CYAN}📊 Git 상태 확인${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "${PROJECT_ROOT}"

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log -1 --format="%h - %s (%cr)" 2>/dev/null || echo "없음")
TOTAL_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

echo -e "  ${BOLD}브랜치:${NC} ${GREEN}${CURRENT_BRANCH}${NC}"
echo -e "  ${BOLD}마지막 커밋:${NC} ${LAST_COMMIT}"
echo -e "  ${BOLD}총 커밋 수:${NC} ${TOTAL_COMMITS}개"
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo -e "  ${BOLD}미커밋 변경:${NC} ${YELLOW}${UNCOMMITTED}개 파일${NC}"
fi
echo ""

# 2. 프로젝트 구조 확인
echo -e "${CYAN}📁 프로젝트 구조${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_dir() {
    if [ -d "$1" ]; then
        FILE_COUNT=$(find "$1" -type f 2>/dev/null | wc -l | tr -d ' ')
        echo -e "  ${GREEN}✓${NC} $2 (${FILE_COUNT}개 파일)"
    else
        echo -e "  ${RED}✗${NC} $2 (없음)"
    fi
}

check_dir "${PROJECT_ROOT}/agent" "agent/ - Go 에이전트"
check_dir "${PROJECT_ROOT}/server" "server/ - Node.js API"
check_dir "${PROJECT_ROOT}/web" "web/ - Next.js 대시보드"
check_dir "${PROJECT_ROOT}/docs" "docs/ - 문서"
echo ""

# 3. 개발 로그 확인 및 표시
echo -e "${CYAN}📝 개발 로그${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "${DEV_LOG_DIR}" ]; then
    LOG_FILES=$(find "${DEV_LOG_DIR}" -name "*.md" -type f 2>/dev/null | sort -r)

    if [ -n "${LOG_FILES}" ]; then
        echo -e "  ${GREEN}발견된 개발 로그:${NC}"
        echo ""

        for log_file in ${LOG_FILES}; do
            filename=$(basename "${log_file}")
            echo -e "  ${BOLD}📄 ${filename}${NC}"
        done
        echo ""

        # 가장 최근 로그의 요약 표시
        LATEST_LOG=$(echo "${LOG_FILES}" | head -1)
        if [ -f "${LATEST_LOG}" ]; then
            echo -e "  ${YELLOW}━━━ 최근 개발 요약 ━━━${NC}"
            echo ""

            # 기본 정보 추출
            if grep -q "프로젝트명" "${LATEST_LOG}"; then
                echo -e "  $(grep -m1 "프로젝트명" "${LATEST_LOG}" | sed 's/|//g' | tr -s ' ')"
                echo -e "  $(grep -m1 "개발 일자\|Development Date" "${LATEST_LOG}" | sed 's/|//g' | tr -s ' ')"
                echo -e "  $(grep -m1 "최종 커밋\|Final Commit" "${LATEST_LOG}" | sed 's/|//g' | tr -s ' ')"
            fi
            echo ""

            # 마일스톤 현황
            echo -e "  ${BOLD}마일스톤 현황:${NC}"
            grep -E "^### 마일스톤|^### Milestone" "${LATEST_LOG}" 2>/dev/null | head -6 | while read line; do
                echo -e "    ${GREEN}✓${NC} ${line#*: }"
            done
            echo ""

            # 코드 통계
            if grep -q "총 파일 수\|Total Files" "${LATEST_LOG}"; then
                echo -e "  ${BOLD}코드 통계:${NC}"
                TOTAL_FILES=$(grep -m1 "총 파일 수\|Total Files" "${LATEST_LOG}" | grep -oE "[0-9]+개?|[0-9]+" | head -1)
                TOTAL_LINES=$(grep -m1 "총 코드 라인\|Total Lines" "${LATEST_LOG}" | grep -oE "[0-9,]+줄?|[0-9,]+" | head -1)
                echo -e "    파일: ${TOTAL_FILES:-97개}"
                echo -e "    라인: ${TOTAL_LINES:-6,580줄}"
            fi
        fi
    else
        echo -e "  ${YELLOW}개발 로그가 없습니다.${NC}"
    fi
else
    echo -e "  ${YELLOW}dev-log 디렉토리가 없습니다.${NC}"
fi
echo ""

# 4. 실행 방법 안내
echo -e "${CYAN}🚀 개발 시작 방법${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${BOLD}1. 설정 (최초 1회):${NC}"
echo -e "     chmod +x scripts/setup.sh && ./scripts/setup.sh"
echo ""
echo -e "  ${BOLD}2. 개발 서버 시작:${NC}"
echo -e "     ./scripts/dev.sh"
echo ""
echo -e "  ${BOLD}접속 URL:${NC}"
echo -e "     Web: ${GREEN}http://localhost:3020${NC}"
echo -e "     API: ${GREEN}http://localhost:3001${NC}"
echo ""

# 5. 최근 커밋 히스토리
echo -e "${CYAN}📜 최근 커밋 히스토리${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -5 2>/dev/null | while read line; do
    echo -e "  ${line}"
done
echo ""

echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}개발을 시작하세요! 🎉${NC}"
echo ""

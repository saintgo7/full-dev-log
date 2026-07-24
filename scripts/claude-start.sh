#!/bin/bash

# DevLog Hub - Claude/Gemini 시작 래퍼 스크립트
#
# 사용법:
#   ./scripts/claude-start.sh        # Claude 실행
#   ./scripts/claude-start.sh gemini # Gemini 실행
#
# 글로벌 설치:
#   echo 'alias devlog-claude="/Users/saint/01_DEV/26-full-dev-log/scripts/claude-start.sh"' >> ~/.zshrc
#   echo 'alias devlog-gemini="/Users/saint/01_DEV/26-full-dev-log/scripts/claude-start.sh gemini"' >> ~/.zshrc

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AI_TOOL="${1:-claude}"

# 프로젝트 디렉토리로 이동
cd "${PROJECT_ROOT}"

# 개발 재시작 스크립트 실행
if [ -f "./scripts/dev-resume.sh" ]; then
    chmod +x ./scripts/dev-resume.sh
    ./scripts/dev-resume.sh
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 ${AI_TOOL} 실행 중..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# AI 도구 실행
if command -v "${AI_TOOL}" &> /dev/null; then
    if [ "${AI_TOOL}" = "claude" ]; then
        exec "${AI_TOOL}" --dangerously-skip-permissions
    else
        exec "${AI_TOOL}"
    fi
else
    echo "⚠️  ${AI_TOOL} 명령을 찾을 수 없습니다."
    echo "   설치 확인: which ${AI_TOOL}"
    exit 1
fi

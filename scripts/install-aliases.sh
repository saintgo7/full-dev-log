#!/bin/bash

# DevLog Hub - Shell Alias 설치 스크립트
#
# 이 스크립트는 devlog-claude, devlog-gemini 명령을 전역으로 사용할 수 있도록 설정합니다.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHELL_RC=""

# 현재 쉘 확인
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "/bin/bash" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    echo "지원하지 않는 쉘입니다. 수동으로 alias를 추가해주세요."
    exit 1
fi

echo "DevLog Hub - Shell Alias 설치"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "설정 파일: ${SHELL_RC}"
echo ""

# Alias 문자열
ALIAS_BLOCK="
# DevLog Hub aliases
alias devlog='cd ${PROJECT_ROOT}'
alias devlog-claude='${PROJECT_ROOT}/scripts/claude-start.sh'
alias devlog-gemini='${PROJECT_ROOT}/scripts/claude-start.sh gemini'
alias devlog-resume='${PROJECT_ROOT}/scripts/dev-resume.sh'
alias devlog-dev='cd ${PROJECT_ROOT} && ./scripts/dev.sh'
"

# 이미 설치되어 있는지 확인
if grep -q "DevLog Hub aliases" "${SHELL_RC}" 2>/dev/null; then
    echo "⚠️  이미 설치되어 있습니다."
    echo ""
    echo "재설치하려면 ${SHELL_RC}에서 'DevLog Hub aliases' 섹션을 제거 후 다시 실행하세요."
    exit 0
fi

# Alias 추가
echo "${ALIAS_BLOCK}" >> "${SHELL_RC}"

echo "✅ 설치 완료!"
echo ""
echo "사용 가능한 명령:"
echo "  devlog         - 프로젝트 디렉토리로 이동"
echo "  devlog-claude  - 개발 로그 표시 후 Claude 실행"
echo "  devlog-gemini  - 개발 로그 표시 후 Gemini 실행"
echo "  devlog-resume  - 개발 로그 표시"
echo "  devlog-dev     - 개발 서버 시작"
echo ""
echo "적용하려면 새 터미널을 열거나 다음 명령을 실행하세요:"
echo "  source ${SHELL_RC}"
echo ""

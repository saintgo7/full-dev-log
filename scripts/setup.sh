#!/bin/bash

set -e

echo "🚀 DevLog Hub - 개발 환경 설정"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker가 실행되지 않았습니다. Docker를 시작해주세요.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker 확인 완료${NC}"

# Start PostgreSQL
echo ""
echo "📦 PostgreSQL 시작 중..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ PostgreSQL 준비 대기 중..."
sleep 5

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U devlog > /dev/null 2>&1; do
    echo "   PostgreSQL 시작 대기 중..."
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL 준비 완료${NC}"

# Setup Server
echo ""
echo "📦 Server 설정 중..."
cd server

if [ ! -f ".env" ]; then
    echo "   .env 파일 생성 중..."
    cat > .env << EOF
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://devlog:devlog_secret@localhost:5432/devlog"

# JWT
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
EOF
fi

echo "   의존성 설치 중..."
npm install

echo "   Prisma 클라이언트 생성 중..."
npx prisma generate

echo "   데이터베이스 마이그레이션 중..."
npx prisma db push

echo -e "${GREEN}✓ Server 설정 완료${NC}"

# Setup Web
echo ""
echo "📦 Web 설정 중..."
cd ../web

if [ ! -f ".env.local" ]; then
    echo "   .env.local 파일 생성 중..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
fi

echo "   의존성 설치 중..."
npm install

echo -e "${GREEN}✓ Web 설정 완료${NC}"

# Setup Agent
echo ""
echo "📦 Agent 설정 중..."
cd ../agent

if [ ! -f "config.yaml" ]; then
    echo "   config.yaml 파일 생성 중..."
    cat > config.yaml << EOF
server:
  url: "http://localhost:3001"
  api_token: ""  # 웹 대시보드에서 에이전트 생성 후 토큰 입력

collector:
  git:
    enabled: true
    poll_interval: 30s
  file:
    enabled: true
    watch_paths:
      - "."
    ignore_patterns:
      - ".git"
      - "node_modules"
      - ".next"
      - "dist"
      - "*.log"

sync:
  interval: 60s
  batch_size: 100

storage:
  path: "./data/devlog.db"

log:
  level: "info"
EOF
fi

echo "   Go 의존성 설치 중..."
go mod tidy

echo -e "${GREEN}✓ Agent 설정 완료${NC}"

cd ..

echo ""
echo "================================"
echo -e "${GREEN}🎉 설정 완료!${NC}"
echo ""
echo "개발 서버 시작 방법:"
echo ""
echo -e "${YELLOW}1. Server 시작:${NC}"
echo "   cd server && npm run dev"
echo ""
echo -e "${YELLOW}2. Web 시작 (새 터미널):${NC}"
echo "   cd web && npm run dev"
echo ""
echo -e "${YELLOW}3. Agent 빌드 및 실행 (새 터미널):${NC}"
echo "   cd agent && go build -o devlog-agent ./cmd/devlog-agent"
echo "   ./devlog-agent"
echo ""
echo "접속 URL:"
echo "  - Web: http://localhost:3000"
echo "  - API: http://localhost:3001"
echo ""

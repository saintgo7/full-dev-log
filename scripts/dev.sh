#!/bin/bash

# DevLog Hub - 개발 서버 동시 실행

echo "🚀 DevLog Hub 개발 서버 시작"
echo "================================"

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker가 실행되지 않았습니다."
    exit 1
fi

# Start PostgreSQL if not running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "📦 PostgreSQL 시작 중..."
    docker-compose up -d postgres redis
    sleep 5
fi

# Install concurrently if needed
if ! command -v concurrently &> /dev/null; then
    echo "📦 concurrently 설치 중..."
    npm install -g concurrently
fi

# Run all services
echo ""
echo "🔄 서비스 시작 중..."
echo "  - Server: http://localhost:3001"
echo "  - Web: http://localhost:3020"
echo ""

concurrently \
    --names "SERVER,WEB" \
    --prefix-colors "blue,green" \
    "cd server && npm run dev" \
    "cd web && npm run dev"

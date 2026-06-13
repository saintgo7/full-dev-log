#!/bin/bash
# ============================================
# DevLog Hub - Docker Build Script
# Build all images with proper tags
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
VERSION="${VERSION:-latest}"
REGISTRY="${REGISTRY:-}"
PUSH="${PUSH:-false}"
PLATFORM="${PLATFORM:-linux/amd64}"
BUILD_TARGET="${BUILD_TARGET:-production}"

# Image names
SERVER_IMAGE="devlog-hub/server"
WEB_IMAGE="devlog-hub/web"
AGENT_IMAGE="devlog-hub/agent"

# Parse command line arguments
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -v, --version VERSION    Set version tag (default: latest)"
    echo "  -r, --registry REGISTRY  Set container registry (e.g., ghcr.io/username)"
    echo "  -p, --push               Push images to registry after build"
    echo "  --platform PLATFORM      Set build platform (default: linux/amd64)"
    echo "  --server-only            Build only server image"
    echo "  --web-only               Build only web image"
    echo "  --agent-only             Build only agent image"
    echo "  --no-cache               Build without cache"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -v 1.0.0"
    echo "  $0 -v 1.0.0 -r ghcr.io/saintgo7 -p"
    echo "  $0 --server-only --no-cache"
}

BUILD_SERVER=true
BUILD_WEB=true
BUILD_AGENT=true
NO_CACHE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -p|--push)
            PUSH="true"
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --server-only)
            BUILD_WEB=false
            BUILD_AGENT=false
            shift
            ;;
        --web-only)
            BUILD_SERVER=false
            BUILD_AGENT=false
            shift
            ;;
        --agent-only)
            BUILD_SERVER=false
            BUILD_WEB=false
            shift
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Prepend registry if specified
if [ -n "$REGISTRY" ]; then
    SERVER_IMAGE="${REGISTRY}/${SERVER_IMAGE}"
    WEB_IMAGE="${REGISTRY}/${WEB_IMAGE}"
    AGENT_IMAGE="${REGISTRY}/${AGENT_IMAGE}"
fi

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}DevLog Hub - Docker Build${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Version:  ${GREEN}${VERSION}${NC}"
echo -e "Registry: ${GREEN}${REGISTRY:-local}${NC}"
echo -e "Platform: ${GREEN}${PLATFORM}${NC}"
echo -e "Push:     ${GREEN}${PUSH}${NC}"
echo ""

# Build timestamp
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Function to build image
build_image() {
    local context=$1
    local image=$2
    local dockerfile=${3:-Dockerfile}

    echo -e "${YELLOW}Building ${image}:${VERSION}...${NC}"

    docker build \
        ${NO_CACHE} \
        --platform "$PLATFORM" \
        --target "$BUILD_TARGET" \
        --build-arg BUILD_TIME="$BUILD_TIME" \
        --build-arg GIT_COMMIT="$GIT_COMMIT" \
        --build-arg VERSION="$VERSION" \
        -t "${image}:${VERSION}" \
        -t "${image}:latest" \
        -f "${context}/${dockerfile}" \
        "$context"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully built ${image}:${VERSION}${NC}"
    else
        echo -e "${RED}Failed to build ${image}${NC}"
        exit 1
    fi
}

# Function to push image
push_image() {
    local image=$1

    if [ "$PUSH" = "true" ]; then
        echo -e "${YELLOW}Pushing ${image}:${VERSION}...${NC}"
        docker push "${image}:${VERSION}"
        docker push "${image}:latest"
        echo -e "${GREEN}Successfully pushed ${image}${NC}"
    fi
}

# Build images
cd "$PROJECT_ROOT"

if [ "$BUILD_SERVER" = true ]; then
    build_image "./server" "$SERVER_IMAGE"
    push_image "$SERVER_IMAGE"
fi

if [ "$BUILD_WEB" = true ]; then
    build_image "./web" "$WEB_IMAGE"
    push_image "$WEB_IMAGE"
fi

if [ "$BUILD_AGENT" = true ]; then
    build_image "./agent" "$AGENT_IMAGE"
    push_image "$AGENT_IMAGE"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}Build complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "Built images:"
if [ "$BUILD_SERVER" = true ]; then
    echo -e "  - ${GREEN}${SERVER_IMAGE}:${VERSION}${NC}"
fi
if [ "$BUILD_WEB" = true ]; then
    echo -e "  - ${GREEN}${WEB_IMAGE}:${VERSION}${NC}"
fi
if [ "$BUILD_AGENT" = true ]; then
    echo -e "  - ${GREEN}${AGENT_IMAGE}:${VERSION}${NC}"
fi

# Show image sizes
echo ""
echo "Image sizes:"
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep "devlog-hub" | head -10

echo ""
echo -e "${YELLOW}To run the stack:${NC}"
echo "  docker-compose up -d"
echo ""
echo -e "${YELLOW}To run with agent:${NC}"
echo "  docker-compose --profile with-agent up -d"

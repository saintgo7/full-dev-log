# ============================================
# DevLog Hub - Server Dockerfile
# Multi-stage build for production optimization
# ============================================

# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy package.json for reference
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Copy production node_modules
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy Prisma schema and generated client
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]

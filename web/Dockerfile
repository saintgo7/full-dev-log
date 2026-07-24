# ============================================
# DevLog Hub - Web Dashboard Dockerfile
# Multi-stage build for Next.js standalone output
# ============================================

# Dependencies stage
FROM node:20-alpine AS deps

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# ============================================
# Build stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application (standalone output)
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3020
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy public assets
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3020

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3020/api/health || exit 1

# Start the application
CMD ["node", "server.js"]

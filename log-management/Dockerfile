# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json yarn.lock* ./
RUN apk add --no-cache libc6-compat && \
    yarn install --frozen-lockfile && \
    yarn cache clean

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN yarn build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init and security updates
RUN apk add --no-cache dumb-init && \
    apk upgrade --no-cache

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV PORT 3007

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create logs directory
RUN mkdir -p logs && chown nextjs:nodejs logs

USER nextjs

EXPOSE 3007

# Health check optimized for Next.js
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3007/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "server.js"]
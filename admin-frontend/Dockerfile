# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc6-compat for better compatibility
RUN apk add --no-cache libc6-compat

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile && yarn cache clean

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
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
ENV PORT 30009

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 30009

# Health check for Next.js app
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:30009', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "server.js"]

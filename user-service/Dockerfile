# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json yarn.lock* ./
RUN apk add --no-cache libc6-compat && \
    yarn install --frozen-lockfile --production=false && \
    yarn cache clean

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build && \
    yarn install --frozen-lockfile --production=true && \
    yarn cache clean

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling and security updates
RUN apk add --no-cache dumb-init && \
    apk upgrade --no-cache

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check with shorter timeout
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/app.js"]
# Production Multi-stage Dockerfile for Orchestrator Admin Panel
# Based on Next.js official Docker example
# Refs: https://nextjs.org/docs/app/guides/self-hosting
#       https://nextjs.org/docs/app/getting-started/deploying

# Stage 1: Builder
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install pnpm for build
RUN corepack enable

# Copy source code FIRST (includes workspace config)
COPY . .

# Install dependencies (will create proper symlinks)
RUN pnpm install --frozen-lockfile

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build the admin app
# Note: This runs next build which generates .next directory
# Run from admin directory to ensure correct node_modules resolution
RUN cd apps/admin && pnpm build

# Stage 2: Runner (minimal production image)
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3002 \
    MODELS_PATH=/models \
    OUTPUT_PATH=/output

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/apps/admin/package.json ./apps/admin/
COPY --from=builder /app/apps/admin/scripts ./apps/admin/scripts

# Copy root package.json and node_modules for pnpm workspace
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Install pnpm in runner
RUN corepack enable

# Note: Running as root for simplicity in dev/test environments
# For production, uncomment the USER line and ensure proper permissions

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Set working directory to admin app (next needs to find .next/ in current dir)
WORKDIR /app/apps/admin

# Start production server directly without cross-env
# Note: NODE_OPTIONS already set in ENV
# Use absolute path from root node_modules (pnpm workspace)
CMD ["/app/node_modules/.bin/next", "start", "-p", "3002", "-H", "0.0.0.0"]

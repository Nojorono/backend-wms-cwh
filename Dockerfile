# Multi-stage build for production
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Verify package-lock.json exists and install dependencies
# Fallback to npm install if npm ci fails (e.g., lockfileVersion compatibility issues)
RUN if [ ! -f package-lock.json ]; then \
      echo "Warning: package-lock.json not found, generating it..." && \
      npm install --package-lock-only; \
    fi && \
    (npm ci --prefer-offline --no-audit || (echo "npm ci failed, falling back to npm install..." && npm install --no-audit))

# Copy source code
COPY . .

# Build the application (nest-cli.json copies email template assets into dist)
RUN npm run build && \
    test -f dist/email/template-email/layouts/email-base.layout.html

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Verify package-lock.json exists and install only production dependencies
# Fallback to npm install if npm ci fails
RUN if [ ! -f package-lock.json ]; then \
      echo "Warning: package-lock.json not found, generating it..." && \
      npm install --package-lock-only --only=production; \
    fi && \
    (npm ci --only=production --prefer-offline --no-audit || (echo "npm ci failed, falling back to npm install..." && npm install --only=production --no-audit)) && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && \
    chown -R nestjs:nodejs /app/logs

# Switch to non-root user
USER nestjs

# Expose port (default 3000, but can be overridden via PORT env var)
EXPOSE 3000

# Health check - uses PORT env var or defaults to 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD sh -c "node -e \"const port = process.env.PORT || '3000'; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))\""

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main"]


# Multi-stage build for VibeTune
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev \
    ffmpeg \
    wget \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install dependencies using npm
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p storage/offline storage/cache logs

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies for production
RUN apk add --no-cache \
    sqlite \
    sqlite-dev \
    ffmpeg \
    python3 \
    make \
    g++ \
    wget \
    curl

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S vibetune -u 1001

# Set working directory
WORKDIR /app

# Copy package files  
COPY package*.json ./
COPY package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder --chown=vibetune:nodejs /app/dist ./dist
COPY --from=builder --chown=vibetune:nodejs /app/public ./public
COPY --from=builder --chown=vibetune:nodejs /app/server ./server
COPY --from=builder --chown=vibetune:nodejs /app/shared ./shared

# Create storage directories with proper permissions
RUN mkdir -p storage/offline storage/cache logs && \
    chown -R vibetune:nodejs storage logs

# Copy environment template (filename in repo is env.example)
COPY env.example .env

# Switch to non-root user
USER vibetune

# Expose port
EXPOSE 8084

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8084/api/ping || exit 1

# Start the application
CMD ["npm", "start"]
# Build stage
FROM node:20-alpine AS builder

# Install build dependencies only
RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /app

# Copy package files for better Docker layer caching
COPY package*.json ./

# Install ALL dependencies (needed for build) - optimized for speed
RUN npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p storage/offline storage/cache logs

# Build the application
RUN npm run build

# Production stage - minimal image
FROM node:20-alpine AS production

# Install only runtime dependencies
RUN apk add --no-cache sqlite sqlite-dev ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (faster & smaller image)
RUN npm install --only=production --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/storage ./storage
COPY --from=builder /app/public ./public
COPY --from=builder /app/models ./models
COPY env.example .env

# Create runtime directories
RUN mkdir -p storage/offline storage/cache logs

EXPOSE 8080

CMD ["npm", "start"]

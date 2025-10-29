# Simple single-stage build for VibeTune
FROM node:20-alpine

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

# (Keep npm defaults; we'll pass flags to install to avoid issues)

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install all dependencies (omit optional to reduce failures)
RUN npm install --legacy-peer-deps --no-audit --no-fund --omit=optional

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p storage/offline storage/cache logs

# Build the application
RUN npm run build

# Copy environment template
COPY env.example .env

# Expose port (server defaults to 8080; Render sets PORT at runtime)
EXPOSE 8080

# Remove healthcheck to avoid false negatives during cold starts

# Start the application
CMD ["npm", "start"]

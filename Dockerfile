FROM node:20-alpine

# Install all system dependencies once
RUN apk add --no-cache python3 make g++ sqlite sqlite-dev ffmpeg

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies with aggressive optimization
RUN npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline --no-optional

# Copy source code
COPY . .

# Create directories
RUN mkdir -p storage/offline storage/cache logs

# Build application
RUN npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production --legacy-peer-deps && \
    npm cache clean --force && \
    rm -rf /tmp/* /root/.npm

COPY env.example .env

EXPOSE 8080

CMD ["npm", "start"]

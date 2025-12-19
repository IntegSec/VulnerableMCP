# Vulnerable MCP Server - Dockerfile
# Created by IntegSec (https://integsec.com)
# Licensed under CC BY 4.0

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY data/ ./data/

# Build TypeScript
RUN npm run build

# Initialize database
RUN node scripts/setup-database.js

# Expose ports for HTTP/SSE and WebSocket
EXPOSE 3000 3001

# Set environment variables
ENV NODE_ENV=production
ENV FLAG_ENV_MASTER=FLAG{env_master}
ENV FLAG_RUG_PULL=FLAG{rug_pull_victim}

# Run all transports by default
CMD ["node", "dist/index.js", "--transport=all"]

# Health check on HTTP endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-dejavu-core \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/conversion-rules/package.json packages/conversion-rules/
COPY packages/conversion-engine/package.json packages/conversion-engine/
COPY workers/document-worker/package.json workers/document-worker/

RUN npm ci --workspace=@convert-hub/document-worker --include-workspace-root

COPY packages/shared packages/shared
COPY packages/conversion-engine packages/conversion-engine
COPY workers/document-worker workers/document-worker
COPY tsconfig.base.json ./

RUN npm run build --workspace=@convert-hub/shared \
    && npm run build --workspace=@convert-hub/conversion-engine \
    && npm run build --workspace=@convert-hub/document-worker

WORKDIR /app/workers/document-worker

CMD ["node", "dist/index.js"]

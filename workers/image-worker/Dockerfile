FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV IMAGE_WORKER_PYTHON=python3

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY workers/image-worker/package.json workers/image-worker/
COPY workers/image-worker/requirements.txt workers/image-worker/

RUN npm ci --workspace=@convert-hub/image-worker --include-workspace-root \
    && python3 -m pip install --no-cache-dir --break-system-packages \
      -r workers/image-worker/requirements.txt

COPY packages/shared packages/shared
COPY workers/image-worker workers/image-worker
COPY tsconfig.base.json ./

RUN npm run build --workspace=@convert-hub/shared \
    && npm run build --workspace=@convert-hub/image-worker

WORKDIR /app/workers/image-worker

CMD ["node", "dist/index.js"]

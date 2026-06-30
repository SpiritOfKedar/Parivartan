# Convert Hub

Multi-format file conversion platform (PDF, images, audio, video) — monorepo.

## Structure

```
apps/
  web/          Next.js frontend (tool pages, upload UI, client WASM)
  api/          Express API (jobs, presigned URLs, auth)
packages/
  shared/       Shared TypeScript types (Job, Tool, etc.)
  conversion-rules/  Client vs server routing per tool
workers/
  document-worker/   PDF/Office conversions (BullMQ consumer)
  media-worker/      FFmpeg jobs (BullMQ consumer)
infra/
  docker-compose.yml  Reserved for later (not used in local dev)
```

## Default ports

| Service | Port | Override |
|---------|------|----------|
| Web | **5174** | `apps/web/package.json` dev script |
| API | **8788** | `PORT` in `apps/api/.env` |

(Avoids 3000/3001 which are often taken on dev machines.)

## Prerequisites

- Node.js 20+
- [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) bucket (10 GB free tier)

No Docker required for now.

## Getting started

```bash
npm install

# Build shared packages (required before API/web can import them)
npm run build --workspace=@convert-hub/shared
npm run build --workspace=@convert-hub/conversion-rules

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Add B2 credentials to apps/api/.env, then:
npm run dev
```

- Web: http://localhost:5174
- API: http://localhost:8788/health

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web + API in parallel (via Turborepo) |
| `npm run build` | Build all packages and apps |
| `npm run typecheck` | Type-check all workspaces |

## Storage (Backblaze B2)

Files upload **directly to B2** via presigned URLs — the API never buffers file bytes.

1. Create a B2 bucket (note the **region**, e.g. `us-west-004`)
2. Create an **Application Key** scoped to that bucket (read, write, delete)
3. Set `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_REGION` in `apps/api/.env`
4. In the B2 console, add **lifecycle rules** to auto-delete `incoming/` and `outputs/` after 24h (privacy)

**Presign upload**

```bash
curl -X POST http://localhost:8788/api/uploads/presign \
  -H "Content-Type: application/json" \
  -d '{"fileName":"doc.pdf","mimeType":"application/pdf","sizeBytes":1024}'
```

Returns `uploadUrl` — `PUT` the file to that URL with the `Content-Type` header.

## Next steps

1. Wire BullMQ + Redis in API and workers (when you add infra)
2. Connect upload UI (Uppy) to the presign endpoint
3. Implement first tool end-to-end (e.g. merge PDF)

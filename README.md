# Convert Hub

![Under construction — cat in hard hat](docs/under-construction.png)

**Status:** under construction. Some tools work. Some tools work *sometimes*. We're not pretending otherwise.

Multi-format file conversion platform (PDF, images, audio, video). Monorepo because we have commitment issues with single folders.

## Structure

```
apps/
  web/          Next.js frontend (tool pages, upload UI, client WASM)
  api/          Express API (jobs, presigned URLs, auth)
packages/
  shared/       Shared TypeScript types (Job, Tool, etc.)
  conversion-rules/  Client vs server routing per tool
  conversion-engine/   Node.js PDF/Office conversion (it's a thing we wrote)
workers/
  document-worker/   PDF/Office conversions (Redis consumer)
  media-worker/      FFmpeg jobs (BullMQ consumer)
infra/
  docker-compose.yml  Reserved for later (not used in local dev)
```

## Default ports

| Service | Port | Override |
|---------|------|----------|
| Web | **5174** | `apps/web/package.json` dev script |
| API | **8788** | `PORT` in `apps/api/.env` |

(Not 3000/3001 because those are always taken on someone's laptop.)

## Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) Postgres (free tier)
- [Upstash](https://upstash.com) Redis (free tier)
- [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) bucket (10 GB free tier)

No Docker required for local dev. Unless you want Docker. We're not your boss.

## Getting started

```bash
npm install

# Build shared packages (required before API/web/worker can import them)
npm run build --workspace=@convert-hub/shared
npm run build --workspace=@convert-hub/conversion-rules
npm run build --workspace=@convert-hub/conversion-engine

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Add Neon, Upstash, and B2 credentials to apps/api/.env, then:
npm run db:migrate --workspace=@convert-hub/api
npm run dev
```

- Web: http://localhost:5174
- API: http://localhost:8788/health

If it doesn't start, check your `.env` files. That's usually the culprit.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web + API in parallel (via Turborepo) |
| `npm run dev:worker` | Start the document conversion worker |
| `npm run build` | Build all packages and apps |
| `npm run typecheck` | Type-check all workspaces |
| `npm run db:migrate --workspace=@convert-hub/api` | Apply pending SQL migrations to Neon |

## Database

Postgres via Neon. Put your connection string in `DATABASE_URL` in `apps/api/.env`.

```bash
npm run db:migrate --workspace=@convert-hub/api
```

## Queue

Redis via Upstash. Put the URL in `UPSTASH_REDIS_URL` in `apps/api/.env`.

## Storage (Backblaze B2)

Files upload to B2 via presigned URLs so the API doesn't have to hold your 40 MB PDF in memory.

1. Create a B2 bucket (note the **region**, e.g. `us-west-004`)
2. Create an **Application Key** scoped to that bucket (read, write, delete)
3. Set `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_REGION` in `apps/api/.env`
4. Add lifecycle rules in B2 to auto-delete `incoming/` and `outputs/` after 24h (privacy, and also so we don't pay for your forgotten uploads forever)

**Presign upload**

```bash
curl -X POST http://localhost:8788/api/uploads/presign \
  -H "Content-Type: application/json" \
  -d '{"fileName":"doc.pdf","mimeType":"application/pdf","sizeBytes":1024}'
```

Returns `uploadUrl` — `PUT` the file to that URL with the `Content-Type` header.

## Document worker (Office conversions)

PDF→Word/PPT/Excel and Word→PDF run in `workers/document-worker` using `packages/conversion-engine`.

**Expectations:** layout fidelity is not great. You get text and slides, not a pixel-perfect clone of your original. Scanned PDFs go through OCR which is slow and occasionally creative with spelling.

### Local development

```bash
npm run dev:worker
```

Word → PDF needs Chromium on your machine:

- Linux: `sudo apt install chromium` or `sudo dnf install chromium`
- Set `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` in `workers/document-worker/.env` if Puppeteer can't find it

Optional: `OCR_LANGUAGES=eng` for scanned PDF OCR.

### Docker

```bash
docker compose -f infra/docker-compose.yml build document-worker
docker compose -f infra/docker-compose.yml up document-worker
```

Image is Node 20 + Chromium. Configure secrets the same way you'd configure `apps/api/.env`.

## Next steps

1. Run `npm run dev` and optionally `npm run dev:worker`
2. Set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` (see `apps/web/.env.example`)
3. Set `GEMINI_API_KEY` and/or `NVIDIA_NIM_API_KEY` in `apps/api/.env` if you want the AI tools to do anything
